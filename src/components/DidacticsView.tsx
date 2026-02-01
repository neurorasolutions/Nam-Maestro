import React, { useState, useEffect } from 'react';
import { CORSI_STRUTTURA } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Student } from '../types';

// Tipo per le sottosezioni della Didattica
type DidacticsSubSection =
   | 'piani_studi'
   | 'pre_iscrizioni'
   | 'corsi_collettivi'
   | 'lezioni_individuali'
   | 'carnet'
   | 'presenze'
   | 'reports';

const DidacticsView: React.FC = () => {
   const [activeSubSection, setActiveSubSection] = useState<DidacticsSubSection>('piani_studi');
   const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
   const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
   const [students, setStudents] = useState<Student[]>([]);
   const [searchTerm, setSearchTerm] = useState('');

   // Carica studenti
   useEffect(() => {
      const fetchStudents = async () => {
         const { data } = await supabase.from('students').select('*');
         if (data) setStudents(data);
      };
      fetchStudents();
   }, []);

   // Menu items per la sidebar interna
   const subMenuItems: { id: DidacticsSubSection; label: string; icon: string }[] = [
      { id: 'piani_studi', label: 'Piani di Studi', icon: 'fa-book-open' },
      { id: 'pre_iscrizioni', label: 'Pre-iscrizioni', icon: 'fa-user-clock' },
      { id: 'corsi_collettivi', label: 'Corsi Collettivi', icon: 'fa-users' },
      { id: 'lezioni_individuali', label: 'Lezioni Individuali', icon: 'fa-chalkboard-teacher' },
      { id: 'carnet', label: 'Carnet di Lezioni', icon: 'fa-ticket-alt' },
      { id: 'presenze', label: 'Inserimento Presenze', icon: 'fa-clipboard-check' },
      { id: 'reports', label: 'Scheda Reports', icon: 'fa-chart-bar' },
   ];

   // Toggle categoria espansa
   const toggleCategory = (category: string) => {
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(category)) {
         newExpanded.delete(category);
      } else {
         newExpanded.add(category);
      }
      setExpandedCategories(newExpanded);
   };

   // Toggle sottocategoria espansa
   const toggleSubcategory = (subcategory: string) => {
      const newExpanded = new Set(expandedSubcategories);
      if (newExpanded.has(subcategory)) {
         newExpanded.delete(subcategory);
      } else {
         newExpanded.add(subcategory);
      }
      setExpandedSubcategories(newExpanded);
   };

   // Conta studenti per corso
   const countStudentsForCourse = (macroCategoria: string, corso: string, sottocategoria?: string): number => {
      const searchString = sottocategoria
         ? `${sottocategoria} ${corso}`.toLowerCase()
         : `${macroCategoria} ${corso}`.toLowerCase();

      return students.filter(s =>
         s.enrolled_course?.toLowerCase().includes(searchString) ||
         s.course_1?.toLowerCase().includes(searchString)
      ).length;
   };

   // Ottieni studenti per corso
   const getStudentsForCourse = (macroCategoria: string, corso: string, sottocategoria?: string): Student[] => {
      const searchString = sottocategoria
         ? `${sottocategoria} ${corso}`.toLowerCase()
         : `${macroCategoria} ${corso}`.toLowerCase();

      return students.filter(s =>
         s.enrolled_course?.toLowerCase().includes(searchString) ||
         s.course_1?.toLowerCase().includes(searchString)
      );
   };

   // Conta totale studenti per macro-categoria
   const countTotalStudentsForCategory = (macroCategoria: string): number => {
      const config = CORSI_STRUTTURA[macroCategoria as keyof typeof CORSI_STRUTTURA];
      if (!config) return 0;

      if ('sottocategorie' in config) {
         let total = 0;
         Object.entries(config.sottocategorie).forEach(([sottoCat, corsi]) => {
            corsi.forEach(corso => {
               total += countStudentsForCourse(macroCategoria, corso, sottoCat);
            });
         });
         return total;
      } else {
         return config.corsi.reduce((acc, corso) =>
            acc + countStudentsForCourse(macroCategoria, corso), 0
         );
      }
   };

   // Componente placeholder per sezioni non ancora sviluppate
   const InProduzioneView = ({ section }: { section: string }) => (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
         <div className="text-center p-10 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
            <div className="text-5xl mb-4">🚧</div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">IN PRODUZIONE</h1>
            <p className="text-gray-500 text-sm mb-4">
               La sezione <strong className="text-gray-700">{section}</strong> è attualmente in fase di sviluppo.
            </p>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
               <span className="animate-pulse">●</span> Coming Soon
            </div>
         </div>
      </div>
   );

   // Vista Piani di Studi con Macro-Categorie
   const PianiStudiView = () => {
      // Filtra categorie in base alla ricerca
      const filteredCategories = Object.entries(CORSI_STRUTTURA).filter(([name]) =>
         name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
         <div className="p-6">
            <div className="mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Piani di Studi</h2>
               <p className="text-gray-500 text-sm mt-1">Corsi organizzati per macro-categoria</p>
            </div>

            {/* Barra ricerca */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
               <div className="flex-1 relative">
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                  <input
                     type="text"
                     placeholder="Cerca categoria..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
               </div>
               <span className="text-sm text-gray-500">
                  {Object.keys(CORSI_STRUTTURA).length} macro-categorie
               </span>
            </div>

            {/* Macro-Categorie Accordion */}
            <div className="space-y-3">
               {filteredCategories.map(([categoria, config]) => {
                  const isExpanded = expandedCategories.has(categoria);
                  const totalStudents = countTotalStudentsForCategory(categoria);
                  const hasSubcategories = 'sottocategorie' in config;

                  return (
                     <div key={categoria} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header Macro-Categoria */}
                        <button
                           onClick={() => toggleCategory(categoria)}
                           className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white shadow-md`}>
                                 <i className={`fas ${config.icon} text-xl`}></i>
                              </div>
                              <div className="text-left">
                                 <h3 className="font-bold text-gray-800 text-lg">{categoria}</h3>
                                 <p className="text-sm text-gray-500">
                                    {hasSubcategories
                                       ? `${Object.keys(config.sottocategorie).length} strumenti`
                                       : `${config.corsi.length} livelli`}
                                    {totalStudents > 0 && (
                                       <span className="ml-2 text-blue-600">• {totalStudents} iscritti</span>
                                    )}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              {totalStudents > 0 && (
                                 <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {totalStudents}
                                 </span>
                              )}
                              <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                           </div>
                        </button>

                        {/* Contenuto Espanso */}
                        {isExpanded && (
                           <div className="border-t border-gray-200 bg-gray-50 p-4">
                              {hasSubcategories ? (
                                 // Sottocategorie (es. Strumenti) - LAYOUT ORIZZONTALE
                                 <div>
                                    {/* Pulsanti sottocategorie in orizzontale */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                       {Object.keys(config.sottocategorie).map((sottoCat) => {
                                          const isSubExpanded = expandedSubcategories.has(`${categoria}-${sottoCat}`);
                                          const corsi = config.sottocategorie[sottoCat];
                                          return (
                                             <button
                                                key={sottoCat}
                                                onClick={() => toggleSubcategory(`${categoria}-${sottoCat}`)}
                                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${isSubExpanded
                                                      ? 'bg-gray-700 text-white border-2 border-gray-700'
                                                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-400'
                                                   }`}
                                             >
                                                {sottoCat}
                                                <span className={`ml-2 text-xs ${isSubExpanded ? 'text-gray-300' : 'text-gray-400'}`}>
                                                   ({corsi.length})
                                                </span>
                                             </button>
                                          );
                                       })}
                                    </div>

                                    {/* Livelli della sottocategoria selezionata - GRIGLIA ORIZZONTALE */}
                                    {Object.entries(config.sottocategorie).map(([sottoCat, corsi]) => {
                                       const isSubExpanded = expandedSubcategories.has(`${categoria}-${sottoCat}`);
                                       if (!isSubExpanded) return null;

                                       return (
                                          <div key={sottoCat} className="bg-gray-50 rounded-lg p-4">
                                             <h4 className="font-semibold text-gray-700 mb-3">{sottoCat}</h4>
                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {corsi.map((corso) => {
                                                   const studentiCorso = getStudentsForCourse(categoria, corso, sottoCat);
                                                   return (
                                                      <div key={corso} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                                                         <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium text-gray-700">{corso}</span>
                                                            <span className={`text-xs px-2 py-1 rounded ${studentiCorso.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                               {studentiCorso.length}
                                                            </span>
                                                         </div>
                                                         {studentiCorso.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                               {studentiCorso.slice(0, 3).map(s => (
                                                                  <span key={s.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                     {s.first_name} {s.last_name?.[0]}.
                                                                  </span>
                                                               ))}
                                                               {studentiCorso.length > 3 && (
                                                                  <span className="text-xs text-gray-500 px-2 py-1">
                                                                     +{studentiCorso.length - 3}
                                                                  </span>
                                                               )}
                                                            </div>
                                                         )}
                                                      </div>
                                                   );
                                                })}
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              ) : (
                                 // Corsi diretti (senza sottocategorie)
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {config.corsi.map((corso) => {
                                       const studentiCorso = getStudentsForCourse(categoria, corso);
                                       return (
                                          <div key={corso} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                                             <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-700">{corso}</span>
                                                <span className={`text-xs px-2 py-1 rounded ${studentiCorso.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                   {studentiCorso.length} iscritti
                                                </span>
                                             </div>
                                             {studentiCorso.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                   {studentiCorso.slice(0, 5).map(s => (
                                                      <span key={s.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                         {s.first_name} {s.last_name?.[0]}.
                                                      </span>
                                                   ))}
                                                   {studentiCorso.length > 5 && (
                                                      <span className="text-xs text-gray-500 px-2 py-1">
                                                         +{studentiCorso.length - 5} altri
                                                      </span>
                                                   )}
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      );
   };

   // Render del contenuto principale in base alla sottosezione attiva
   const renderContent = () => {
      switch (activeSubSection) {
         case 'piani_studi':
            return <PianiStudiView />;
         case 'pre_iscrizioni':
            return <InProduzioneView section="Pre-iscrizioni" />;
         case 'corsi_collettivi':
            return <InProduzioneView section="Corsi Collettivi" />;
         case 'lezioni_individuali':
            return <InProduzioneView section="Lezioni Individuali" />;
         case 'carnet':
            return <InProduzioneView section="Carnet di Lezioni" />;
         case 'presenze':
            return <InProduzioneView section="Inserimento Presenze" />;
         case 'reports':
            return <InProduzioneView section="Scheda Reports" />;
         default:
            return <PianiStudiView />;
      }
   };

   return (
      <div className="flex h-full">
         {/* Sidebar interna - Menu Didattica */}
         <div className="w-56 bg-gray-50 border-r border-gray-200 flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
               <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                  <i className="fas fa-graduation-cap mr-2 text-blue-600"></i>
                  Didattica & Corsi
               </h3>
            </div>
            <nav className="py-2">
               {subMenuItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveSubSection(item.id)}
                     className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-3 border-l-4 ${activeSubSection === item.id
                        ? 'bg-white border-blue-600 text-blue-700 font-semibold shadow-sm'
                        : 'border-transparent text-gray-600 hover:bg-white hover:text-gray-800'
                        }`}
                  >
                     <i className={`fas ${item.icon} w-5 text-center ${activeSubSection === item.id ? 'text-blue-600' : 'text-gray-400'}`}></i>
                     {item.label}
                  </button>
               ))}
            </nav>
         </div>

         {/* Contenuto principale */}
         <div className="flex-1 overflow-auto bg-gray-50">
            {renderContent()}
         </div>
      </div>
   );
};

export default DidacticsView;
