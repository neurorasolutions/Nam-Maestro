import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { StudyPlanSubject } from '../types';

interface SubjectSchedule {
  subjectId: string;
  subjectName: string;
  daysOfWeek: number[]; // 0=Domenica, 1=Lunedì, ..., 6=Sabato
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
}

interface CalendarWizardProps {
  subjects: StudyPlanSubject[];
  onComplete: (schedules: SubjectSchedule[], startDate: string, endDate: string) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
];

const ROOMS = [
  'Auditorium',
  'Aula Canto',
  'Aula Canto e strumento 1° Piano',
  'Aula Digital',
  'Aula Online',
  'Aula Strumento Piano Terra',
  'Aula Teoria 1',
  'Aula Teoria 2',
  'Aula X',
  'Studio A',
  'Studio B',
];

export default function CalendarWizard({ subjects, onComplete, onCancel }: CalendarWizardProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schedules, setSchedules] = useState<SubjectSchedule[]>(
    subjects.map(subject => ({
      subjectId: subject.id || '',
      subjectName: subject.subject_name,
      daysOfWeek: [],
      startTime: '09:00',
      endTime: '11:00',
      room: ROOMS[0],
    }))
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handleDayToggle = (subjectIndex: number, dayValue: number) => {
    const newSchedules = [...schedules];
    const currentDays = newSchedules[subjectIndex].daysOfWeek;

    if (currentDays.includes(dayValue)) {
      newSchedules[subjectIndex].daysOfWeek = currentDays.filter(d => d !== dayValue);
    } else {
      newSchedules[subjectIndex].daysOfWeek = [...currentDays, dayValue].sort();
    }

    setSchedules(newSchedules);
  };

  const handleScheduleChange = (subjectIndex: number, field: keyof SubjectSchedule, value: any) => {
    const newSchedules = [...schedules];
    (newSchedules[subjectIndex] as any)[field] = value;
    setSchedules(newSchedules);
  };

  const validateSchedules = (): boolean => {
    const newErrors: string[] = [];

    // Validazione date
    if (!startDate || !endDate) {
      newErrors.push('Seleziona le date di inizio e fine anno scolastico');
    } else if (new Date(startDate) >= new Date(endDate)) {
      newErrors.push('La data di fine deve essere successiva alla data di inizio');
    }

    // Validazione schedules
    schedules.forEach((schedule, idx) => {
      if (schedule.daysOfWeek.length === 0) {
        newErrors.push(`${schedule.subjectName}: seleziona almeno un giorno della settimana`);
      }
      if (!schedule.startTime || !schedule.endTime) {
        newErrors.push(`${schedule.subjectName}: inserisci orario di inizio e fine`);
      }
      if (schedule.startTime >= schedule.endTime) {
        newErrors.push(`${schedule.subjectName}: l'orario di fine deve essere successivo all'orario di inizio`);
      }
      if (!schedule.room) {
        newErrors.push(`${schedule.subjectName}: seleziona un'aula`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateSchedules()) {
      onComplete(schedules, startDate, endDate);
    }
  };

  const calculateEstimatedLessons = (schedule: SubjectSchedule, subject: StudyPlanSubject): number => {
    if (!startDate || !endDate || schedule.daysOfWeek.length === 0) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const hoursPerLesson = 2; // Default
    const totalLessonsNeeded = Math.ceil(subject.total_hours / hoursPerLesson);

    return totalLessonsNeeded;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Calendarizzazione Automatica</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura orari e giorni per generare automaticamente le lezioni
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date Range */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Anno Scolastico</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inizio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fine
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-1">Errori di validazione</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Subject Schedules */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configurazione Materie</h3>

            {schedules.map((schedule, idx) => {
              const subject = subjects[idx];
              const estimatedLessons = calculateEstimatedLessons(schedule, subject);

              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Subject Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{schedule.subjectName}</h4>
                      <p className="text-sm text-gray-500">
                        {subject.total_hours} ore totali • {subject.subject_type === 'collective' ? 'Collettivo' : 'Individuale'}
                        {subject.teacher_name && ` • ${subject.teacher_name}`}
                      </p>
                    </div>
                    {estimatedLessons > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          ~{estimatedLessons} lezioni
                        </div>
                        <div className="text-xs text-gray-500">
                          (2 ore/lezione)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giorni della settimana
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(idx, day.value)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            schedule.daysOfWeek.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time and Room */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ora Fine
                      </label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Aula
                      </label>
                      <select
                        value={schedule.room}
                        onChange={(e) => handleScheduleChange(idx, 'room', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        {ROOMS.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Genera Lezioni
          </button>
        </div>
      </div>
    </div>
  );
}
