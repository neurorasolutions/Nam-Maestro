import React, { useState } from 'react';
import { COURSES } from '../constants';
import { Course } from '../src/types';

// Extended Mock Data for the Detail Modal
const COURSE_DETAILS: Record<number, {
  time: string;
  duration: string;
  room: string;
  coordinators: string[];
  syllabus: string;
  enrolled: number;
  capacity: number;
  value: string;
  description: string;
}> = {
  1: { // Teoria e Solfeggio
    time: "Ogni Lunedì, 14:00 - 16:00",
    duration: "Ottobre 2026 - Giugno 2027 (9 Mesi)",
    room: "Aula Teoria (Piano 1)",
    coordinators: ["M. Rossi (Armonia)", "M. Verdi (Ritmica)"],
    syllabus: "Lettura ritmica, setticlavio, dettato melodico.",
    enrolled: 12,
    capacity: 15,
    value: "€ 12.000 (Stimato)",
    description: "Corso fondamentale per lo sviluppo dell'orecchio e della lettura."
  },
  2: { // Laboratorio Chitarristico
    time: "Ogni Martedì, 18:00 - 20:00",
    duration: "Novembre 2026 - Maggio 2027 (7 Mesi)",
    room: "Auditorium",
    coordinators: ["M. Satriani (Tecnica)", "M. Vai (Improvvisazione)"],
    syllabus: "Interplay, gestione suoni, effettistica.",
    enrolled: 5,
    capacity: 20,
    value: "€ 4.500 (Stimato)",
    description: "Laboratorio pratico di musica d'insieme per chitarristi."
  },
  3: { // Music Business
    time: "Ogni Mercoledì, 20:00 - 22:00",
    duration: "Gennaio 2027 - Aprile 2027 (4 Mesi)",
    room: "Aula Digital",
    coordinators: ["Dott. Manager (Copyright)"],
    syllabus: "Diritto d'autore, SIAE, Marketing discografico.",
    enrolled: 18,
    capacity: 20,
    value: "€ 8.000 (Stimato)",
    description: "Approfondimento sulle dinamiche legali ed economiche della musica."
  }
};

const DidacticsView: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course);
  };

  const closeDetailModal = () => {
    setSelectedCourse(null);
  };

  // Helper to get extended details (with fallbacks)
  const getDetails = (id: number) => {
    // Map generated IDs back to original mock IDs for details
    const lookupId = (id % 5) === 0 ? 5 : (id % 5);
    return COURSE_DETAILS[lookupId] || {
      time: "Da definire",
      duration: "Annuale",
      room: "Da assegnare",
      coordinators: ["Docente titolare"],
      syllabus: "Programma standard ministeriale.",
      enrolled: 0,
      capacity: 10,
      value: "€ 0",
      description: "Descrizione non disponibile."
    };
  };

  // Generate expanded list for UI demo
  const displayCourses = [
    ...COURSES,
    ...COURSES.map((c, i) => ({ ...c, id: c.id + 10, name: `${c.name} (B)` })),
    ...COURSES.map((c, i) => ({ ...c, id: c.id + 20, name: `${c.name} (C)` }))
  ];

  return (
    <div className="p-6 h-full flex flex-col relative">
      <h2 className="text-2xl font-bold text-gray-700 mb-6 flex-shrink-0">Piani di Studio & Corsi</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
        <div className="bg-white p-4 rounded shadow-sm border-t-4 border-nam-blue">
          <div className="text-gray-500 text-sm font-bold uppercase">Corsi Attivi</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">24</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-t-4 border-nam-green">
          <div className="text-gray-500 text-sm font-bold uppercase">Monte Ore Settimanale</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">142h</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-t-4 border-nam-yellow">
          <div className="text-gray-500 text-sm font-bold uppercase">Carnet Attivi</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">15</div>
        </div>
      </div>

      {/* Course Table - Expanded to fill space */}
      <div className="bg-white rounded shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px] border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
           <h3 className="font-bold text-gray-700">Elenco Corsi 2024/25</h3>
           <button className="text-nam-blue text-sm font-semibold hover:underline">Scarica PDF</button>
        </div>
        
        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Nome Corso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Docente Referente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giorno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCourses.map((course) => (
                <tr 
                  key={course.id} 
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  onClick={() => handleViewDetails(course)}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 group-hover:text-nam-blue">{course.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded uppercase ${
                      course.type === 'Individuale' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {course.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{course.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{course.day}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-green-600 font-bold text-xs flex items-center bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                        <i className="fas fa-check-circle mr-1.5"></i>Attivo
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleViewDetails(course); }} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors font-bold text-xs uppercase tracking-wide">
                       Dettagli
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Simulation of Carnet - Pushed to bottom with margin */}
      <div className="mt-6 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-700 mb-3">Carnet Lezioni <span className="text-xs font-normal text-gray-500 ml-2">(Esempio visualizzazione rapida)</span></h3>
        <div className="flex space-x-4 overflow-x-auto pb-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded shadow-sm border border-gray-200 w-72 flex-shrink-0">
                    <div className="flex justify-between mb-2 items-center">
                        <span className="font-bold text-sm text-gray-800">10 Lezioni - Basso</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Mario R.</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div className="bg-nam-green h-3 rounded-full relative" style={{width: `${60 - (i*10)}%`}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Utilizzate: {6 - i}</span>
                        <span>Residue: {4 + i}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- MODAL: SCHEDA TECNICO-DIDATTICA --- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            {/* HEADER */}
            <div className="bg-gray-100 px-8 py-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-2xl font-extrabold text-gray-800">{selectedCourse.name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200 uppercase">
                    🟢 Attivo
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{getDetails(selectedCourse.id).description}</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 text-sm font-bold shadow-sm hover:bg-gray-50">
                   <i className="fas fa-edit mr-2"></i>Modifica Programma
                </button>
                <button onClick={closeDetailModal} className="text-gray-400 hover:text-gray-600 px-2">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* BODY GRID */}
            <div className="p-8 overflow-y-auto bg-gray-50/50">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* BLOCCO 1: LOGISTICA */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                        <i className="fas fa-map-signs mr-2"></i>Logistica
                     </h4>
                     <ul className="space-y-4">
                        <li className="flex items-start">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className="far fa-calendar-alt"></i>
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Quando</p>
                              <p className="text-gray-800 font-medium text-sm">{getDetails(selectedCourse.id).time}</p>
                           </div>
                        </li>
                        <li className="flex items-start">
                           <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className="far fa-clock"></i>
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Durata</p>
                              <p className="text-gray-800 font-medium text-sm">{getDetails(selectedCourse.id).duration}</p>
                           </div>
                        </li>
                        <li className="flex items-start">
                           <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className="fas fa-map-marker-alt"></i>
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Aula Predefinita</p>
                              <p className="text-gray-800 font-medium text-sm">{getDetails(selectedCourse.id).room}</p>
                           </div>
                        </li>
                     </ul>
                  </div>

                  {/* BLOCCO 2: STAFF & MATERIE */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                        <i className="fas fa-chalkboard-teacher mr-2"></i>Staff & Didattica
                     </h4>
                     
                     <div className="mb-4">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Coordinatore</p>
                        <div className="flex items-center bg-gray-50 p-2 rounded border border-gray-100">
                           <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg mr-3">
                              {selectedCourse.teacher.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-gray-800 text-sm">{selectedCourse.teacher}</p>
                              <p className="text-xs text-gray-500">Responsabile Corso</p>
                           </div>
                        </div>
                     </div>

                     <div className="mb-4">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Docenti Coinvolti</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-1">
                           {getDetails(selectedCourse.id).coordinators.map((c, i) => (
                              <li key={i}>{c}</li>
                           ))}
                        </ul>
                     </div>

                     <div className="mt-4 pt-4 border-t border-gray-100">
                        <a href="#" className="flex items-center text-nam-blue hover:underline text-sm font-semibold">
                           <i className="fas fa-file-pdf mr-2"></i> Scarica Programma PDF
                        </a>
                     </div>
                  </div>

                  {/* BLOCCO 3: ECONOMIA & SATURAZIONE */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                     <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                           <i className="fas fa-chart-pie mr-2"></i>Saturazione
                        </h4>
                        
                        <div className="mb-6">
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-3xl font-bold text-gray-800">
                                 {getDetails(selectedCourse.id).enrolled}
                                 <span className="text-sm text-gray-400 font-normal ml-1">/ {getDetails(selectedCourse.id).capacity} Iscritti</span>
                              </span>
                              <span className={`font-bold text-sm ${
                                 (getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) > 0.8 ? 'text-green-600' : 
                                 (getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) > 0.4 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                 {Math.round((getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) * 100)}%
                              </span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                 className={`h-full rounded-full transition-all duration-1000 ${
                                    (getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) > 0.8 ? 'bg-nam-green' : 
                                    (getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) > 0.4 ? 'bg-nam-yellow' : 'bg-nam-red'
                                 }`} 
                                 style={{width: `${(getDetails(selectedCourse.id).enrolled / getDetails(selectedCourse.id).capacity) * 100}%`}}
                              ></div>
                           </div>
                           <p className="text-xs text-gray-400 mt-2 italic">
                              {getDetails(selectedCourse.id).capacity - getDetails(selectedCourse.id).enrolled} posti ancora disponibili
                           </p>
                        </div>
                     </div>

                     <div className="bg-gray-50 p-4 rounded border border-gray-200 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Valore Economico Corso</p>
                        <p className="text-xl font-bold text-gray-700">{getDetails(selectedCourse.id).value}</p>
                     </div>
                  </div>

               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DidacticsView;