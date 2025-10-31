import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Substituímos o envio de pedido via Supabase por um link direto do WhatsApp.
// O ícone de mensagem é importado do lucide-react para manter o padrão visual.
import { MessageCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  status: 'active' | 'out_of_stock' | 'restocking';
  images: string[];
  categories?: { name: string };
}

interface ProductCardProps {
  product: Product;
  /**
   * Callback para atualizar a lista de produtos após um pedido ser realizado.
   * Opcional para que a página de listagem possa recarregar os dados.
   */
  onOrderPlaced?: () => void;
}

const statusLabels = {
  active: 'Disponível',
  out_of_stock: 'Esgotado',
  restocking: 'Em Reposição',
};

const statusVariants = {
  active: 'default',
  out_of_stock: 'destructive',
  restocking: 'secondary',
} as const;

export const ProductCard = ({ product, onOrderPlaced }: ProductCardProps) => {
  /**
   * Abre o WhatsApp com a mensagem padrão para o número configurado.
   *
   * O número deve ser fornecido no formato internacional sem símbolos ou espaços.
   * Neste caso usamos o número do Brasil 62 98226‑2543, que em formato internacional
   * é 5562982262543. Ajuste esse valor se for necessário alterar o destino do pedido.
   */
  const handleWhatsAppOrder = () => {
    const message = `Olá! Gostaria de pedir o produto: ${product.name}\nPreço: R$ ${product.price.toFixed(2)}\nTem disponível: ${product.quantity}`;
    // Utilizamos o código de país +55 (Brasil) seguido do DDD e número sem espaços
    const whatsappUrl = `https://wa.me/5562982262543?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const imageUrl = product.images[0] || '/placeholder.svg';
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="p-0">
        <div className="aspect-square overflow-hidden bg-secondary">
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
          <Badge variant={statusVariants[product.status]}>{statusLabels[product.status]}</Badge>
        </div>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">R$ {product.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{product.quantity} em estoque</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleWhatsAppOrder} disabled={product.status !== 'active'} className="w-full">
          <MessageCircle className="mr-2 h-4 w-4" />
          Fazer Pedido
        </Button>
      </CardFooter>
    </Card>
  );
};