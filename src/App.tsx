import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Index from './pages/Index';
import Login from './pages/Login';
import Store from './pages/Store';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

/**
 * Componente raiz de rotas para o Shop Craft Direct.
 *
 * Aqui adicionamos a rota de login para proteger o painel administrativo e
 * mantemos as rotas existentes para a loja e para a página inicial. O
 * AuthProvider envolve todas as rotas para disponibilizar estado de
 * autenticação às páginas.
 */
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/store" element={<Store />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;