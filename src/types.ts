export type Role = 'direzione' | 'segreteria' | 'docente';

export type View = 'dashboard' | 'crm' | 'didactics' | 'students' | 'admin' | 'warehouse' | 'reports';

export interface Lead {
  id: number;
  name: string;
  interest: string;
  source: string;
  status: 'contact' | 'interview' | 'audition' | 'enrolled' | 'followup';
}

export interface Course {
  id: number;
  name: string;
  type: string;
  teacher: string;
  day: string;
}

export interface Event {
  id: number;
  title: string;
  room: string;
  type: 'lesson' | 'collective' | 'exam' | 'other';
  time: string;
  isHybrid?: boolean;
}

export interface Payment {
  id: number;
  student: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  royalties: number;
}

// --- NUOVA INTERFACCIA STUDENTE (Allineata con Supabase) ---
export interface Student {
  id?: string; // Opzionale in fase di creazione
  created_at?: string;

  // 1. Anagrafica & Dati Personali
  avatar_url?: string;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string; // Formato YYYY-MM-DD
  birth_place?: string;
  birth_province?: string;
  birth_country?: string;
  citizenship?: string;
  fiscal_code?: string;
  passport_number?: string;
  
  // 2. Contatti
  email?: string;
  phone?: string;
  mobile_phone?: string;
  pec?: string;
  
  // 3. Accessi e Credenziali
  is_web_access_enabled?: boolean;
  is_moodle_access_enabled?: boolean;
  
  // 4. Residenza
  address?: string;
  zip_code?: string;
  city?: string;
  province?: string;
  country?: string;
  
  // 5. Dati Fiscali
  vat_number?: string;
  billing_different?: boolean;
  billing_address?: string;
  billing_zip_code?: string;
  billing_city?: string;
  billing_province?: string;
  billing_country?: string;

  // 6. Corsi & Interesse
  course_1?: string;
  course_2?: string;
  course_type?: string;
  
  // 7. Marketing & Lead
  marketing_source?: string;
  lead_source?: string;
  
  // 8. Workflow Iscrizione
  interview_status?: string;
  audition_status?: string;
  entry_test_status?: string;
  lead_profession?: string;
  open_day_status?: string;
  enrollment_status?: string;
  
  // 9. Info Aggiuntive
  job_title?: string;
  marital_status?: string;
  education_level?: string;
  is_retired?: boolean;
  
  // 10. Gestione Interna
  notes?: string;
  location?: string;
  privacy_consent?: boolean;
  guardian_info?: string;
  
  // 11. Notifiche
  fcm_token?: string;
}