import React, { useState, useMemo } from 'react';
import { Role } from '../src/types';

interface AdminViewProps {
  role: Role;
}

interface TeacherPayroll {
  id: number;
  name: string;
  hours: number;
  rate: number;
  subject: string;
}

// Dati coerenti con la sezione Segreteria
const SYNCED_PAYMENTS = [
  { id: 1, student: 'Marco Verdi', course: 'Pianoforte Compl.', amount: 150, dueDate: '2026-02-15', status: 'overdue' },
  { id: 2, student: 'Sara Neri', course: 'Canto - Pro', amount: 180, dueDate: '2026-02-20', status: 'paid' },
  { id: 3, student: 'Luca Bianchi', course: 'Batteria - Anno 1', amount: 150, dueDate: '2026-02-22', status: 'paid' },
  { id: 4, student: 'Giulia Rossi', course: 'Basso Elettrico', amount: 160, dueDate: '2026-03-01', status: 'pending' },
  { id: 5, student: 'Alessandro Gialli', course: 'Tecnico del Suono', amount: 220, dueDate: '2026-03-05', status: 'pending' },
];

const INITIAL_PAYROLL: TeacherPayroll[] = [
  { id: 1, name: "Fasoli Daniele", subject: "Basso Elettrico", hours: 42, rate: 35 },
  { id: 2, name: "Pantaleo Davide", subject: "Informatica", hours: 28, rate: 30 },
  { id: 3, name: "Folli Paola", subject: "Canto", hours: 15, rate: 45 },
  { id: 4, name: "Furian Maxx", subject: "Batteria", hours: 20, rate: 50 },
  { id: 5, name: "Satriani M.", subject: "Chitarra Rock", hours: 12, rate: 60 },
];

const AdminView: React.FC<AdminViewProps> = ({ role }) => {
  const [payrollData, setPayrollData] = useState<TeacherPayroll[]>(INITIAL_PAYROLL);

  // Calcolo Dinamico dei Costi
  const totalTeacherCost = useMemo(() => {
    return payrollData.reduce((acc, curr) => acc + (curr.hours * curr.rate), 0);
  }, [payrollData]);

  const totalIncome = 50000; // Valore fisso richiesto
  const profit = totalIncome - totalTeacherCost;

  const handleRateChange = (id: number, newRate: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate)) return; // Gestione input vuoto o non valido

    setPayrollData(prev => prev.map(teacher => 
      teacher.id === id ? { ...teacher, rate: rate } : teacher
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      
      {/* HEADER & ACTIONS */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-700">Amministrazione & Controllo di Gestione</h2>
           <p className="text-sm text-gray-500">Gestione flussi di cassa e compensi docenti mese corrente.</p>
        </div>
        
        <div className="flex space-x-3">
           {role === 'segreteria' && (
             <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-sm font-bold flex items-center">
               <i className="fas fa-eye-slash mr-2"></i> Accesso Limitato
             </div>
           )}
           <button className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-bold text-sm flex items-center">
              <i className="fas fa-file-pdf mr-2 text-red-500"></i> Esporta Report Bilancio (PDF)
           </button>
        </div>
      </div>

      {role === 'direzione' ? (
        <>
          {/* KPI CARDS - LIVE CALCULATION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500 flex flex-col justify-between">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Totale Incassato (Mese)</div>
                <div className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(totalIncome)}</div>
                <div className="mt-2 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded w-fit">
                   <i className="fas fa-arrow-up mr-1"></i> Rette Regolari
                </div>
             </div>

             <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500 flex flex-col justify-between relative overflow-hidden">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider z-10 relative">Stima Costo Docenti</div>
                <div className="text-3xl font-bold text-red-600 mt-2 z-10 relative transition-all duration-300">
                   {formatCurrency(totalTeacherCost)}
                </div>
                <div className="mt-2 text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit z-10 relative">
                   <i className="fas fa-calculator mr-1"></i> Calcolato su Payroll
                </div>
                {/* Visual Background Element */}
                <i className="fas fa-coins absolute -right-4 -bottom-4 text-8xl text-red-50 opacity-50 z-0"></i>
             </div>

             <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col justify-between">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Margine Operativo Lordo</div>
                <div className={`text-3xl font-bold mt-2 ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                   {formatCurrency(profit)}
                </div>
                <div className="mt-2 text-xs text-gray-500 italic">
                   Escluse spese strutturali fisse
                </div>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
             
             {/* LEFT: TEACHER PAYROLL (INTERACTIVE) */}
             <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                   <h3 className="font-bold text-gray-700"><i className="fas fa-chalkboard-teacher mr-2 text-gray-400"></i>Gestione Compensi Docenti</h3>
                   <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Febbraio 2026</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ore Totali</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tariffa Oraria (€)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Totale</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {payrollData.map((t) => (
                            <tr key={t.id} className="hover:bg-blue-50 transition-colors">
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-bold text-gray-800">{t.name}</div>
                                  <div className="text-xs text-gray-500">{t.subject}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">{t.hours}h</span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                     <span className="text-gray-400 mr-1">€</span>
                                     <input 
                                       type="number" 
                                       value={t.rate}
                                       onChange={(e) => handleRateChange(t.id, e.target.value)}
                                       className="w-20 border border-gray-300 rounded px-2 py-1 text-right font-bold text-gray-700 focus:ring-2 focus:ring-nam-blue focus:border-transparent outline-none shadow-inner"
                                     />
                                  </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-800">
                                  {formatCurrency(t.hours * t.rate)}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold text-gray-700 border-t-2 border-gray-200">
                         <tr>
                            <td colSpan={3} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Totale Uscite Stimato</td>
                            <td className="px-6 py-4 text-right text-red-600 text-base">{formatCurrency(totalTeacherCost)}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>
             </div>

             {/* RIGHT: STUDENT PAYMENTS (SYNCED) */}
             <div className="w-full lg:w-[450px] bg-white rounded shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                   <h3 className="font-bold text-gray-700"><i className="fas fa-file-invoice-dollar mr-2 text-gray-400"></i>Scadenziario Rette</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                         <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Studente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importo</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stato</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {SYNCED_PAYMENTS.map((p) => (
                            <tr key={p.id}>
                               <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="font-bold text-gray-800">{p.student}</div>
                                  <div className="text-xs text-gray-500">{p.course}</div>
                                  <div className="text-[10px] text-gray-400">Scad: {p.dueDate}</div>
                               </td>
                               <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600">
                                  € {p.amount}
                               </td>
                               <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {p.status === 'paid' && <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">✅ Pagato</span>}
                                  {p.status === 'pending' && <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">In Scadenza</span>}
                                  {p.status === 'overdue' && <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">🔴 Scaduto</span>}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <button className="text-xs font-bold text-nam-blue hover:underline">Vedi Storico Completo</button>
                </div>
             </div>

          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
           <i className="fas fa-lock text-6xl mb-4 text-gray-300"></i>
           <p className="text-lg font-medium">Non hai i permessi per visualizzare i dati sensibili di bilancio.</p>
           <p className="text-sm">Contatta l'amministratore per richiedere l'accesso.</p>
        </div>
      )}
    </div>
  );
};

export default AdminView;