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
import ProductDetail from './pages/ProductDetail';
import CalculatorPage from './pages/admin/CalculatorPage';

// --- 1. IMPORTAR O NOVO LAYOUT ---
import MainLayout from './components/MainLayout';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rota inicial e Login ficam fora do layout principal */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* --- 2. ROTAS PÚBLICAS DENTRO DO MainLayout --- */}
            {/* Isso adiciona o cabeçalho a todas as rotas filhas */}
            <Route element={<MainLayout />}>
              <Route path="/store" element={<Store />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
            </Route>

            {/* --- 3. ROTAS DE ADMIN (sem o layout público) --- */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/calculadora" element={<CalculatorPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;