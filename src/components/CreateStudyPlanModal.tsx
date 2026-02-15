import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { StudyPlan, StudyPlanSubject } from '../types';
import { supabase } from '../lib/supabaseClient';
import CalendarWizard from './CalendarWizard';

interface CreateStudyPlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Lista docenti hardcoded
const TEACHERS_LIST = [
  'Alessandro Rossi',
  'Maria Bianchi',
  'Giuseppe Verdi',
  'Laura Neri',
  'Marco Ferrari',
  'Giulia Romano',
  'Francesco Ricci',
  'Chiara Esposito',
  'Davide Marino',
  'Elena Greco',
];

const CATEGORIES = [
  'STRUMENTO',
  'CANTO',
  'MUSICA D\'INSIEME',
  'TEORIA E CULTURA',
  'ALTRO',
];

type WizardStep = 1 | 2 | 3;

interface SubjectForm extends Omit<StudyPlanSubject, 'id' | 'study_plan_id' | 'created_at' | 'updated_at'> {
  tempId: string; // ID temporaneo per gestione UI
}

export default function CreateStudyPlanModal({ onClose, onSuccess }: CreateStudyPlanModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Info Base
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planCategory, setPlanCategory] = useState(CATEGORIES[0]);
  const [planSubcategory, setPlanSubcategory] = useState('');

  // Step 2: Materie
  const [subjects, setSubjects] = useState<SubjectForm[]>([]);

  // Step 3: Calendarizzazione
  const [showCalendarWizard, setShowCalendarWizard] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  // ========== STEP 1 FUNCTIONS ==========

  const validateStep1 = (): boolean => {
    const newErrors: string[] = [];

    if (!planName.trim()) {
      newErrors.push('Il nome del piano di studio è obbligatorio');
    }

    if (!planCategory) {
      newErrors.push('Seleziona una categoria');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ========== STEP 2 FUNCTIONS ==========

  const addSubject = () => {
    const newSubject: SubjectForm = {
      tempId: `temp-${Date.now()}`,
      subject_name: '',
      subject_type: 'collective',
      total_hours: 20,
      teacher_name: TEACHERS_LIST[0],
      order_index: subjects.length,
    };
    setSubjects([...subjects, newSubject]);
  };

  const removeSubject = (tempId: string) => {
    setSubjects(subjects.filter(s => s.tempId !== tempId));
  };

  const updateSubject = (tempId: string, field: keyof SubjectForm, value: any) => {
    setSubjects(subjects.map(s =>
      s.tempId === tempId ? { ...s, [field]: value } : s
    ));
  };

  const validateStep2 = (): boolean => {
    const newErrors: string[] = [];

    if (subjects.length === 0) {
      newErrors.push('Aggiungi almeno una materia al piano di studio');
    }

    subjects.forEach((subject, idx) => {
      if (!subject.subject_name.trim()) {
        newErrors.push(`Materia ${idx + 1}: inserisci un nome`);
      }
      if (subject.total_hours <= 0) {
        newErrors.push(`Materia ${idx + 1}: le ore devono essere maggiori di 0`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ========== STEP 3 FUNCTIONS (Calendarizzazione) ==========

  const handleCalendarComplete = async (schedules: any[], startDate: string, endDate: string) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      // 1. Crea il piano di studio
      const { data: newPlan, error: planError } = await supabase
        .from('study_plans')
        .insert({
          name: planName,
          description: planDescription,
          category: planCategory,
          subcategory: planSubcategory || null,
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // 2. Inserisci le materie
      const subjectsToInsert = subjects.map((subject, idx) => ({
        study_plan_id: newPlan.id,
        subject_name: subject.subject_name,
        subject_type: subject.subject_type,
        total_hours: subject.total_hours,
        teacher_name: subject.teacher_name,
        order_index: idx,
      }));

      const { data: insertedSubjects, error: subjectsError } = await supabase
        .from('study_plan_subjects')
        .insert(subjectsToInsert)
        .select();

      if (subjectsError) throw subjectsError;

      // 3. Genera lezioni ricorrenti
      const lessonsToInsert: any[] = [];

      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        const subject = subjects[i];
        const insertedSubject = insertedSubjects[i];

        const lessons = generateRecurringLessons(
          newPlan.name,
          insertedSubject.subject_name,
          insertedSubject.teacher_name || '',
          insertedSubject.subject_type,
          subject.total_hours,
          schedule.daysOfWeek,
          schedule.startTime,
          schedule.endTime,
          schedule.room,
          startDate,
          endDate
        );

        lessonsToInsert.push(...lessons);
      }

      if (lessonsToInsert.length > 0) {
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;
      }

      // Successo!
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Errore creazione piano:', error);
      setErrors([error.message || 'Errore durante la creazione del piano di studio']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRecurringLessons = (
    courseName: string,
    subjectName: string,
    teacherName: string,
    subjectType: string,
    totalHours: number,
    daysOfWeek: number[],
    startTime: string,
    endTime: string,
    room: string,
    startDateStr: string,
    endDateStr: string
  ): any[] => {
    const lessons: any[] = [];
    const hoursPerLesson = 2; // Default
    const totalLessonsNeeded = Math.ceil(totalHours / hoursPerLesson);

    let currentDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    let lessonsCreated = 0;

    while (lessonsCreated < totalLessonsNeeded && currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (daysOfWeek.includes(dayOfWeek)) {
        const lessonDateStr = currentDate.toISOString().split('T')[0];

        lessons.push({
          course_name: courseName,
          title: subjectName,
          teacher_name: teacherName,
          room: room,
          lesson_date: lessonDateStr,
          start_time: startTime,
          end_time: endTime,
          type: subjectType === 'collective' ? 'collective' : 'lesson',
          status: 'scheduled',
        });

        lessonsCreated++;
      }

      // Avanza di 1 giorno
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return lessons;
  };

  // ========== NAVIGATION ==========

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setErrors([]);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setShowCalendarWizard(true);
      setErrors([]);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
      setErrors([]);
    }
  };

  // ========== RENDER ==========

  if (showCalendarWizard) {
    return (
      <CalendarWizard
        subjects={subjects.map(s => ({
          ...s,
          id: s.tempId,
          study_plan_id: 'temp',
        }))}
        onComplete={handleCalendarComplete}
        onCancel={() => {
          setShowCalendarWizard(false);
          setCurrentStep(2);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Crea Piano di Studio</h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep} di 3
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Errori di validazione</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: Info Base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-lg font-medium">Informazioni di Base</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Piano di Studio *
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="es. Basso Avanzato, Pianoforte Base, ecc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={planCategory}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sottocategoria (opzionale)
                </label>
                <input
                  type="text"
                  value={planSubcategory}
                  onChange={(e) => setPlanSubcategory(e.target.value)}
                  placeholder="es. Livello Avanzato, Biennio, ecc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={4}
                  placeholder="Descrizione del piano di studio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Gestione Materie */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="text-lg font-medium">Gestione Materie</h3>
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Materia
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nessuna materia aggiunta</p>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Aggiungi la prima materia
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subject, idx) => (
                    <div key={subject.tempId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">Materia {idx + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.tempId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Materia
                          </label>
                          <input
                            type="text"
                            value={subject.subject_name}
                            onChange={(e) => updateSubject(subject.tempId, 'subject_name', e.target.value)}
                            placeholder="es. Teoria Musicale, Strumento..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={subject.subject_type}
                            onChange={(e) => updateSubject(subject.tempId, 'subject_type', e.target.value as 'individual' | 'collective')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="collective">Collettivo</option>
                            <option value="individual">Individuale</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ore Totali
                          </label>
                          <input
                            type="number"
                            value={subject.total_hours}
                            onChange={(e) => updateSubject(subject.tempId, 'total_hours', parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Docente
                          </label>
                          <select
                            value={subject.teacher_name}
                            onChange={(e) => updateSubject(subject.tempId, 'teacher_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            {TEACHERS_LIST.map(teacher => (
                              <option key={teacher} value={teacher}>{teacher}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {subjects.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Riepilogo</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Totale Materie:</span>
                      <span className="ml-2 font-medium">{subjects.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ore Totali:</span>
                      <span className="ml-2 font-medium">
                        {subjects.reduce((sum, s) => sum + s.total_hours, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Individuali/Collettive:</span>
                      <span className="ml-2 font-medium">
                        {subjects.filter(s => s.subject_type === 'individual').length} / {subjects.filter(s => s.subject_type === 'collective').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Calendarizzazione */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Calendar className="w-5 h-5" />
                <h3 className="text-lg font-medium">Calendarizzazione</h3>
              </div>

              <div className="text-center py-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Pronto per la Calendarizzazione
                </h4>
                <p className="text-gray-600 mb-4">
                  Configura orari e giorni per generare automaticamente le lezioni del piano "{planName}"
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {subjects.length} materie • {subjects.reduce((sum, s) => sum + s.total_hours, 0)} ore totali
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Indietro
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 3 ? 'Configura Calendario' : 'Avanti'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
