import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

// --- 1. ATUALIZAR A INTERFACE DO PRODUTO ---
// (Agora ela corresponde ao que o ProductCard.tsx espera)
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number; // <-- Adicionado
  status: 'active' | 'out_of_stock' | 'restocking'; // <-- Adicionado
  images: string[] | null;
  category_id: string | null; // <-- Adicionado
  created_at: string; // <-- Adicionado
  updated_at: string | null; // <-- Adicionado
}

const Store = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // --- 2. ATUALIZAR A CONSULTA .select() ---
      // (Buscando todos os campos que a interface Product agora exige)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, quantity, status, images, category_id, created_at, updated_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
      } else if (data) {
        // O 'data' agora corresponde perfeitamente à interface 'Product'
        setProducts(data as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nossos Produtos</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
         <p className="text-center text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Store;