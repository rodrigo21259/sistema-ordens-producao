import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey ) {
  throw new Error('Variáveis de ambiente Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos
export interface Profile {
  id: string
  name: string | null
  role: 'user' | 'admin'
  theme_preference: 'light' | 'dark'
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  user_id: string
  client_code: string
  product: string
  volume: number
  revenue: number
  created_at: string
  updated_at: string
}