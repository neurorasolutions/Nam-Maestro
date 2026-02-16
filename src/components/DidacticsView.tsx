import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Pencil, Plus, Save, RefreshCw, Calendar, Eye, Users, Clock, Euro } from 'lucide-react';
import { CORSI_STRUTTURA } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Student, StudyPlan, StudyPlanSubject } from '../types';
import CreateStudyPlanModal from './CreateStudyPlanModal';
import CalendarWizard from './CalendarWizard';
import TeachersView from './TeachersView';
import { isHoliday } from '../utils/holidays';

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
   const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   const [planToEdit, setPlanToEdit] = useState<StudyPlan | null>(null);
   const [editSubjects, setEditSubjects] = useState<StudyPlanSubject[]>([]);
   const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [showRegenerateCalendar, setShowRegenerateCalendar] = useState(false);
   const [savedPlanForCalendar, setSavedPlanForCalendar] = useState<StudyPlan | null>(null);
   const [savedSubjectsForCalendar, setSavedSubjectsForCalendar] = useState<StudyPlanSubject[]>([]);
   const [planDetailView, setPlanDetailView] = useState<StudyPlan | null>(null);
   const [planDetailSubjects, setPlanDetailSubjects] = useState<StudyPlanSubject[]>([]);
   const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

   const handleDeletePlan = async (plan: StudyPlan) => {
      setIsDeleting(true);
      try {
         // 1. Elimina lezioni associate (in base a course_name)
         const { error: lessonsError } = await supabase
            .from('lessons')
            .delete()
            .eq('course_name', plan.name);

         if (lessonsError) throw lessonsError;

         // 2. Elimina materie del piano
         const { error: subjectsError } = await supabase
            .from('study_plan_subjects')
            .delete()
            .eq('study_plan_id', plan.id);

         if (subjectsError) throw subjectsError;

         // 3. Elimina il piano
         const { error: planError } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', plan.id);

         if (planError) throw planError;

         // Ricarica piani e chiudi modal
         alert(`✅ Piano "${plan.name}" eliminato con successo`);
         await fetchStudyPlans();
         setPlanToDelete(null);
      } catch (error: any) {
         console.error('Errore eliminazione piano:', error);
         alert(`❌ Errore durante l'eliminazione: ${error.message}`);
      } finally {
         setIsDeleting(false);
      }
   };

   const handleViewPlanDetail = async (plan: StudyPlan) => {
      setPlanDetailView(plan);
      setIsLoadingDetail(true);

      // Carica materie del piano
      const { data, error } = await supabase
         .from('study_plan_subjects')
         .select('*')
         .eq('study_plan_id', plan.id)
         .order('order_index');

      if (!error && data) {
         setPlanDetailSubjects(data);
      }
      setIsLoadingDetail(false);
   };

   const handleEditPlan = async (plan: StudyPlan) => {
      setPlanToEdit(plan);
      setIsLoadingSubjects(true);

      // Carica materie del piano
      const { data, error } = await supabase
         .from('study_plan_subjects')
         .select('*')
         .eq('study_plan_id', plan.id)
         .order('order_index');

      if (!error && data) {
         setEditSubjects(data);
      }
      setIsLoadingSubjects(false);
   };

   const handleAddSubject = () => {
      const newSubject: StudyPlanSubject = {
         study_plan_id: planToEdit?.id || '',
         subject_name: '',
         subject_type: 'collective',
         total_hours: 20,
         teacher_name: '',
         order_index: editSubjects.length,
      };
      setEditSubjects([...editSubjects, newSubject]);
   };

   const handleRemoveSubject = (index: number) => {
      setEditSubjects(editSubjects.filter((_, i) => i !== index));
   };

   const handleUpdateSubject = (index: number, field: keyof StudyPlanSubject, value: any) => {
      const updated = [...editSubjects];
      (updated[index] as any)[field] = value;
      setEditSubjects(updated);
   };

   const handleSaveEdit = async () => {
      if (!planToEdit) return;

      setIsSaving(true);
      try {
         // 1. Aggiorna info piano
         const { error: planError } = await supabase
            .from('study_plans')
            .update({
               name: planToEdit.name,
               description: planToEdit.description,
               category: planToEdit.category,
               subcategory: planToEdit.subcategory,
               price: planToEdit.price || null,
            })
            .eq('id', planToEdit.id);

         if (planError) throw planError;

         // 2. Elimina tutte le materie esistenti
         const { error: deleteError } = await supabase
            .from('study_plan_subjects')
            .delete()
            .eq('study_plan_id', planToEdit.id);

         if (deleteError) throw deleteError;

         // 3. Inserisci materie aggiornate (filtro quelle con nome)
         const validSubjects = editSubjects
            .filter(s => s.subject_name.trim() !== '')
            .map((s, idx) => ({
               study_plan_id: planToEdit.id,
               subject_name: s.subject_name,
               subject_type: s.subject_type,
               total_hours: s.total_hours,
               teacher_name: s.teacher_name || null,
               order_index: idx,
            }));

         let insertedSubjects: StudyPlanSubject[] = [];
         if (validSubjects.length > 0) {
            const { data, error: insertError } = await supabase
               .from('study_plan_subjects')
               .insert(validSubjects)
               .select();

            if (insertError) throw insertError;
            insertedSubjects = data || [];
         }

         alert(`✅ Piano "${planToEdit.name}" modificato con successo!`);
         await fetchStudyPlans();

         // Chiedi se vuole rigenerare il calendario
         setSavedPlanForCalendar(planToEdit);
         setSavedSubjectsForCalendar(insertedSubjects);
         setPlanToEdit(null);
         setEditSubjects([]);
         setShowRegenerateCalendar(true);
      } catch (error: any) {
         console.error('Errore salvataggio modifiche:', error);
         alert(`❌ Errore durante il salvataggio: ${error.message}`);
      } finally {
         setIsSaving(false);
      }
   };

   const handleRegenerateCalendar = async (schedules: any[], startDate: string, endDate: string, hoursPerLesson: number) => {
      if (!savedPlanForCalendar) return;

      try {
         // 1. Elimina tutte le lezioni esistenti per questo piano
         const { error: deleteError } = await supabase
            .from('lessons')
            .delete()
            .eq('course_name', savedPlanForCalendar.name);

         if (deleteError) throw deleteError;

         // 2. Genera nuove lezioni (stesso codice di CreateStudyPlanModal)
         const lessonsToInsert: any[] = [];

         for (let i = 0; i < schedules.length; i++) {
            const schedule = schedules[i];
            const subject = savedSubjectsForCalendar[i];

            if (!subject) continue;

            const totalLessonsNeeded = Math.ceil(subject.total_hours / hoursPerLesson);
            let currentDate = new Date(startDate);
            const endDateObj = new Date(endDate);
            let lessonsCreated = 0;
            let iterations = 0;
            const maxIterations = 1000;

            while (lessonsCreated < totalLessonsNeeded && currentDate <= endDateObj && iterations < maxIterations) {
               iterations++;
               const dayOfWeek = currentDate.getDay();
               const lessonDateStr = currentDate.toISOString().split('T')[0];

               const isValidDay =
                  schedule.daysOfWeek.includes(dayOfWeek) &&
                  !isHoliday(lessonDateStr);

               if (isValidDay) {
                  lessonsToInsert.push({
                     course_name: savedPlanForCalendar.name,
                     title: subject.subject_name,
                     teacher_name: subject.teacher_name || '',
                     room: schedule.room,
                     lesson_date: lessonDateStr,
                     start_time: schedule.startTime,
                     end_time: schedule.endTime,
                     is_hybrid: false,
                  });
                  lessonsCreated++;
               }

               currentDate.setDate(currentDate.getDate() + 1);
            }
         }

         if (lessonsToInsert.length > 0) {
            const { error: insertError } = await supabase
               .from('lessons')
               .insert(lessonsToInsert);

            if (insertError) throw insertError;
         }

         alert(`✅ Calendario rigenerato! ${lessonsToInsert.length} lezioni create.`);
         setShowRegenerateCalendar(false);
         setSavedPlanForCalendar(null);
         setSavedSubjectsForCalendar([]);
      } catch (error: any) {
         console.error('Errore rigenerazione calendario:', error);
         alert(`❌ Errore durante la rigenerazione: ${error.message}`);
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

      // Raggruppa piani dinamici per categoria
      const getDynamicPlansForCategory = (categoria: string) => {
         return studyPlans.filter(plan =>
            plan.category.toUpperCase() === categoria.toUpperCase()
         );
      };

      // Conta piani dinamici per categoria
      const countDynamicPlansForCategory = (categoria: string) => {
         return getDynamicPlansForCategory(categoria).length;
      };

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
                     placeholder="Cerca categoria o piano di studio..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
               </div>
               <span className="text-sm text-gray-500">
                  {studyPlans.length} piani di studio creati
               </span>
            </div>

            {/* Macro-Categorie - Layout Verticale/Griglia */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {filteredCategories.map(([categoria, config]) => {
                  const dynamicPlansCount = countDynamicPlansForCategory(categoria);
                  const dynamicPlans = getDynamicPlansForCategory(categoria);
                  const totalStudentsInPlans = dynamicPlans.reduce((acc, plan) => {
                     return acc + students.filter(s => s.study_plan_id === plan.id).length;
                  }, 0);

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
                                    {dynamicPlansCount > 0 ? (
                                       <span className="text-blue-600 font-semibold">
                                          {dynamicPlansCount} {dynamicPlansCount === 1 ? 'piano' : 'piani'}
                                       </span>
                                    ) : (
                                       <span className="text-gray-400">Nessun piano creato</span>
                                    )}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                              <span className="text-xs text-gray-500">Iscritti</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${totalStudentsInPlans > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                 {totalStudentsInPlans}
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
                                 {getDynamicPlansForCategory(selectedCategoryModal).length} {getDynamicPlansForCategory(selectedCategoryModal).length === 1 ? 'piano' : 'piani'} di studio
                              </p>
                           </div>
                        </div>
                        <button
                           onClick={() => setSelectedCategoryModal(null)}
                           className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all"
                        >
                           <X className="w-6 h-6" />
                        </button>
                     </div>

                     {/* Contenuto Modal */}
                     <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Piani di Studio */}
                        {selectedCategoryModal && getDynamicPlansForCategory(selectedCategoryModal).length > 0 ? (
                           <div>
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                 <i className="fas fa-graduation-cap text-blue-600"></i>
                                 Piani di Studio
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {getDynamicPlansForCategory(selectedCategoryModal).map((plan) => {
                                    const studentiPiano = students.filter(s => s.study_plan_id === plan.id);
                                    return (
                                       <div
                                          key={plan.id}
                                          onClick={() => handleViewPlanDetail(plan)}
                                          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4 hover:shadow-lg transition-all cursor-pointer"
                                       >
                                          <div className="flex items-start justify-between mb-3">
                                             <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                   <i className="fas fa-certificate text-blue-600 text-sm"></i>
                                                   <span className="font-bold text-gray-800">{plan.name}</span>
                                                </div>
                                                {plan.subcategory && (
                                                   <span className="text-xs text-blue-600 font-medium">{plan.subcategory}</span>
                                                )}
                                             </div>
                                             <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${studentiPiano.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                   {studentiPiano.length}
                                                </span>
                                                <button
                                                   onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); }}
                                                   className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                                                   title="Modifica piano"
                                                >
                                                   <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                   onClick={(e) => { e.stopPropagation(); setPlanToDelete(plan); }}
                                                   className="w-7 h-7 flex items-center justify-center rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                                   title="Elimina piano"
                                                >
                                                   <Trash2 className="w-4 h-4" />
                                                </button>
                                             </div>
                                          </div>

                                          {plan.description && (
                                             <p className="text-xs text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                                          )}

                                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 pb-3 border-b border-blue-200">
                                             <span className="flex items-center gap-1">
                                                <i className="fas fa-clock"></i>
                                                {plan.total_hours || 0}h
                                             </span>
                                             <span className="flex items-center gap-1">
                                                <i className="fas fa-user"></i>
                                                {plan.total_individual_hours || 0}h
                                             </span>
                                             <span className="flex items-center gap-1">
                                                <i className="fas fa-users"></i>
                                                {plan.total_collective_hours || 0}h
                                             </span>
                                          </div>

                                          {studentiPiano.length > 0 && (
                                             <div className="flex flex-wrap gap-1">
                                                {studentiPiano.slice(0, 3).map(s => (
                                                   <span key={s.id} className="text-xs bg-white px-2 py-1 rounded border border-blue-300">
                                                      {s.first_name} {s.last_name?.[0]}.
                                                   </span>
                                                ))}
                                                {studentiPiano.length > 3 && (
                                                   <span className="text-xs text-blue-600 px-2 py-1 font-medium">
                                                      +{studentiPiano.length - 3}
                                                   </span>
                                                )}
                                             </div>
                                          )}
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-12">
                              <i className="fas fa-folder-open text-gray-300 text-5xl mb-4"></i>
                              <p className="text-gray-500 text-lg font-medium">Nessun piano di studio in questa categoria</p>
                              <p className="text-gray-400 text-sm mt-2">Clicca su "Crea Piano di Studio" per aggiungerne uno</p>
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

         {/* Modal Modifica Piano */}
         {planToEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-bold">Modifica Piano di Studio</h2>
                        <p className="text-blue-100 text-sm mt-1">{planToEdit.name}</p>
                     </div>
                     <button
                        onClick={() => {
                           setPlanToEdit(null);
                           setEditSubjects([]);
                        }}
                        className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all"
                     >
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                     {isLoadingSubjects ? (
                        <div className="text-center py-12">
                           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                           <p className="text-gray-500">Caricamento materie...</p>
                        </div>
                     ) : (
                        <>
                           {/* Info Piano */}
                           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                              <h3 className="font-semibold text-gray-800 mb-3">Informazioni Piano</h3>
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Piano</label>
                                    <input
                                       type="text"
                                       value={planToEdit.name}
                                       onChange={(e) => setPlanToEdit({ ...planToEdit, name: e.target.value })}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                       value={planToEdit.category}
                                       onChange={(e) => setPlanToEdit({ ...planToEdit, category: e.target.value })}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                       {Object.keys(CORSI_STRUTTURA).map(cat => (
                                          <option key={cat} value={cat}>{cat}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo (€)</label>
                                    <input
                                       type="number"
                                       min="0"
                                       step="0.01"
                                       value={planToEdit.price || 0}
                                       onChange={(e) => setPlanToEdit({ ...planToEdit, price: parseFloat(e.target.value) || 0 })}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                                 <textarea
                                    value={planToEdit.description || ''}
                                    onChange={(e) => setPlanToEdit({ ...planToEdit, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                 />
                              </div>
                           </div>

                           {/* Materie */}
                           <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                 <h3 className="font-semibold text-gray-800">Materie del Piano</h3>
                                 <button
                                    onClick={handleAddSubject}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                 >
                                    <Plus className="w-4 h-4" />
                                    Aggiungi Materia
                                 </button>
                              </div>

                              {editSubjects.length === 0 ? (
                                 <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500">Nessuna materia. Clicca "Aggiungi Materia" per iniziare.</p>
                                 </div>
                              ) : (
                                 <div className="space-y-3">
                                    {editSubjects.map((subject, idx) => (
                                       <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                             <div className="flex-1 grid grid-cols-4 gap-3">
                                                <div>
                                                   <label className="block text-xs font-medium text-gray-600 mb-1">Nome Materia *</label>
                                                   <input
                                                      type="text"
                                                      value={subject.subject_name}
                                                      onChange={(e) => handleUpdateSubject(idx, 'subject_name', e.target.value)}
                                                      placeholder="es. Teoria Musicale"
                                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                   />
                                                </div>
                                                <div>
                                                   <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                                                   <select
                                                      value={subject.subject_type}
                                                      onChange={(e) => handleUpdateSubject(idx, 'subject_type', e.target.value)}
                                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                   >
                                                      <option value="collective">Collettivo</option>
                                                      <option value="individual">Individuale</option>
                                                   </select>
                                                </div>
                                                <div>
                                                   <label className="block text-xs font-medium text-gray-600 mb-1">Ore Totali</label>
                                                   <input
                                                      type="number"
                                                      value={subject.total_hours}
                                                      onChange={(e) => handleUpdateSubject(idx, 'total_hours', parseInt(e.target.value))}
                                                      min="1"
                                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                   />
                                                </div>
                                                <div>
                                                   <label className="block text-xs font-medium text-gray-600 mb-1">Docente</label>
                                                   <input
                                                      type="text"
                                                      value={subject.teacher_name || ''}
                                                      onChange={(e) => handleUpdateSubject(idx, 'teacher_name', e.target.value)}
                                                      placeholder="Nome docente"
                                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                   />
                                                </div>
                                             </div>
                                             <button
                                                onClick={() => handleRemoveSubject(idx)}
                                                className="mt-6 w-8 h-8 flex items-center justify-center rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                                title="Rimuovi materia"
                                             >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           {/* Info aggiuntive */}
                           <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                              <p className="font-medium mb-1 flex items-center gap-2">
                                 <Calendar className="w-4 h-4" />
                                 Rigenerazione Calendario Automatica
                              </p>
                              <p>Dopo aver salvato le modifiche, ti verrà chiesto se vuoi rigenerare automaticamente il calendario con le nuove materie e ore aggiornate.</p>
                           </div>
                        </>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                     <button
                        onClick={() => {
                           setPlanToEdit(null);
                           setEditSubjects([]);
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                     >
                        Annulla
                     </button>
                     <button
                        onClick={handleSaveEdit}
                        disabled={isSaving || isLoadingSubjects}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                     >
                        {isSaving ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Salvataggio...
                           </>
                        ) : (
                           <>
                              <Save className="w-4 h-4" />
                              Salva Modifiche
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal Conferma Rigenerazione Calendario */}
         {showRegenerateCalendar && savedPlanForCalendar && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="w-12 h-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-blue-600" />
                     </div>
                     <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                           Vuoi rigenerare il calendario?
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                           Le modifiche al piano "<strong>{savedPlanForCalendar.name}</strong>" sono state salvate con successo.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                           <p className="font-medium mb-1">📅 Rigenerazione calendario:</p>
                           <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Elimina tutte le vecchie lezioni</li>
                              <li>Genera nuove lezioni con materie/ore aggiornate</li>
                              <li>Ti chiederà date e orari per la calendarizzazione</li>
                           </ul>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                     <button
                        onClick={() => {
                           setShowRegenerateCalendar(false);
                           setSavedPlanForCalendar(null);
                           setSavedSubjectsForCalendar([]);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                     >
                        No, mantieni calendario attuale
                     </button>
                     <button
                        onClick={() => {
                           // Chiudi questo modal e apri CalendarWizard
                           setShowRegenerateCalendar(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                     >
                        <RefreshCw className="w-4 h-4" />
                        Sì, rigenera calendario
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* CalendarWizard per Rigenerazione */}
         {!showRegenerateCalendar && savedPlanForCalendar && savedSubjectsForCalendar.length > 0 && (
            <CalendarWizard
               subjects={savedSubjectsForCalendar}
               onComplete={handleRegenerateCalendar}
               onCancel={() => {
                  setSavedPlanForCalendar(null);
                  setSavedSubjectsForCalendar([]);
               }}
            />
         )}

         {/* Modal Dettaglio Piano di Studio */}
         {planDetailView && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
                     <div className="flex items-start justify-between">
                        <div className="flex-1">
                           <h2 className="text-2xl font-bold mb-2">{planDetailView.name}</h2>
                           <div className="flex items-center gap-3 text-sm">
                              <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
                                 {planDetailView.category}
                              </span>
                              {planDetailView.subcategory && (
                                 <span className="bg-white/10 px-3 py-1 rounded-full">
                                    {planDetailView.subcategory}
                                 </span>
                              )}
                           </div>
                        </div>
                        <button
                           onClick={() => setPlanDetailView(null)}
                           className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                           title="Chiudi"
                        >
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  <div className="p-6">
                     {/* Prezzo e Descrizione */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {planDetailView.price && (
                           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-green-700 mb-1">
                                 <Euro className="w-5 h-5" />
                                 <span className="text-sm font-medium">Prezzo</span>
                              </div>
                              <p className="text-2xl font-bold text-green-800">
                                 €{planDetailView.price.toFixed(2)}
                              </p>
                           </div>
                        )}
                        {planDetailView.description && (
                           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-gray-700 mb-2">
                                 <Eye className="w-5 h-5" />
                                 <span className="text-sm font-medium">Descrizione</span>
                              </div>
                              <p className="text-sm text-gray-600">{planDetailView.description}</p>
                           </div>
                        )}
                     </div>

                     {/* Statistiche Ore */}
                     <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                           <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                           <p className="text-sm text-gray-600 mb-1">Ore Totali</p>
                           <p className="text-2xl font-bold text-blue-700">{planDetailView.total_hours || 0}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                           <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                           <p className="text-sm text-gray-600 mb-1">Ore Collettive</p>
                           <p className="text-2xl font-bold text-purple-700">{planDetailView.total_collective_hours || 0}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                           <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                           <p className="text-sm text-gray-600 mb-1">Ore Individuali</p>
                           <p className="text-2xl font-bold text-amber-700">{planDetailView.total_individual_hours || 0}</p>
                        </div>
                     </div>

                     {/* Materie */}
                     <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <i className="fas fa-book text-blue-600"></i>
                           Materie del Piano di Studio
                        </h3>
                        {isLoadingDetail ? (
                           <div className="text-center py-8">
                              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-gray-500 mt-2">Caricamento materie...</p>
                           </div>
                        ) : planDetailSubjects.length > 0 ? (
                           <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <table className="w-full">
                                 <thead className="bg-gray-50">
                                    <tr>
                                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Materia</th>
                                       <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                                       <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ore</th>
                                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Docente</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200">
                                    {planDetailSubjects.map((subject, idx) => (
                                       <tr key={subject.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{subject.subject_name}</td>
                                          <td className="px-4 py-3 text-center">
                                             <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                                subject.subject_type === 'collective'
                                                   ? 'bg-purple-100 text-purple-700'
                                                   : 'bg-amber-100 text-amber-700'
                                             }`}>
                                                {subject.subject_type === 'collective' ? 'Collettiva' : 'Individuale'}
                                             </span>
                                          </td>
                                          <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{subject.total_hours}h</td>
                                          <td className="px-4 py-3 text-sm text-gray-600">{subject.teacher_name || 'Non assegnato'}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        ) : (
                           <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">Nessuna materia associata a questo piano</p>
                           </div>
                        )}
                     </div>

                     {/* Studenti Iscritti */}
                     <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <Users className="w-5 h-5 text-blue-600" />
                           Studenti Iscritti
                        </h3>
                        {(() => {
                           const enrolledStudents = students.filter(s => s.study_plan_id === planDetailView.id);
                           return enrolledStudents.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                 {enrolledStudents.map(student => (
                                    <div key={student.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                          {student.first_name[0]}{student.last_name?.[0] || ''}
                                       </div>
                                       <div className="flex-1">
                                          <p className="text-sm font-semibold text-gray-800">
                                             {student.first_name} {student.last_name}
                                          </p>
                                          {student.email && (
                                             <p className="text-xs text-gray-500">{student.email}</p>
                                          )}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                 <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                 <p className="text-gray-500">Nessuno studente iscritto a questo piano</p>
                              </div>
                           );
                        })()}
                     </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={(e) => { e.stopPropagation(); setPlanDetailView(null); handleEditPlan(planDetailView); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                     >
                        <Pencil className="w-4 h-4" />
                        Modifica Piano
                     </button>
                     <button
                        onClick={() => setPlanDetailView(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                     >
                        Chiudi
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal Conferma Eliminazione */}
         {planToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="w-12 h-12 flex-shrink-0 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                     </div>
                     <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                           SEI SICURO DI ELIMINARE IL CORSO?
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                           Stai per eliminare il piano di studio:
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mb-3">
                           "{planToDelete.name}"
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                           <p className="font-medium mb-1">⚠️ Questa azione eliminerà:</p>
                           <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Il piano di studio dal database</li>
                              <li>Tutte le materie associate</li>
                              <li>Tutte le lezioni generate nel calendario</li>
                           </ul>
                           <p className="font-bold mt-2">Questa operazione è irreversibile!</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                     <button
                        onClick={() => setPlanToDelete(null)}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                     >
                        Annulla
                     </button>
                     <button
                        onClick={() => handleDeletePlan(planToDelete)}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                     >
                        {isDeleting ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Eliminazione...
                           </>
                        ) : (
                           <>
                              <Trash2 className="w-4 h-4" />
                              Elimina Definitivamente
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default DidacticsView;
