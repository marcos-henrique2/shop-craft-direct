import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Database } from '@/integrations/supabase/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Package, Clock, Layers } from 'lucide-react'

// Tipo base gerado pelo Supabase
type Product = Database['public']['Tables']['products']['Row']

// Tipo atualizado para incluir 'metadata'
type ProductWithDetails = Product & {
  images?: string[]
  metadata?: {
    material?: string;
    print_time_total_hours?: number;
    complexity?: string;
  } | null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // --- 1. A SOLUÇÃO: USAR O CLIENTE 'any' (igual ao Admin.tsx) ---
  const supabaseClient: any = supabase;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('ID do produto não encontrado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // --- 2. USAR 'supabaseClient' PARA A CONSULTA ---
        const { data, error } = await supabaseClient
          .from('products')
          .select('*, metadata') // Busca todos os campos E o metadata
          .eq('id', id)
          .eq('status', 'active') // Garante que só produtos ativos sejam mostrados
          .single() // Removido o <ProductWithDetails> genérico para confiar no 'any'

        if (error) throw error

        if (data) {
          setProduct(data as ProductWithDetails) // Forçamos o tipo aqui
          // Lógica original da galeria
          if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0])
          }
        } else {
          setError('Produto não encontrado.')
        }
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao buscar o produto.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Função do WhatsApp (Mantida)
  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const message = `Olá! Gostaria de pedir o produto: ${
      product.name
    }\nPreço: R$ ${product.price.toFixed(2)}\nTem disponível: ${
      product.quantity
    }`
    const whatsappUrl = `https://wa.me/5562982262543?text=${encodeURIComponent(
      message,
    )}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return <ProductSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Produto não encontrado.</h2>
      </div>
    )
  }

  const displayImage =
    selectedImage || product.images?.[0] || '/placeholder.svg'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      
      <Link
        to="/store"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a loja
      </Link>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da Galeria de Imagens (Original) */}
          <div className="p-4 md:p-6">
            <div className="mb-4 aspect-square w-full overflow-hidden rounded-lg border">
              <img
                src={displayImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                      selectedImage === imgUrl
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} miniatura ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna de Informações do Produto */}
          <div className="p-4 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="mb-4 text-3xl font-bold">
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-primary">
                  R$ {product.price.toFixed(2)}
                </span>
              </div>

              {/* Status e Estoque (Original) */}
              <div className="mb-6 flex items-center space-x-2">
                <Badge
                  variant={
                    product.status === 'active' ? 'default' : 'destructive'
                  }
                >
                  {product.status === 'active'
                    ? 'Disponível'
                    : 'Indisponível'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Estoque: {product.quantity}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-semibold">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap mb-6">
                {product.description || 'Este produto não possui descrição.'}
              </p>

              {/* Seção de Detalhes da Impressão (Nova) */}
              {product.metadata && (product.metadata.material || product.metadata.print_time_total_hours || product.metadata.complexity) && (
                <div className="mb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Detalhes da Impressão</h3>
                  <div className="space-y-3">
                    {product.metadata.material && (
                      <div className="flex items-center text-sm">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Material:</strong>
                        <span className="ml-2">{product.metadata.material}</span>
                      </div>
                    )}
                    {product.metadata.print_time_total_hours && (
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Tempo de Impressão:</strong>
                        <span className="ml-2">{product.metadata.print_time_total_hours.toFixed(1)} horas</span>
                      </div>
                    )}
                    {product.metadata.complexity && (
                      <div className="flex items-center text-sm">
                        <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Complexidade:</strong>
                        <Badge variant="outline" className="ml-2 capitalize">{product.metadata.complexity}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de WhatsApp (Original) */}
              <Button
                onClick={handleWhatsAppOrder}
                disabled={product.status !== 'active'}
                className="mt-8 w-full py-3 rounded-lg text-lg font-bold"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Fazer Pedido
              </Button>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Skeleton (Original)
const ProductSkeleton = () => (
  <div className="container mx-auto max-w-4xl px-4 py-8">
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 md:p-6">
          <Skeleton className="mb-4 aspect-square w-full rounded-lg" />
          <div className="flex space-x-2">
            <Skeleton className="h-20 w-20 rounded-md" />
            <Skeleton className="h-20 w-20 rounded-md" />
            <Skeleton className="h-20 w-20 rounded-md" />
          </div>
        </div>
        <div className="p-4 md:p-6">
          <Skeleton className="mb-4 h-10 w-3/4" />
          <Skeleton className="mb-4 h-12 w-1-2" />
          <div className="mb-6 flex space-x-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-5-6 mt-2" />
          <Skeleton className="mt-8 h-12 w-full rounded-lg" />
        </div>
      </div>
    </Card>
  </div>
)