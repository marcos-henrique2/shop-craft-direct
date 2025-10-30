import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, LogIn } from 'lucide-react';

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Bem-vindo à Nossa Loja
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
              Facas artesanais, eletrônicos, brinquedos e serviços de impressão 3D de qualidade
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-border">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-full">
                  <ShoppingBag className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Catálogo de Produtos</h2>
                <p className="text-muted-foreground text-center">
                  Navegue pelos nossos produtos e faça pedidos direto pelo WhatsApp
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/store')}
                  className="w-full mt-4"
                >
                  Ver Produtos
                </Button>
              </div>
            </div>

            {isAdmin ? (
              <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-border">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-full">
                    <Package className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Painel Admin</h2>
                  <p className="text-muted-foreground text-center">
                    Gerencie produtos, categorias e pedidos
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/admin')}
                    variant="secondary"
                    className="w-full mt-4"
                  >
                    Acessar Painel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-border">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-full">
                    <LogIn className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Área Admin</h2>
                  <p className="text-muted-foreground text-center">
                    Faça login para acessar o painel administrativo
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Fazer Login
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mt-16 animate-in fade-in duration-1000 delay-500">
            {[
              { title: 'Facas Artesanais', desc: 'Qualidade premium' },
              { title: 'Eletrônicos', desc: 'Produtos variados' },
              { title: 'Brinquedos', desc: 'Para todas idades' },
              { title: 'Impressão 3D', desc: 'Serviços personalizados' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-secondary/50 backdrop-blur-sm">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
