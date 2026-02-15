import React, { useState, useEffect } from 'react';
import { CORSI_STRUTTURA } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Student, StudyPlan, StudyPlanSubject } from '../types';
import CreateStudyPlanModal from './CreateStudyPlanModal';
import TeachersView from './TeachersView';

// Tipo per le sottosezioni della Didattica
type DidacticsSubSection =
   | 'docenti'
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
   const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);

   // Nuovo: State per piani di studio
   const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
   const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);

   // Carica studenti
   useEffect(() => {
      const fetchStudents = async () => {
         const { data } = await supabase.from('students').select('*');
         if (data) setStudents(data);
      };
      fetchStudents();
   }, []);

   // Carica piani di studio
   useEffect(() => {
      fetchStudyPlans();
   }, []);

   const fetchStudyPlans = async () => {
      const { data, error } = await supabase
         .from('study_plans')
         .select('*')
         .eq('is_active', true)
         .order('created_at', { ascending: false });

      if (!error && data) {
         setStudyPlans(data);
      }
   };

   // Menu items per la sidebar interna
   const subMenuItems: { id: DidacticsSubSection; label: string; icon: string }[] = [
      { id: 'docenti', label: 'Docenti', icon: 'fa-chalkboard-user' },
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

      const selectedConfig = selectedCategoryModal ? CORSI_STRUTTURA[selectedCategoryModal as keyof typeof CORSI_STRUTTURA] : null;

      return (
         <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-bold text-gray-800">Piani di Studi</h2>
                  <p className="text-gray-500 text-sm mt-1">Corsi organizzati per macro-categoria</p>
               </div>
               <button
                  onClick={() => setShowCreatePlanModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
               >
                  <i className="fas fa-plus"></i>
                  Crea Piano di Studio
               </button>
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

            {/* Macro-Categorie - Layout Verticale/Griglia */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {filteredCategories.map(([categoria, config]) => {
                  const totalStudents = countTotalStudentsForCategory(categoria);
                  const hasSubcategories = 'sottocategorie' in config;

                  return (
                     <button
                        key={categoria}
                        onClick={() => setSelectedCategoryModal(categoria)}
                        className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all p-5 text-left group h-full flex flex-col"
                     >
                        <div className="flex flex-col gap-3 flex-1">
                           <div className="flex items-center gap-3">
                              <div className={`w-14 h-14 flex-shrink-0 ${config.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                                 <i className={`fas ${config.icon} text-2xl`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h3 className="font-bold text-gray-800 text-lg leading-tight">{categoria}</h3>
                                 <p className="text-xs text-gray-500 mt-1">
                                    {hasSubcategories
                                       ? `${Object.keys(config.sottocategorie).length} strumenti`
                                       : `${config.corsi.length} livelli`}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                              <span className="text-xs text-gray-500">Iscritti</span>
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                 {totalStudents > 0 ? totalStudents : 0}
                              </span>
                           </div>
                        </div>
                     </button>
                  );
               })}
            </div>

            {/* Modal Popup per visualizzare i dettagli della categoria */}
            {selectedCategoryModal && selectedConfig && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCategoryModal(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                     {/* Header Modal */}
                     <div className={`${selectedConfig.color} text-white p-6 flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg">
                              <i className={`fas ${selectedConfig.icon} text-3xl`}></i>
                           </div>
                           <div>
                              <h2 className="text-2xl font-bold">{selectedCategoryModal}</h2>
                              <p className="text-white text-opacity-80 text-sm mt-1">
                                 {'sottocategorie' in selectedConfig
                                    ? `${Object.keys(selectedConfig.sottocategorie).length} strumenti • ${countTotalStudentsForCategory(selectedCategoryModal)} iscritti`
                                    : `${selectedConfig.corsi.length} livelli • ${countTotalStudentsForCategory(selectedCategoryModal)} iscritti`}
                              </p>
                           </div>
                        </div>
                        <button
                           onClick={() => setSelectedCategoryModal(null)}
                           className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all"
                        >
                           <i className="fas fa-times text-xl"></i>
                        </button>
                     </div>

                     {/* Contenuto Modal */}
                     <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {'sottocategorie' in selectedConfig ? (
                           // Sottocategorie (es. Strumenti)
                           <div className="space-y-6">
                              {Object.entries(selectedConfig.sottocategorie).map(([sottoCat, corsi]) => (
                                 <div key={sottoCat} className="bg-gray-50 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                                       <span className={`w-2 h-2 ${selectedConfig.color} rounded-full`}></span>
                                       {sottoCat}
                                       <span className="text-sm text-gray-500 font-normal">({corsi.length} livelli)</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                       {corsi.map((corso) => {
                                          const studentiCorso = getStudentsForCourse(selectedCategoryModal, corso, sottoCat);
                                          return (
                                             <div key={corso} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                   <span className="text-sm font-semibold text-gray-700">{corso}</span>
                                                   <span className={`text-xs px-2 py-1 rounded-full font-bold ${studentiCorso.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                      {studentiCorso.length}
                                                   </span>
                                                </div>
                                                {studentiCorso.length > 0 && (
                                                   <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
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
                              ))}
                           </div>
                        ) : (
                           // Corsi diretti (senza sottocategorie)
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedConfig.corsi.map((corso) => {
                                 const studentiCorso = getStudentsForCourse(selectedCategoryModal, corso);
                                 return (
                                    <div key={corso} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                       <div className="flex items-center justify-between mb-2">
                                          <span className="font-semibold text-gray-800">{corso}</span>
                                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${studentiCorso.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                             {studentiCorso.length}
                                          </span>
                                       </div>
                                       {studentiCorso.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-200">
                                             {studentiCorso.slice(0, 5).map(s => (
                                                <span key={s.id} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
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
                  </div>
               </div>
            )}
         </div>
      );
   };

   // Vista Corsi Collettivi
   const CorsiCollettiviView = () => {
      const [collectiveSubjects, setCollectiveSubjects] = useState<(StudyPlanSubject & { plan_name?: string })[]>([]);

      useEffect(() => {
         const fetchCollectiveSubjects = async () => {
            const { data, error } = await supabase
               .from('study_plan_subjects')
               .select(`
                  *,
                  study_plans!inner(name, is_active)
               `)
               .eq('subject_type', 'collective')
               .eq('study_plans.is_active', true);

            if (!error && data) {
               const formatted = data.map((item: any) => ({
                  ...item,
                  plan_name: item.study_plans?.name,
               }));
               setCollectiveSubjects(formatted);
            }
         };

         fetchCollectiveSubjects();
      }, []);

      return (
         <div className="p-6">
            <div className="mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Corsi Collettivi</h2>
               <p className="text-gray-500 text-sm mt-1">Materie collettive dai piani di studio attivi</p>
            </div>

            {collectiveSubjects.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <i className="fas fa-users text-4xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">Nessun corso collettivo configurato</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collectiveSubjects.map((subject) => (
                     <div key={subject.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                           <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{subject.subject_name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{subject.plan_name}</p>
                           </div>
                           <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                              Collettivo
                           </span>
                        </div>
                        <div className="space-y-2 text-sm">
                           <div className="flex items-center gap-2 text-gray-600">
                              <i className="fas fa-clock w-4"></i>
                              <span>{subject.total_hours} ore totali</span>
                           </div>
                           {subject.teacher_name && (
                              <div className="flex items-center gap-2 text-gray-600">
                                 <i className="fas fa-user w-4"></i>
                                 <span>{subject.teacher_name}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      );
   };

   // Vista Lezioni Individuali
   const LezioniIndividualiView = () => {
      const [individualSubjects, setIndividualSubjects] = useState<(StudyPlanSubject & { plan_name?: string })[]>([]);

      useEffect(() => {
         const fetchIndividualSubjects = async () => {
            const { data, error } = await supabase
               .from('study_plan_subjects')
               .select(`
                  *,
                  study_plans!inner(name, is_active)
               `)
               .eq('subject_type', 'individual')
               .eq('study_plans.is_active', true);

            if (!error && data) {
               const formatted = data.map((item: any) => ({
                  ...item,
                  plan_name: item.study_plans?.name,
               }));
               setIndividualSubjects(formatted);
            }
         };

         fetchIndividualSubjects();
      }, []);

      return (
         <div className="p-6">
            <div className="mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Lezioni Individuali</h2>
               <p className="text-gray-500 text-sm mt-1">Materie individuali dai piani di studio attivi</p>
            </div>

            {individualSubjects.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <i className="fas fa-chalkboard-teacher text-4xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">Nessuna lezione individuale configurata</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {individualSubjects.map((subject) => (
                     <div key={subject.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                           <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{subject.subject_name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{subject.plan_name}</p>
                           </div>
                           <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                              Individuale
                           </span>
                        </div>
                        <div className="space-y-2 text-sm">
                           <div className="flex items-center gap-2 text-gray-600">
                              <i className="fas fa-clock w-4"></i>
                              <span>{subject.total_hours} ore totali</span>
                           </div>
                           {subject.teacher_name && (
                              <div className="flex items-center gap-2 text-gray-600">
                                 <i className="fas fa-user w-4"></i>
                                 <span>{subject.teacher_name}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      );
   };

   // Render del contenuto principale in base alla sottosezione attiva
   const renderContent = () => {
      switch (activeSubSection) {
         case 'docenti':
            return <TeachersView />;
         case 'piani_studi':
            return <PianiStudiView />;
         case 'pre_iscrizioni':
            return <InProduzioneView section="Pre-iscrizioni" />;
         case 'corsi_collettivi':
            return <CorsiCollettiviView />;
         case 'lezioni_individuali':
            return <LezioniIndividualiView />;
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

         {/* Modal Creazione Piano di Studio */}
         {showCreatePlanModal && (
            <CreateStudyPlanModal
               onClose={() => setShowCreatePlanModal(false)}
               onSuccess={() => {
                  setShowCreatePlanModal(false);
                  fetchStudyPlans();
               }}
            />
         )}
      </div>
   );
};

export default DidacticsView;
