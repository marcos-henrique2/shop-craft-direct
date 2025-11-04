import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
// Importa o tipo Database apenas para documentação, sem forçar tipagem nas operações
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, Package, ShoppingCart, Upload, X, RefreshCw, Trash } from 'lucide-react';
import { z } from 'zod';

/**
 * Página administrativa para cadastramento de produtos e gerenciamento de pedidos.
 *
 * Esta implementação protege o acesso através do contexto de autenticação. Apenas
 * usuários logados e com papel de administrador podem acessar. A página contém
 * três abas: uma para cadastrar novos produtos, outra para gerenciar o estoque
 * e uma terceira para listar/gerenciar pedidos registrados na tabela `orders` do Supabase.
 */

// Schema de validação do produto
const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  quantity: z.number().int().min(0, 'Quantidade não pode ser negativa'),
});

// Tipos auxiliares
interface Category {
  id: string;
  name: string;
}

/**
 * Representa um pedido retornado pela API do Supabase. O pedido está
 * associado a um produto via a coluna `product_id` e contém informações
 * do cliente, quantidade solicitada e preço total. Após o fetch os
 * dados são normalizados para facilitar a exibição na interface.
 */
interface OrderRow {
  id: string;
  /** Nome do produto associado ao pedido */
  product_name: string;
  /** Preço unitário do produto no momento do pedido */
  price: number;
  /** Quantidade solicitada pelo cliente */
  quantity_requested: number;
  /** Quantidade em estoque no momento do pedido (pode ser null se não carregado) */
  stock_quantity: number;
  /** Status do pedido conforme enum `order_status` */
  status: 'pending' | 'confirmed' | 'cancelled';
  /** Data/hora de criação do pedido */
  created_at: string;
  /** Observações fornecidas pelo cliente */
  notes: string | null;
  /** Nome do cliente */
  customer_name: string;
  /** Telefone ou contato do cliente */
  customer_phone: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, roleLoading, signOut } = useAuth();
  const navigate = useNavigate();
  // Casting the Supabase client to `any` avoids TS errors when performing
  // insert/update operations. Without this cast the generic inference may
  // resolve to `never`, causing parameter type errors. See README for details.
  const supabaseClient: any = supabase;
  const [categories, setCategories] = useState<Category[]>([]);
  // Estados do formulário de produtos
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<'active' | 'out_of_stock' | 'restocking'>('active');
  const [categoryId, setCategoryId] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  // Estados de pedidos
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estados da lista de produtos cadastrados
  const [adminProducts, setAdminProducts] = useState<Array<{ id: string; name: string; price: number; quantity: number; status: 'active' | 'out_of_stock' | 'restocking'; }>>([]);
  const [loadingAdminProducts, setLoadingAdminProducts] = useState(false);
  // Armazena as quantidades editadas temporariamente para envio sob demanda
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});

  // Protege rota: se não estiver logado ou não for admin, redireciona
  useEffect(() => {
    // Apenas redireciona após a checagem completa de autenticação e papel.
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate('/login');
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // Carrega categorias para seleção de produto
  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  // Carrega pedidos quando a aba de pedidos for selecionada
  const fetchOrders = async () => {
    setLoadingOrders(true);
    /*
     * Faz uma consulta à tabela `orders` e inclui dados do produto associado via
     * relacionamento "products". Selecionamos apenas as colunas necessárias para
     * reduzir o payload. Após o fetch, transformamos cada linha no formato
     * esperado pela interface (OrderRow).
     */
    const { data, error } = await supabaseClient
      .from('orders')
      .select(
        `id, quantity, total_price, status, notes, created_at, customer_name, customer_phone, products(id, name, price, quantity, status)`
      )
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar pedidos');
      setLoadingOrders(false);
      return;
    }
    // Converte o resultado para OrderRow
    const formatted: OrderRow[] = (data || []).map((row: any) => {
      const product = row.products as any;
      return {
        id: row.id,
        product_name: product?.name || 'Produto removido',
        price: product?.price || 0,
        quantity_requested: row.quantity,
        stock_quantity: product?.quantity ?? 0,
        status: row.status as OrderRow['status'],
        created_at: row.created_at || row.created_at,
        notes: row.notes || null,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
      };
    });
    setOrders(formatted);
    setLoadingOrders(false);
  };

  /**
   * Busca todos os produtos cadastrados para exibição na aba de gerenciamento.
   */
  const fetchAdminProducts = async () => {
    setLoadingAdminProducts(true);
    const { data, error } = await supabaseClient
      .from('products')
      .select('id, name, price, quantity, status')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar produtos');
    } else {
      setAdminProducts(data || []);
    }
    setLoadingAdminProducts(false);
  };

  /**
   * Atualiza o status de um produto específico.
   */
  const handleProductStatusChange = async (productId: string, newStatus: 'active' | 'out_of_stock' | 'restocking') => {
    // Atualiza o status de forma direta. O cast para `any` evita erros de tipagem
    const { error } = await supabaseClient
      .from('products')
      .update({ status: newStatus } as any)
      .eq('id', productId);
    if (error) {
      toast.error('Erro ao atualizar status do produto');
      return;
    }
    toast.success('Status do produto atualizado');
    setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p));
  };

  /**
   * Exclui permanentemente um produto.
   */
  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabaseClient.from('products').delete().eq('id', productId);
    if (error) {
      toast.error('Erro ao excluir produto');
      return;
    }
    toast.success('Produto excluído');
    setAdminProducts(prev => prev.filter(p => p.id !== productId));
  };

  /**
   * Atualiza a quantidade em estoque de um produto quando o input perde o foco
   */
  const commitQuantityChange = async (productId: string) => {
    const newQtyStr = quantityEdits[productId];
    if (newQtyStr === undefined) return;
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty) || newQty < 0) {
      toast.error('Quantidade inválida');
      return;
    }
    const { error } = await supabaseClient
      .from('products')
      .update({ quantity: newQty } as any)
      .eq('id', productId);
    if (error) {
      toast.error('Erro ao atualizar quantidade');
    } else {
      toast.success('Quantidade atualizada');
      setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: newQty } : p));
      // remove da lista de edições
      setQuantityEdits(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const fetchCategories = async () => {
    // Busca apenas id e nome para otimizar a consulta e reduzir dados transferidos
    const { data, error } = await supabaseClient
      .from('categories')
      .select('id, name')
      .order('name');
    if (!error && data) {
      setCategories(data as Category[]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + imageFiles.length > 5) {
        toast.error('Máximo de 5 imagens por produto');
        return;
      }
      setImageFiles([...imageFiles, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }
      const { data: { publicUrl } } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      productSchema.parse({
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    setLoadingProduct(true);
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }
      // Insere produto como array para evitar erros de tipagem. Casting para `any` remove restrições do TS
      const { error } = await supabaseClient
        .from('products')
        .insert([
          {
            name,
            description: description || null,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            status,
            category_id: categoryId || null,
            images: imageUrls,
          },
        ] as any);
      if (error) throw error;
      toast.success('Produto cadastrado com sucesso!');
      // reseta formulário
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('');
      setStatus('active');
      setCategoryId('');
      setImageFiles([]);
    } catch (error: any) {
      toast.error('Erro ao cadastrar produto: ' + error.message);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleOrderStatusChange = async (order: OrderRow, newStatus: OrderRow['status']) => {
    // Atualiza o status do pedido na tabela `orders`
    const { error } = await supabaseClient
      .from('orders')
      .update({ status: newStatus } as any)
      .eq('id', order.id);
    if (error) {
      toast.error('Erro ao atualizar pedido');
      return;
    }
    toast.success('Status atualizado');
    // Atualiza estado local
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o)));
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Exclui o pedido na tabela `orders` pelo id
    const { error } = await supabaseClient
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (error) {
      toast.error('Erro ao excluir pedido');
      return;
    }
    toast.success('Pedido excluído');
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }
  if (!isAdmin) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="bg-card shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Painel Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>Ver Loja</Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />Cadastrar
            </TabsTrigger>
            <TabsTrigger value="catalog" onClick={fetchAdminProducts}>
              <RefreshCw className="mr-2 h-4 w-4" />Estoque
            </TabsTrigger>
            <TabsTrigger value="orders" onClick={fetchOrders}>
              <ShoppingCart className="mr-2 h-4 w-4" />Pedidos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Novo Produto</CardTitle>
                <CardDescription>Preencha os dados do produto para adicionar ao catálogo</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="Ex: Produto Incrível"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="out_of_stock">Esgotado</SelectItem>
                          <SelectItem value="restocking">Em Reposição</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={1000}
                      rows={4}
                      placeholder="Descreva as características do produto..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="images">Imagens (máximo 5)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('images')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />Adicionar Imagens
                      </Button>
                      <span className="text-sm text-muted-foreground">{imageFiles.length} imagem(ns) selecionada(s)</span>
                    </div>
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={loadingProduct} className="w-full md:w-auto">
                    {loadingProduct ? 'Cadastrando...' : 'Cadastrar Produto'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="catalog">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Cadastrados</CardTitle>
                <CardDescription>Edite quantidades, status ou exclua produtos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAdminProducts ? (
                  <p className="text-center py-4 text-muted-foreground">Carregando produtos...</p>
                ) : adminProducts.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Nenhum produto cadastrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border rounded-lg overflow-hidden">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Preço</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Quantidade</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {adminProducts.map(product => (
                          <tr key={product.id} className="hover:bg-secondary/50">
                            <td className="px-3 py-2 text-sm font-medium">{product.name}</td>
                            <td className="px-3 py-2 text-sm">R$ {product.price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm">
                              <Input
                                type="number"
                                min="0"
                                value={quantityEdits[product.id] ?? product.quantity.toString()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setQuantityEdits(prev => ({ ...prev, [product.id]: value }));
                                }}
                                onBlur={() => commitQuantityChange(product.id)}
                                className="w-20"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <Select value={product.status} onValueChange={(val: any) => handleProductStatusChange(product.id, val)}>
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="out_of_stock">Esgotado</SelectItem>
                                  <SelectItem value="restocking">Em Reposição</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Pedidos</CardTitle>
                <CardDescription>Visualize e gerencie os pedidos recebidos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <p className="text-center py-4 text-muted-foreground">Carregando pedidos...</p>
                ) : orders.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Nenhum pedido registrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border rounded-lg overflow-hidden">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Data</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Preço</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Qtd</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Estoque</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Contato</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-secondary/50">
                            {/* data/hora formatada */}
                            <td className="px-3 py-2 text-sm">{new Date(order.created_at).toLocaleString()}</td>
                            {/* nome do produto */}
                            <td className="px-3 py-2 text-sm">{order.product_name}</td>
                            {/* preço unitário */}
                            <td className="px-3 py-2 text-sm">R$ {order.price.toFixed(2)}</td>
                            {/* quantidade solicitada */}
                            <td className="px-3 py-2 text-sm">{order.quantity_requested}</td>
                            {/* quantidade em estoque */}
                            <td className="px-3 py-2 text-sm">{order.stock_quantity}</td>
                            {/* nome do cliente */}
                            <td className="px-3 py-2 text-sm">{order.customer_name}</td>
                            {/* contato do cliente */}
                            <td className="px-3 py-2 text-sm">{order.customer_phone}</td>
                            {/* status com badge */}
                            <td className="px-3 py-2 text-sm">
                              <Badge
                                variant={
                                  order.status === 'pending'
                                    ? 'secondary'
                                    : order.status === 'confirmed'
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {order.status === 'pending'
                                  ? 'Pendente'
                                  : order.status === 'confirmed'
                                  ? 'Confirmado'
                                  : 'Cancelado'}
                              </Badge>
                            </td>
                            {/* Ações: alterar status ou excluir */}
                            <td className="px-3 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={order.status}
                                  onValueChange={(val: any) => handleOrderStatusChange(order, val)}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteOrder(order.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;