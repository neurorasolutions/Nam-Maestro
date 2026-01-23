import React, { useState } from 'react';

interface Student {
  id: number;
  name: string;
  course: string;
  attendancePct: number; // 0-100
  attendanceStatus: 'ok' | 'warning' | 'critical';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  aiStatus: string;
  aiStatusColor: 'green' | 'yellow' | 'red';
  phone: string;
  email: string;
}

const STUDENTS_DATA: Student[] = [
  {
    id: 1,
    name: "Luca Bianchi",
    course: "Batteria - Anno 1",
    attendancePct: 5,
    attendanceStatus: 'ok',
    paymentStatus: 'paid',
    aiStatus: "🟢 Ottimo",
    aiStatusColor: 'green',
    phone: "+39 333 999 8881",
    email: "luca.bianchi@email.com"
  },
  {
    id: 2,
    name: "Sara Neri",
    course: "Canto - Pro",
    attendancePct: 30, // > 25% Critical
    attendanceStatus: 'critical',
    paymentStatus: 'paid',
    aiStatus: "⚠️ Rischio Dropout",
    aiStatusColor: 'yellow',
    phone: "+39 333 777 6662",
    email: "sara.neri@email.com"
  },
  {
    id: 3,
    name: "Marco Verdi",
    course: "Pianoforte Complementare",
    attendancePct: 15, // Warning zone but < 20 for logic, setting manual warning for demo
    attendanceStatus: 'warning',
    paymentStatus: 'overdue',
    aiStatus: "🔴 Sollecitare Pagamento",
    aiStatusColor: 'red',
    phone: "+39 333 555 4443",
    email: "marco.verdi@email.com"
  }
];

const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(STUDENTS_DATA);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'docs' | 'ai'>('profile');
  const [executingAi, setExecutingAi] = useState(false);

  // Helper for attendance bar color
  const getAttendanceColor = (pct: number) => {
    if (pct > 25) return 'bg-red-500';
    if (pct > 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleExecuteAiActions = () => {
    setExecutingAi(true);
    setTimeout(() => {
        setExecutingAi(false);
        setShowAiModal(false);
        alert("✅ Tutte le azioni sono state eseguite con successo dall'AI.");
    }, 1500);
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      
      {/* HEADER & KPI */}
      <div className="flex justify-between items-end mb-8">
         <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Segreteria & Iscritti</h2>
            <div className="flex space-x-6">
               <div className="bg-white px-5 py-3 rounded shadow-sm border-l-4 border-green-500">
                  <div className="text-xs font-bold text-gray-400 uppercase">Tasso Frequenza Medio</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">88% <i className="fas fa-arrow-up text-green-500 text-sm ml-1"></i></div>
               </div>
               <div className="bg-white px-5 py-3 rounded shadow-sm border-l-4 border-red-500 animate-pulse">
                  <div className="text-xs font-bold text-gray-400 uppercase">Fuori Monteore {'>'} 25%</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">4 Studenti</div>
               </div>
               <div className="bg-white px-5 py-3 rounded shadow-sm border-l-4 border-yellow-500">
                  <div className="text-xs font-bold text-gray-400 uppercase">Pagamenti in Scadenza</div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">12</div>
               </div>
            </div>
         </div>
         <button 
            onClick={() => setShowAiModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all font-bold flex items-center animate-bounce-slight"
         >
            <i className="fas fa-bolt mr-2 text-yellow-300"></i> AI: Analizza Anomalie (3)
         </button>
      </div>

      {/* SMART TABLE */}
      <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
           <h3 className="font-bold text-gray-700">Elenco Iscritti Attivi</h3>
           <div className="text-sm text-gray-500">
              <i className="fas fa-sort mr-1"></i> Ordina per: <span className="font-semibold underline cursor-pointer">Stato AI</span>
           </div>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Assenze / Monteore</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamenti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Status</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr 
                   key={student.id} 
                   onClick={() => { setSelectedStudent(student); setActiveTab('profile'); }}
                   className="hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${student.id === 1 ? 'bg-blue-500' : student.id === 2 ? 'bg-pink-500' : 'bg-orange-500'}`}>
                           {student.name.charAt(0)}
                        </div>
                        <div>
                           <div className="text-sm font-bold text-gray-900">{student.name}</div>
                           <div className="text-xs text-gray-500">Matr. 2026/0{student.id}</div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{student.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                     <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                           <span className="font-bold text-gray-600">{student.attendancePct}% Assenze</span>
                           {student.attendancePct > 25 && <span className="text-red-600 font-bold"><i className="fas fa-exclamation-triangle"></i> CRITICO</span>}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                           <div className={`h-2.5 rounded-full ${getAttendanceColor(student.attendancePct)}`} style={{ width: `${student.attendancePct}%` }}></div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {student.paymentStatus === 'paid' && <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 border border-green-200">✅ Regolare</span>}
                     {student.paymentStatus === 'overdue' && <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200 animate-pulse">🔴 Scaduto da 20gg</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`text-sm font-bold ${student.aiStatusColor === 'green' ? 'text-green-700' : student.aiStatusColor === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>
                        {student.aiStatus}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-nam-blue px-2"><i className="fas fa-ellipsis-v"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- AI ANOMALY MODAL --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border-t-4 border-purple-600">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                 <h3 className="font-bold text-xl text-purple-900 flex items-center">
                    <i className="fas fa-robot mr-3 text-purple-600"></i> Report Anomalie AI
                 </h3>
                 <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
              </div>
              
              <div className="p-6 bg-gray-50 max-h-[60vh] overflow-y-auto">
                 <p className="mb-4 text-gray-600 font-medium">L'AI ha scansionato il database e rilevato <span className="font-bold text-red-600">3 situazioni critiche</span> che richiedono azione.</p>
                 
                 <div className="space-y-4">
                    {/* SITUAZIONE 1: DIDATTICA */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                       <div className="flex items-start">
                          <input type="checkbox" defaultChecked className="mt-1.5 mr-3 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="font-bold text-gray-800">Sara Neri - Fuori Monteore (30%)</h4>
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded border border-red-200 font-bold">DIDATTICA</span>
                             </div>
                             <p className="text-sm text-gray-600 mt-1">Azione Consigliata: <span className="font-semibold">Invia WhatsApp Motivazionale</span></p>
                             <div className="mt-2 bg-green-50 p-3 rounded text-sm text-gray-700 italic border border-green-100 relative">
                                <i className="fab fa-whatsapp absolute top-2 right-2 text-green-500 opacity-50 text-xl"></i>
                                "Ciao Sara, abbiamo notato molte assenze ultimamente. Ti aspettiamo a lezione questa settimana per non perdere il ritmo dell'anno! 💪"
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* SITUAZIONE 2: AMMINISTRATIVA */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                       <div className="flex items-start">
                          <input type="checkbox" defaultChecked className="mt-1.5 mr-3 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="font-bold text-gray-800">Marco Verdi - Rata Scaduta</h4>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200 font-bold">AMMINISTRAZIONE</span>
                             </div>
                             <p className="text-sm text-gray-600 mt-1">Azione Consigliata: <span className="font-semibold">Invia Email Formale</span></p>
                             <div className="mt-2 bg-gray-100 p-3 rounded text-sm text-gray-700 italic border border-gray-200 relative">
                                <i className="fas fa-envelope absolute top-2 right-2 text-gray-400 opacity-50 text-xl"></i>
                                "Gentile Marco, le ricordiamo che la rata di Febbraio risulta insoluta. La preghiamo di regolarizzare la posizione..."
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* SITUAZIONE 3: RETENTION */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                       <div className="flex items-start">
                          <input type="checkbox" defaultChecked className="mt-1.5 mr-3 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="font-bold text-gray-800">Giulia - Segnali di noia</h4>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded border border-blue-200 font-bold">RETENTION</span>
                             </div>
                             <p className="text-sm text-gray-600 mt-1">Azione Consigliata: <span className="font-semibold">Proposta Cambio Corso</span></p>
                             <div className="mt-2 bg-blue-50 p-3 rounded text-sm text-gray-700 italic border border-blue-100 relative">
                                <i className="fas fa-comment-dots absolute top-2 right-2 text-blue-400 opacity-50 text-xl"></i>
                                "Suggerimento AI: Proporre passaggio a corso collettivo/laboratorio per aumentare coinvolgimento sociale."
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-end space-x-3">
                 <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded">Ignora per ora</button>
                 <button 
                    onClick={handleExecuteAiActions}
                    disabled={executingAi}
                    className="px-6 py-2 bg-purple-600 text-white font-bold rounded shadow hover:bg-purple-700 flex items-center"
                 >
                    {executingAi ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> Elaborazione...</> : <><i className="fas fa-check-double mr-2"></i> Esegui Tutte le Azioni</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- STUDENT DETAIL MODAL --- */}
      {selectedStudent && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-fade-in-up overflow-hidden">
               {/* Detail Header */}
               <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6 flex justify-between items-start flex-shrink-0">
                  <div className="flex items-center">
                     <div className={`h-16 w-16 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold mr-4 ${selectedStudent.id === 1 ? 'bg-blue-500' : selectedStudent.id === 2 ? 'bg-pink-500' : 'bg-orange-500'}`}>
                        {selectedStudent.name.charAt(0)}
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                        <div className="flex items-center space-x-4 text-sm opacity-90 mt-1">
                           <span><i className="fas fa-graduation-cap mr-1"></i> {selectedStudent.course}</span>
                           <span><i className="fas fa-id-card mr-1"></i> Matr. 2026/0{selectedStudent.id}</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
               </div>

               {/* Detail Tabs */}
               <div className="bg-gray-100 border-b border-gray-200 flex px-6 space-x-6 flex-shrink-0">
                  {['profile', 'history', 'docs', 'ai'].map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab ? 'border-nam-blue text-nam-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                     >
                        {tab === 'profile' ? 'Anagrafica' : tab === 'history' ? 'Storico' : tab === 'docs' ? 'Documenti' : 'AI Notes'}
                     </button>
                  ))}
               </div>

               {/* Detail Content */}
               <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
                  {activeTab === 'profile' && (
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Contatti</h4>
                           <div className="space-y-3">
                              <div className="flex justify-between border-b border-gray-200 pb-2">
                                 <span className="text-gray-500">Email</span>
                                 <span className="font-medium text-gray-800">{selectedStudent.email}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-200 pb-2">
                                 <span className="text-gray-500">Telefono</span>
                                 <span className="font-medium text-gray-800">{selectedStudent.phone}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-200 pb-2">
                                 <span className="text-gray-500">Indirizzo</span>
                                 <span className="font-medium text-gray-800">Via Roma 10, Milano</span>
                              </div>
                           </div>
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Stato Didattico</h4>
                           <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                              <div className="mb-2 flex justify-between">
                                 <span className="text-sm font-bold text-gray-500">Assenze Totali</span>
                                 <span className={`font-bold ${getAttendanceColor(selectedStudent.attendancePct).replace('bg-', 'text-')}`}>{selectedStudent.attendancePct}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                 <div className={`h-2 rounded-full ${getAttendanceColor(selectedStudent.attendancePct)}`} style={{width: `${selectedStudent.attendancePct}%`}}></div>
                              </div>
                              <div className="text-xs text-gray-500">
                                 Lo studente ha effettuato <strong>24</strong> su <strong>30</strong> lezioni previste.
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === 'docs' && (
                     <div className="space-y-4">
                        <div className="bg-white p-4 rounded border border-gray-200 flex justify-between items-center">
                           <div className="flex items-center">
                              <i className="fas fa-file-pdf text-red-500 text-3xl mr-4"></i>
                              <div>
                                 <h5 className="font-bold text-gray-800">Certificato di Iscrizione 2026/27</h5>
                                 <p className="text-xs text-gray-500">Generato automaticamente il 10/09/2026</p>
                              </div>
                           </div>
                           <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-bold shadow-sm">
                              <i className="fas fa-download mr-2"></i> Scarica PDF
                           </button>
                        </div>
                        
                        <div className="bg-white p-4 rounded border border-gray-200 flex justify-between items-center border-dashed border-2 border-gray-300">
                           <div className="flex items-center opacity-70">
                              <i className="fas fa-file-medical text-green-500 text-3xl mr-4"></i>
                              <div>
                                 <h5 className="font-bold text-gray-800">Certificato Medico</h5>
                                 <p className="text-xs text-gray-500">Non ancora caricato</p>
                              </div>
                           </div>
                           <button className="bg-nam-blue text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-600">
                              <i className="fas fa-upload mr-2"></i> Carica Documento
                           </button>
                        </div>
                     </div>
                  )}

                  {activeTab === 'ai' && (
                     <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-inner">
                        <div className="flex items-start mb-4">
                           <div className="bg-yellow-100 p-2 rounded-full mr-3">
                              <i className="fas fa-lightbulb text-yellow-600 text-xl"></i>
                           </div>
                           <div>
                              <h4 className="font-bold text-yellow-800 text-lg">Note AI & Osservazioni</h4>
                              <p className="text-xs text-yellow-600 uppercase font-bold tracking-wider">Ultimo aggiornamento: Oggi, 09:30</p>
                           </div>
                        </div>
                        <p className="text-gray-800 leading-relaxed font-medium font-serif italic text-lg border-l-4 border-yellow-400 pl-4 py-2 bg-white rounded shadow-sm">
                           "Studente talentuoso ma incostante. Si consiglia di proporre il passaggio al corso collettivo per motivarlo e ridurre il rischio abbandono. Il docente segnala ottime capacità ritmiche ma scarsa concentrazione nelle lezioni individuali."
                        </p>
                        <div className="mt-6">
                           <h5 className="font-bold text-gray-700 text-sm mb-2">Azioni Suggerite:</h5>
                           <div className="flex space-x-2">
                              <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs text-gray-600 font-bold shadow-sm">Colloquio Motivazionale</span>
                              <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs text-gray-600 font-bold shadow-sm">Cambio Docente</span>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === 'history' && (
                      <div className="text-center text-gray-400 italic py-10">
                          Cronologia attività non disponibile nella demo.
                      </div>
                  )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudentsView;