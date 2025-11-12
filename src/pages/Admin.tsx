import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
// Importa o tipo Database apenas para documentação
import type { Database } from '@/integrations/supabase/types';

// Componentes de UI necessários
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Ícones
import { LogOut, Package, ShoppingCart, RefreshCw, Trash, Calculator } from 'lucide-react';

// REMOVEMOS: productSchema e 'zod'
// REMOVEMOS: o tipo 'Category'

/**
 * Representa um pedido retornado pela API do Supabase.
 */
interface OrderRow {
  id: string;
  product_name: string;
  price: number;
  quantity_requested: number;
  stock_quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  notes: string | null;
  customer_name: string;
  customer_phone: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, roleLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const supabaseClient: any = supabase;

  // REMOVEMOS: States do formulário de produto (name, description, price, etc.)
  
  // Estados de pedidos
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estados da lista de produtos cadastrados (Estoque)
  const [adminProducts, setAdminProducts] = useState<Array<{ id: string; name: string; price: number; quantity: number; status: 'active' | 'out_of_stock' | 'restocking'; }>>([]);
  const [loadingAdminProducts, setLoadingAdminProducts] = useState(false);
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});

  // Protege rota
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate('/login');
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // REMOVEMOS: useEffect que buscava categorias

  // Carrega pedidos
  const fetchOrders = async () => {
    setLoadingOrders(true);
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
    const { error } = await supabaseClient
      .from('products')
      .update({ status: newStatus })
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
      .update({ quantity: newQty })
      .eq('id', productId);
    if (error) {
      toast.error('Erro ao atualizar quantidade');
    } else {
      toast.success('Quantidade atualizada');
      setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: newQty } : p));
      setQuantityEdits(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // REMOVEMOS: Funções 'fetchCategories', 'handleImageChange', 'removeImage', 'uploadImages', 'handleProductSubmit'

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleOrderStatusChange = async (order: OrderRow, newStatus: OrderRow['status']) => {
    const { error } = await supabaseClient
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);
    if (error) {
      toast.error('Erro ao atualizar pedido');
      return;
    }
    toast.success('Status atualizado');
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o)));
  };

  const handleDeleteOrder = async (orderId: string) => {
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
              
              <Button variant="outline" onClick={() => navigate('/admin/calculadora')}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculadora
              </Button>

              <Button variant="outline" onClick={() => navigate('/')}>Ver Loja</Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* --- VALOR PADRÃO MUDADO PARA "catalog" --- */}
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList>
            {/* --- ABA "Cadastrar" REMOVIDA --- */}
            
            <TabsTrigger value="catalog" onClick={fetchAdminProducts}>
              <RefreshCw className="mr-2 h-4 w-4" />Estoque
            </TabsTrigger>
            <TabsTrigger value="orders" onClick={fetchOrders}>
              <ShoppingCart className="mr-2 h-4 w-4" />Pedidos
            </TabsTrigger>
          </TabsList>

          {/* --- BLOCO <TabsContent value="products"> REMOVIDO --- */}

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
                            <td className="px-3 py-2 text-sm">{new Date(order.created_at).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm">{order.product_name}</td>
                            <td className="px-3 py-2 text-sm">R$ {order.price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm">{order.quantity_requested}</td>
                            <td className="px-3 py-2 text-sm">{order.stock_quantity}</td>
                            <td className="px-3 py-2 text-sm">{order.customer_name}</td>
                            <td className="px-3 py-2 text-sm">{order.customer_phone}</td>
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