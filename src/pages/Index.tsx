import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Página inicial da aplicação. Oferece links para visitar a loja e
 * acessar o painel administrativo via login.
 */
const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Shop Craft Direct
      </h1>
      <p className="text-center text-muted-foreground max-w-md mb-8">
        Bem-vindo à nossa loja de artesanato digital. Navegue pelos nossos produtos ou faça login para
        administrar o catálogo e pedidos.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate('/store')}>Ver Produtos</Button>
        <Button variant="outline" onClick={() => navigate('/login')}>Área Administrativa</Button>
      </div>
    </div>
  );
};

export default Index;