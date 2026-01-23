import React, { useState, useEffect } from 'react';
import { INITIAL_LEADS } from '../constants';
import { Lead } from '../types';

const CrmView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State for Detail Modal & Toast
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const columns: { id: string; label: string; color: string }[] = [
    { id: 'contact', label: 'Primo Contatto', color: 'border-t-nam-blue' },
    { id: 'interview', label: 'Colloquio', color: 'border-t-yellow-400' },
    { id: 'audition', label: 'Audizione', color: 'border-t-purple-400' },
    { id: 'followup', label: 'Follow-up', color: 'border-t-orange-400' },
    { id: 'enrolled', label: 'Iscritto', color: 'border-t-nam-green' },
    { id: 'not_interested', label: 'Non Interessato', color: 'border-t-gray-400' },
  ];

  // Helper to handle Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Date.now(),
      name: 'Nuovo Lead Demo',
      interest: 'Produzione',
      source: 'Telefono',
      status: 'contact'
    };
    setLeads([...leads, newLead]);
    setShowAddModal(false);
    setToastMessage("✅ Nuovo lead creato con successo");
  };

  const handlePromoteLead = () => {
      if (!selectedLead) return;

      const statusOrder = ['contact', 'interview', 'audition', 'followup', 'enrolled'];
      const currentIdx = statusOrder.indexOf(selectedLead.status);

      if (currentIdx !== -1 && currentIdx < statusOrder.length - 1) {
          const nextStatus = statusOrder[currentIdx + 1];
          
          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: nextStatus as any } : l));
          setSelectedLead(null); // Close modal
          setToastMessage(`🚀 ${selectedLead.name} promosso a ${columns.find(c => c.id === nextStatus)?.label}!`);
      } else {
          alert("Questo lead è già nello stato finale o non gestito dal flusso standard.");
      }
  };

  const handleMarkLost = () => {
      if (!selectedLead) return;
      if (confirm("Sei sicuro di voler segnare questo lead come 'Non Interessato'?")) {
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'not_interested' } : l));
        setSelectedLead(null);
        setToastMessage(`❌ ${selectedLead.name} spostato in Non Interessato.`);
      }
  };

  // Helper to generate fake history based on current status
  const getTimelineEvents = (status: string) => {
      const allEvents = [
          { status: 'contact', date: '01/01/2026', title: 'Lead creato da Web Form', desc: 'Utente ha richiesto info dal sito.' },
          { status: 'contact', date: '02/01/2026', title: 'Email automatica inviata', desc: 'Invio brochure corsi.' },
          { status: 'interview', date: '05/01/2026', title: 'Colloquio Conoscitivo', desc: 'Incontro con segreteria didattica.' },
          { status: 'audition', date: '10/01/2026', title: 'Audizione Tecnica', desc: 'Valutazione livello con docente.' },
          { status: 'followup', date: '12/01/2026', title: 'Proposta Piano Studi', desc: 'Inviato preventivo personalizzato.' },
          { status: 'enrolled', date: '15/01/2026', title: 'Matricola Generata', desc: 'Contratto firmato e quota versata.' },
      ];

      const statusOrder = ['contact', 'interview', 'audition', 'followup', 'enrolled', 'not_interested'];
      const currentIdx = statusOrder.indexOf(status);
      
      // Filter events up to current status + 1 (to show current state entry)
      return allEvents.filter((ev, idx) => {
          const evIdx = statusOrder.indexOf(ev.status);
          return evIdx <= currentIdx || (status === 'not_interested' && idx === 0);
      });
  };

  const getNextStepLabel = (currentStatus: string) => {
      const map: {[key: string]: string} = {
          'contact': 'Colloquio',
          'interview': 'Audizione',
          'audition': 'Follow-up',
          'followup': 'Iscrizione',
          'enrolled': 'Completato'
      };
      return map[currentStatus] || 'Prossimo Step';
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Pipeline Iscrizioni</h2>
        <div className="flex space-x-2">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-nam-green text-white px-4 py-2 rounded text-sm font-semibold shadow hover:bg-green-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>Nuovo Lead
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full min-w-max space-x-4">
          {columns.map(col => (
            <div key={col.id} className={`w-72 bg-gray-100 rounded flex flex-col border-t-4 ${col.color} shadow-sm`}>
              <div className="p-3 font-bold text-gray-600 uppercase text-xs flex justify-between">
                {col.label}
                <span className="bg-gray-200 text-gray-500 rounded-full px-2">{leads.filter(l => l.status === col.id).length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {leads.filter(l => l.status === col.id).map(lead => (
                  <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-3 rounded shadow-sm border-l-4 border-gray-300 hover:shadow-md cursor-pointer hover:-translate-y-1 transition-all active:scale-95 group"
                  >
                    <div className="font-bold text-gray-800 group-hover:text-nam-blue transition-colors">{lead.name}</div>
                    <div className="text-xs text-nam-blue mt-1 font-semibold">{lead.interest}</div>
                    <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                      <span><i className="fas fa-link mr-1"></i>{lead.source}</span>
                      <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                  </div>
                ))}
                {/* Placeholder ghost card */}
                {col.id === 'contact' && leads.filter(l => l.status === 'contact').length === 0 && (
                   <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center text-gray-400 text-xs">
                     Nessun lead in attesa
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-up z-[60] flex items-center">
            <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* --- MODALE NUOVO LEAD --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fade-in-down">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Nuova Anagrafica Lead</h3>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome e Cognome</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" defaultValue="Mario Rossi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Corso Interesse</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm">
                      <option>Basso Elettrico</option>
                      <option>Canto</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fonte</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm">
                      <option>Instagram</option>
                      <option>Sito Web</option>
                    </select>
                 </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annulla</button>
                <button type="submit" className="px-4 py-2 text-sm bg-nam-green text-white rounded hover:bg-green-700">Salva Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE DETTAGLIO LEAD & CUSTOMER JOURNEY --- */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            {/* Header Modale */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                       {selectedLead.name.charAt(0)}
                   </div>
                   <div>
                       <h3 className="font-bold text-lg text-gray-800 leading-tight">{selectedLead.name}</h3>
                       <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ID: #{selectedLead.id}</span>
                   </div>
               </div>
               <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors"><i className="fas fa-times text-lg"></i></button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* COLONNA SX: ANAGRAFICA */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                    <div className="mb-6">
                        <span className="inline-block bg-nam-blue/10 text-nam-blue text-xs font-bold px-2 py-1 rounded border border-nam-blue/20 mb-2">
                           {selectedLead.interest}
                        </span>
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-envelope w-6 text-center text-gray-400"></i>
                                <span className="truncate">{selectedLead.name.toLowerCase().replace(' ', '.')}@email.com</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-phone w-6 text-center text-gray-400"></i>
                                <span>+39 333 123 4567</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-map-marker-alt w-6 text-center text-gray-400"></i>
                                <span>Milano, Via Bovisa 10</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-link w-6 text-center text-gray-400"></i>
                                <span>Fonte: {selectedLead.source}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Note Segreteria</label>
                        <textarea 
                            className="w-full h-32 p-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-nam-blue focus:outline-none bg-white"
                            placeholder="Aggiungi note sul candidato..."
                            defaultValue="Candidato molto motivato. Ha già esperienza pregressa di 2 anni."
                        ></textarea>
                    </div>
                </div>

                {/* COLONNA DX: CUSTOMER JOURNEY */}
                <div className="w-full md:w-2/3 p-8 bg-white overflow-y-auto">
                    <div className="flex justify-between items-end mb-6 border-b pb-2">
                        <h4 className="font-bold text-gray-800 text-lg"><i className="fas fa-history mr-2 text-nam-blue"></i>Storia Contatto</h4>
                        <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                            Stato Attuale: {columns.find(c => c.id === selectedLead.status)?.label}
                        </span>
                    </div>

                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-8 pb-4">
                        {getTimelineEvents(selectedLead.status).map((ev, idx, arr) => {
                            const isLast = idx === arr.length - 1;
                            return (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[41px] h-6 w-6 rounded-full border-4 border-white flex items-center justify-center ${isLast ? 'bg-nam-green ring-4 ring-green-100' : 'bg-gray-300'}`}>
                                        {isLast && <i className="fas fa-check text-[8px] text-white"></i>}
                                    </div>
                                    <div className={`${isLast ? 'opacity-100' : 'opacity-60'}`}>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{ev.date}</span>
                                            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{ev.status}</span>
                                        </div>
                                        <h5 className="font-bold text-gray-800">{ev.title}</h5>
                                        <p className="text-sm text-gray-600 mt-1">{ev.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Next Step Placeholder */}
                        {selectedLead.status !== 'enrolled' && selectedLead.status !== 'not_interested' && (
                            <div className="relative opacity-40">
                                <div className="absolute -left-[41px] h-6 w-6 rounded-full border-4 border-white bg-gray-200 border-dashed"></div>
                                <div>
                                    <h5 className="font-bold text-gray-800 italic">Prossimo Step: {getNextStepLabel(selectedLead.status)}</h5>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar Actions */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
                <button onClick={() => setSelectedLead(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Chiudi</button>
                <div className="space-x-3">
                    {selectedLead.status !== 'not_interested' && selectedLead.status !== 'enrolled' && (
                        <>
                            <button onClick={handleMarkLost} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-medium border border-transparent hover:border-red-200 transition-all">
                                Segna come Perso
                            </button>
                            <button onClick={handlePromoteLead} className="px-6 py-2 bg-nam-green text-white rounded font-bold shadow hover:bg-green-700 hover:shadow-lg transform active:scale-95 transition-all flex items-center">
                                Promuovi a {getNextStepLabel(selectedLead.status)} <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </>
                    )}
                    {selectedLead.status === 'enrolled' && (
                        <span className="text-nam-green font-bold flex items-center px-4 py-2 bg-green-50 rounded border border-green-200">
                            <i className="fas fa-check-circle mr-2"></i> Iscrizione Completata
                        </span>
                    )}
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CrmView;