export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Tipagens geradas manualmente para as tabelas usadas neste projeto.
 *
 * A tipagem inclui a nova tabela `pedidos`, além de `products`, `categories`
 * e `user_roles`. Estas definições permitem que o Supabase client ofereça
 * verificação de tipos em tempo de desenvolvimento ao consultar ou inserir
 * dados.
 */
export type Database = {
  /**
   * Tipagens para o esquema público do Supabase. Este objeto segue o
   * padrão gerado automaticamente pelo CLI do Supabase e inclui apenas
   * as tabelas e enums utilizados na aplicação. As relações estão
   * descritas nas propriedades `Relationships` de cada tabela.
   */
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          quantity: number;
          status: 'active' | 'out_of_stock' | 'restocking';
          images: string[] | null;
          category_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          quantity?: number;
          status?: 'active' | 'out_of_stock' | 'restocking';
          images?: string[] | null;
          category_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          quantity?: number;
          status?: 'active' | 'out_of_stock' | 'restocking';
          images?: string[] | null;
          category_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      /**
       * Tabela de pedidos. Os pedidos referenciam um produto via `product_id`
       * e registram informações de cliente, quantidade e preço total. O status
       * utiliza o enum `order_status` (pending, confirmed, cancelled).
       */
      orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_phone: string;
          product_id: string | null;
          quantity: number;
          total_price: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_phone: string;
          product_id?: string | null;
          quantity: number;
          total_price: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_phone?: string;
          product_id?: string | null;
          quantity?: number;
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'customer';
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'admin' | 'customer';
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'customer';
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {};
    Enums: {
      order_status: 'pending' | 'confirmed' | 'cancelled';
      product_status: 'active' | 'out_of_stock' | 'restocking';
      app_role: 'admin' | 'customer';
    };
  };
};