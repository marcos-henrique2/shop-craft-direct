import { useState, useEffect } from 'react';
import { ProductCalculatorForm } from '@/pages/admin/components/ProductCalculatorForm';
import { calculateCosts } from '@/utils/calculator';
import { CalculatorInputs, CalculationResults, Quote } from '@/types/calculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// --- 1. IMPORTAR NOVOS ÍCONES: Upload e X ---
import { ArrowLeft, PackageCheck, Loader2, Download, Save, Trash, Edit, List, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

import { ProductResultsDisplay } from './components/ProductResultsDisplay';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { toast as sonnerToast } from 'sonner';

// Valores iniciais para o formulário
const initialInputs: CalculatorInputs = {
  clientName: '', pieceName: '', quantity: 1, material: 'PLA', manualPainting: false,
  filamentPrice: 120, filamentUsed: 0, printTimeHours: 0, printTimeMinutes: 0,
  printerPower: 150, energyRate: 0.92, printerValue: 2000, printerLifespan: 5000,
  hourlyRate: 20, activeWorkTime: 0.5, finishingCost: 0, maintenanceCost: 0.5,
  failureRate: 5, complexity: 'simple', profitMargin: 100, additionalFee: 0,
  desiredPrice: undefined,
};

const CalculatorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); 
  const supabaseClient: any = supabase;
  
  const [inputs, setInputs] = useState<CalculatorInputs>(initialInputs);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [description, setDescription] = useState('');
  const [stockQuantity, setStockQuantity] = useState(1);
  
  // --- 2. ATUALIZAR ESTADO PARA MÚLTIPLAS IMAGENS ---
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [activeTab, setActiveTab] = useState("publish");
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!user) return;
    setLoadingQuotes(true);
    const { data, error } = await supabaseClient
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      sonnerToast.error("Erro ao buscar orçamentos.", { description: error.message });
    } else {
      setSavedQuotes(data as Quote[]);
    }
    setLoadingQuotes(false);
  };

  useEffect(() => {
    if (activeTab === 'quotes') {
      fetchQuotes();
    }
  }, [user, activeTab]);

  const handleCalculate = () => {
    const calculatedResults = calculateCosts(inputs);
    setResults(calculatedResults);
  };

  // --- 3. ADICIONAR FUNÇÕES DE MANIPULAÇÃO DE IMAGEM (DO Admin.tsx) ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + imageFiles.length > 5) {
        sonnerToast.error('Máximo de 5 imagens por produto');
        return;
      }
      setImageFiles([...imageFiles, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };
  // --- FIM DAS FUNÇÕES DE IMAGEM ---

  const handleSaveQuote = async () => {
    if (!results || !user) {
      toast({ title: "Calcule primeiro", description: "Você precisa calcular um resultado antes de salvar.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const quoteData = {
      client_name: inputs.clientName || 'Orçamento',
      piece_name: inputs.pieceName || 'Peça',
      inputs_data: inputs,
      results_data: results,
      user_id: user.id
    };
    if (editingQuoteId) {
      const { error } = await supabaseClient
        .from('quotes')
        .update(quoteData) 
        .eq('id', editingQuoteId);
      if (error) sonnerToast.error("Erro ao atualizar orçamento", { description: error.message });
      else sonnerToast.success("Orçamento atualizado com sucesso!");
    } else {
      const { error } = await supabaseClient
        .from('quotes')
        .insert([quoteData]); 
      if (error) sonnerToast.error("Erro ao salvar orçamento", { description: error.message });
      else sonnerToast.success("Orçamento salvo com sucesso!");
    }
    await fetchQuotes(); 
    setIsSaving(false);
    setActiveTab("quotes"); 
  };

  const handleLoadQuote = (quote: Quote) => {
    setInputs(quote.inputs_data);
    setResults(quote.results_data);
    setEditingQuoteId(quote.id); 
    setActiveTab("publish"); 
    toast({ title: "Orçamento Carregado", description: `Editando: ${quote.piece_name}` });
  };

  const handleDeleteQuote = async (quoteId: string) => {
    const { error } = await supabaseClient
      .from('quotes')
      .delete()
      .eq('id', quoteId);
    if (error) sonnerToast.error("Erro ao excluir orçamento", { description: error.message });
    else {
      sonnerToast.success("Orçamento excluído.");
      setSavedQuotes(prev => prev.filter(q => q.id !== quoteId)); 
    }
  };

  // --- 4. ATUALIZAR FUNÇÃO DE PUBLICAR NA LOJA ---
  const handlePublishToStore = async () => {
    // Validar se temos pelo menos uma imagem
    if (!results || !inputs.pieceName || !description || imageFiles.length === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome da Peça, Descrição e ao menos uma Imagem são necessários.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPublishing(true);
    const uploadedUrls: string[] = []; // Array para guardar as URLs

    try {
      // Loop para fazer upload de cada imagem
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`; // Nome de arquivo mais seguro
        const filePath = `${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = await supabaseClient.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);
        
        uploadedUrls.push(urlData.publicUrl);
      }

      // Preparar o novo produto com o array de URLs
      const newProduct = {
        name: inputs.pieceName,
        description: description,
        price: results.finalPricePerUnit,
        quantity: stockQuantity,
        status: 'active',
        category_id: null,
        images: uploadedUrls, // Salvar o array de URLs
      };

      const { error: insertError } = await supabaseClient
        .from('products')
        .insert([newProduct]);
        
      if (insertError) throw insertError;
      
      toast({
        title: 'Produto Publicado!',
        description: `"${inputs.pieceName}" foi adicionado à loja com ${uploadedUrls.length} imagem(ns).`,
      });
      navigate('/admin');
    } catch (error: any) {
      console.error('Erro ao publicar:', error);
      toast({
        title: 'Erro ao publicar produto',
        description: error.message || 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // --- 5. ATUALIZAR 'handleClearForm' ---
  const handleClearForm = () => {
    setInputs(initialInputs);
    setResults(null);
    setDescription('');
    setStockQuantity(1);
    setImageFiles([]); // Limpar array de imagens
    setEditingQuoteId(null);
    toast({ title: "Formulário Limpo" });
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Admin
      </Button>
      
      <h1 className="text-3xl font-bold my-6">Calculadora de Orçamento e Produto</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="publish">
            {editingQuoteId ? "Editando Orçamento" : "Calcular e Publicar"}
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <List className="mr-2 h-4 w-4" /> Gerenciar Orçamentos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="publish">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <ProductCalculatorForm
              inputs={inputs}
              setInputs={setInputs}
              onCalculate={handleCalculate}
            />
            
            <div className="space-y-6">
              {editingQuoteId && (
                <Button variant="outline" className="w-full" onClick={handleClearForm}>
                  Cancelar Edição (Limpar Formulário)
                </Button>
              )}
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Resultados e Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  {!results ? (
                    <p className="text-muted-foreground">
                      Preencha o formulário e clique em "Calcular Custos" para ver os resultados.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      <ProductResultsDisplay inputs={inputs} results={results} />
                      
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleSaveQuote}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        {editingQuoteId ? "Atualizar Orçamento" : "Salvar Orçamento"}
                      </Button>
                      
                      <Separator />
                      
                      {/* --- 6. ATUALIZAR UI DE PUBLICAÇÃO --- */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Publicar Produto na Loja</h3>
                        <p className="text-sm text-muted-foreground">
                          Use os campos abaixo para adicionar este item diretamente ao estoque da loja.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição do Produto</Label>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stock">Qtd. em Estoque</Label>
                            <Input id="stock" type="number" min="1" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} />
                          </div>
                        </div>

                        {/* --- UI de Upload de Múltiplas Imagens --- */}
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
                        {/* --- Fim da UI de Upload --- */}
                      </div>
                      
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handlePublishToStore}
                        disabled={isPublishing}
                      >
                        {isPublishing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />}
                        {isPublishing ? 'Publicando...' : 'Publicar Produto na Loja'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="quotes">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Orçamentos Salvos</CardTitle>
              <CardDescription>
                Gerencie, edite ou baixe os PDFs dos seus orçamentos salvos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuotes && <p className="text-muted-foreground text-center">Carregando orçamentos...</p>}
              {!loadingQuotes && savedQuotes.length === 0 && <p className="text-muted-foreground text-center">Nenhum orçamento salvo.</p>}
              
              <div className="space-y-4">
                {savedQuotes.map((quote) => (
                  <Card key={quote.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                    <div>
                      <p className="font-bold">{quote.piece_name || "Orçamento"}</p>
                      <p className="text-sm text-muted-foreground">
                        Cliente: {quote.client_name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Salvo em: {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateQuotePDF(quote.inputs_data, quote.results_data)}
                      >
                        <Download className="mr-2 h-4 w-4" /> PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadQuote(quote)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalculatorPage;