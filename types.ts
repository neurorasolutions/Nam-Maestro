export type Role = 'direzione' | 'segreteria' | 'docente';

export type View = 
  | 'dashboard'
  | 'crm' 
  | 'didactics' 
  | 'students' 
  | 'admin' 
  | 'warehouse' 
  | 'reports';

// Interfacce comuni che potrebbero servirti (opzionale ma consigliato)
export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}