import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize client safely
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Store {
  id: string;
  name: string;
  code: string;
  city?: string;
}

export interface Product {
  id: string;
  name: string;
  weight: number; // in KG
  price: number;  // in BRL
  stock: number;
  consumption_15_days?: string;
  category: string;
}

// Fallback lists to maintain fully functioning UX during sandbox/setup stages
export const MOCK_STORES: Store[] = [
  { id: '1', name: 'Matriz - Curitiba', code: 'LOJA001', city: 'Curitiba' },
  { id: '2', name: 'Filial - Londrina', code: 'LOJA002', city: 'Londrina' },
  { id: '3', name: 'Filial - Maringá', code: 'LOJA003', city: 'Maringá' },
  { id: '4', name: 'Filial - Ponta Grossa', code: 'LOJA004', city: 'Ponta Grossa' },
  { id: '5', name: 'Filial - Cascavel', code: 'LOJA005', city: 'Cascavel' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Abacaxi', weight: 6.50, price: 115.00, stock: 2, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '2', name: 'Amarena', weight: 6.50, price: 140.00, stock: 2, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '3', name: 'Blue Ice', weight: 6.50, price: 110.00, stock: 2, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '4', name: 'Brownie Recheado', weight: 6.50, price: 150.00, stock: 2, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '5', name: 'Chocomenta', weight: 6.50, price: 135.00, stock: 1, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '6', name: 'Creme Americano', weight: 5.50, price: 80.00, stock: 1, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '7', name: 'Creme De Amendoim Trufado', weight: 6.50, price: 130.00, stock: 3, consumption_15_days: 'Sem Info.', category: 'SORVETES' },
  { id: '8', name: 'Cupuaçu', weight: 7.00, price: 135.00, stock: 2, consumption_15_days: 'Sem Info.', category: 'SORVETES' }
];
