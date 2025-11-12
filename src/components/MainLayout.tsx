import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; //
import { Button } from '@/components/ui/button';
import { Package, ShieldCheck } from 'lucide-react';

/**
 * Este layout envolve todas as páginas públicas (Loja, Detalhe do Produto).
 * Ele contém o cabeçalho de navegação e renderiza o conteúdo da página filha.
 *
 * O mais importante: Ele usa o 'useAuth' para verificar se o usuário é admin
 * e, em caso afirmativo, exibe um botão para voltar ao Painel Admin.
 */
const MainLayout = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">Minha Loja 3D</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/store"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Loja
              </Link>
            </nav>
          </div>
          
          {/* Este é o botão que resolve seu problema de navegação */}
          <div className="flex flex-1 items-center justify-end space-x-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Painel Admin
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* O <Outlet> renderiza a página atual (Store ou ProductDetail) aqui */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* (Opcional: Adicionar um rodapé aqui no futuro) */}
    </div>
  );
};

export default MainLayout;