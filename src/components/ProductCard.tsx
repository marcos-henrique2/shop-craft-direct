import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
// --- IMPORTAÇÃO CORRETA DOS TIPOS ---
import { Database } from '@/integrations/supabase/types'

// --- USA O TIPO OFICIAL DO BANCO DE DADOS ---
type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product // <-- Agora usa o tipo correto
  onOrderPlaced?: () => void
}

const statusLabels = {
  active: 'Disponível',
  out_of_stock: 'Esgotado',
  restocking: 'Em Reposição',
}

const statusVariants = {
  active: 'default',
  out_of_stock: 'destructive',
  restocking: 'secondary',
} as const

export const ProductCard = ({ product, onOrderPlaced }: ProductCardProps) => {
  const handleWhatsAppOrder = () => {
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

  // A lógica para tratar 'images' como nulo já estava correta
  const imageUrl = product.images?.[0] || '/placeholder.svg'

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="p-0">
        <div className="aspect-square overflow-hidden bg-secondary">
          <Link to={`/produto/${product.id}`} className="group">
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-grow">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/produto/${product.id}`} className="hover:underline">
            <h3 className="font-semibold text-lg line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <Badge
            variant={statusVariants[product.status]}
            className="flex-shrink-0"
          >
            {statusLabels[product.status]}
          </Badge>
        </div>
        {/* A lógica para tratar 'description' como nulo já estava correta */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">
              R$ {product.price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.quantity} em estoque
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleWhatsAppOrder}
          disabled={product.status !== 'active'}
          className="w-full"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Fazer Pedido
        </Button>
      </CardFooter>
    </Card>
  )
}