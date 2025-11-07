import { createClient } from '@supabase/supabase-js'
// --- 1. IMPORTAÇÃO DOS TIPOS ---
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from .env')
}

// --- 2. MUDANÇA AQUI: Adiciona o <Database> ---
// Agora o Supabase sabe sobre 'products', 'images', etc.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)