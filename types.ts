export type View = 'dashboard' | 'crm' | 'didactics' | 'students' | 'admin' | 'warehouse' | 'reports';

export type Role = 'direzione' | 'segreteria' | 'studenti';

export interface Lead {
  id: number;
  name: string;
  interest: string;
  source: string;
  status: 'contact' | 'interview' | 'audition' | 'followup' | 'enrolled' | 'not_interested';
}

export interface Course {
  id: number;
  name: string;
  type: 'Individuale' | 'Collettivo';
  teacher: string;
  day: string;
}

export interface Event {
  id: number;
  title: string;
  room: string;
  type: 'lesson' | 'collective' | 'exam';
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