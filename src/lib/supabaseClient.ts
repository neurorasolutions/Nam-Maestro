/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Vite usa import.meta.env per le variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Controllo di sicurezza: se mancano, blocca tutto e avvisa
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Mancano le variabili d\'ambiente di Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);