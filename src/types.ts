export type Role = 'direzione' | 'segreteria' | 'docente';

export type View = 
  | 'dashboard' 
  | 'crm' 
  | 'didactics' 
  | 'students' 
  | 'admin' 
  | 'warehouse' 
  | 'reports'; 

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}