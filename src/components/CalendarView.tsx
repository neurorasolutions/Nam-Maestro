import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { EVENTS, TEACHERS_LIST, ROOMS_LIST, COURSES_LIST, MAIN_COURSES, COURSE_SUBJECTS } from '../constants';

// Interface helper specifically for the view state
interface CalendarEvent {
  id: number;
  title: string;
  room: string;
  type: 'lesson' | 'collective' | 'exam';
  time: string; // Format "HH:mm - HH:mm"
  isHybrid?: boolean;
  date: Date;
}

// AI Context Interface to store partial data between prompts
interface AiContext {
  teacher?: string;
  room?: string;
  course?: string;
  date?: Date;
  startHour?: number;
  endHour?: number;
  recurrenceCount?: number; // Persisted count
  isWeekly?: boolean;      // Persisted frequency
}

const PIXELS_PER_HOUR = 60; // 1 hour = 60px height
const START_HOUR = 8; // Calendar starts at 8:00
const END_HOUR = 23; // Calendar ends at 23:00
const SNAP_MINUTES = 15; // Drag snaps to nearest 15 min

const CalendarView: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');

  // Initialize with REAL CURRENT DATE
  const [currentDate, setCurrentDate] = useState(new Date());

  // Events State - Now fetched from Supabase
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch lessons from Supabase on mount
  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .order('lesson_date', { ascending: true });

        if (error) throw error;

        // Transform Supabase data to CalendarEvent format
        const transformed: CalendarEvent[] = (data || []).map((lesson: any) => ({
          id: lesson.id,
          title: `${lesson.title} - ${lesson.teacher_name || 'TBD'}`,
          room: lesson.room || 'TBD',
          type: 'lesson' as const,
          time: `${lesson.start_time?.slice(0, 5) || '10:00'} - ${lesson.end_time?.slice(0, 5) || '11:00'}`,
          date: new Date(lesson.lesson_date + 'T12:00:00'), // Add noon to avoid timezone shift
          isHybrid: lesson.is_hybrid || false,
          // Extra fields for Supabase sync
          supabaseId: lesson.id,
          courseName: lesson.course_name
        }));

        setEvents(transformed);
      } catch (err) {
        console.error('Errore caricamento lezioni:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // Edit / Drag State
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);

  // Form State
  const [formMainCourse, setFormMainCourse] = useState('');      // Corso Principale
  const [formSubject, setFormSubject] = useState('');            // Materia
  const [formCourse, setFormCourse] = useState('');              // Legacy (kept for compatibility)
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formData, setFormData] = useState('');
  const [formStart, setFormStart] = useState('10:00');
  const [formEnd, setFormEnd] = useState('11:00');

  // Search filters for dropdowns
  const [mainCourseSearch, setMainCourseSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Dropdown open/close states
  const [isMainCourseOpen, setIsMainCourseOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);

  // Computed: available subjects based on selected main course
  const availableSubjects = formMainCourse ? (COURSE_SUBJECTS[formMainCourse] || []) : [];

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    setFormData(`${year}-${month}-${day}`);
  }, [currentDate]);

  // Dropdown States
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Modals & AI
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTab, setManualTab] = useState<'single' | 'course' | 'carnet' | 'recovery'>('single');

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [aiResult, setAiResult] = useState<{ status: 'success' | 'warning' | 'action_required', message: string, details?: string, missingField?: string } | null>(null);

  const [proposedEvents, setProposedEvents] = useState<CalendarEvent[]>([]);

  // --- SESSION MEMORY (STATE MANAGEMENT) ---
  const [aiContext, setAiContext] = useState<AiContext>({}); // pendingRequestState
  const [isWaitingForInput, setIsWaitingForInput] = useState(false); // Flag for Q&A flow

  // --- CLICK OUTSIDE HANDLERS ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) setIsTeacherDropdownOpen(false);
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target as Node)) setIsRoomDropdownOpen(false);
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) setIsCourseDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- DRAG AND DROP HANDLERS (Omitted details for brevity, assumed standard) ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedEventId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id.toString());
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedEventId === null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hoursFromStart = offsetY / PIXELS_PER_HOUR;
    let totalMinutesFromStart = Math.round((hoursFromStart * 60) / SNAP_MINUTES) * SNAP_MINUTES;
    const newStartTotalMinutes = (START_HOUR * 60) + totalMinutesFromStart;
    const newStartHour = Math.floor(newStartTotalMinutes / 60);
    const newStartMin = Math.floor(newStartTotalMinutes % 60);
    const draggedEvent = events.find(ev => ev.id === draggedEventId);
    if (!draggedEvent) return;
    const [oldStartH, oldStartM] = draggedEvent.time.split('-')[0].trim().split(':').map(Number);
    const [oldEndH, oldEndM] = draggedEvent.time.split('-')[1].trim().split(':').map(Number);
    const durationMinutes = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);
    const newEndTotalMinutes = newStartTotalMinutes + durationMinutes;
    const newEndHour = Math.floor(newEndTotalMinutes / 60);
    const newEndMin = Math.floor(newEndTotalMinutes % 60);
    const formatTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const newTimeStr = `${formatTime(newStartHour, newStartMin)} - ${formatTime(newEndHour, newEndMin)}`;
    setEvents(prev => prev.map(ev => ev.id === draggedEventId ? { ...ev, date: targetDate, time: newTimeStr } : ev));
    setDraggedEventId(null);
  };

  // --- HELPERS (Date/Time) ---
  const parseDateFromText = (text: string): Date | undefined => {
    const lower = text.toLowerCase();
    const today = new Date();
    const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    const dateRegex = /(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/;
    const match = lower.match(dateRegex);
    if (match) {
      const day = parseInt(match[1]);
      const monthIndex = months.indexOf(match[2]);
      let year = today.getFullYear();
      const tempDate = new Date(year, monthIndex, day);
      if (tempDate < today && (today.getTime() - tempDate.getTime() > 86400000)) year++;
      return new Date(year, monthIndex, day);
    }
    const slashMatch = lower.match(/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1]);
      const month = parseInt(slashMatch[2]) - 1;
      let year = today.getFullYear();
      const tempDate = new Date(year, month, day);
      if (tempDate < today && (today.getTime() - tempDate.getTime() > 86400000)) year++;
      return new Date(year, month, day);
    }
    const days = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    const simpleDays = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    for (let i = 0; i < 7; i++) {
      if (lower.includes(days[i]) || lower.includes(simpleDays[i])) {
        const currentDay = today.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7;
        const d = new Date(today);
        d.setDate(today.getDate() + diff);
        return d;
      }
    }
    if (lower.includes('domani')) { const d = new Date(today); d.setDate(today.getDate() + 1); return d; }
    if (lower.includes('oggi')) return today;
    return undefined;
  };

  const parseTimeFromText = (text: string): { start?: number, end?: number } => {
    const lower = text.toLowerCase();
    const rangeRegex = /(?:dalle|ore)?\s*(\d{1,2})(?::00)?\s*(?:alle|-|a)\s*(\d{1,2})(?::00)?/;
    const matchRange = lower.match(rangeRegex);
    if (matchRange) return { start: parseInt(matchRange[1]), end: parseInt(matchRange[2]) };
    const singleRegex = /(?:ore|alle|at)\s*(\d{1,2})(?::00)?/;
    const matchSingle = lower.match(singleRegex);
    if (matchSingle) return { start: parseInt(matchSingle[1]) };
    return {};
  };

  // --- CORE AI LOGIC (STATE MACHINE IMPLEMENTED) ---
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setProposedEvents([]);

    setTimeout(() => {
      const lowerPrompt = aiPrompt.toLowerCase();

      // LOGICA STATO:
      // Se sto aspettando input, parto dal contesto precedente (Memory).
      // Se è un comando nuovo, parto da zero.
      let newContext: AiContext = isWaitingForInput ? { ...aiContext } : {};

      // --- STEP 1: TITLE/COURSE ---
      // Try Regex match
      const titleRegex = /(?:corso|lezioni|lezione|materia)\s+(?:di\s+)?([a-z0-9\s\.]+?)(?=\s+(?:con|in|il|alle|ogni|presso|da)|$)/i;
      const titleMatch = lowerPrompt.match(titleRegex);
      if (titleMatch && titleMatch[1]) {
        const rawTitle = titleMatch[1].trim();
        newContext.course = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      } else if (!newContext.course) {
        // Fallback: If answering "Docente o Corso" question directly
        if (isWaitingForInput && aiResult?.missingField === 'Docente o Corso' && !lowerPrompt.match(/\d/)) {
          // Assume the entire prompt is the course name if it's short
          if (lowerPrompt.length < 30) newContext.course = aiPrompt;
        }
        // Try fuzzy list
        const listMatch = COURSES_LIST.find(c => lowerPrompt.includes(c.toLowerCase()));
        if (listMatch) newContext.course = listMatch;
      }

      // --- STEP 2: TEACHER ---
      if (!newContext.teacher || lowerPrompt.includes("con ")) {
        const tokenMatch = TEACHERS_LIST.find(t => {
          const parts = t.toLowerCase().split(' ');
          return parts.every(p => lowerPrompt.includes(p));
        });
        if (tokenMatch) newContext.teacher = tokenMatch;
        else {
          const surnameMatch = TEACHERS_LIST.find(t => {
            const surname = t.toLowerCase().split(' ')[0];
            return surname.length > 2 && lowerPrompt.includes(surname);
          });
          if (surnameMatch && lowerPrompt.includes(surnameMatch.split(' ')[0].toLowerCase())) {
            newContext.teacher = surnameMatch;
          }
        }
      }

      // --- STEP 3: ROOM (FUZZY MATCH & Q&A SUPPORT) ---
      const explicitRoomMention = lowerPrompt.includes("aula") || lowerPrompt.includes("studio");
      // If we are waiting specifically for Room, treat input as potential room
      const waitingForRoom = isWaitingForInput && aiResult?.missingField?.includes('Aula');

      if (!newContext.room || explicitRoomMention || waitingForRoom) {
        const exactMatch = ROOMS_LIST.sort((a, b) => b.length - a.length)
          .find(r => lowerPrompt.includes(r.toLowerCase()));
        if (exactMatch) {
          newContext.room = exactMatch;
        } else {
          // Fuzzy Token Match
          let bestRoom = null;
          let maxScore = 0;
          ROOMS_LIST.forEach(room => {
            const roomTokens = room.toLowerCase().replace(/[\(\)]/g, '').split(' ');
            let score = 0;
            roomTokens.forEach(token => {
              if (token.length < 3 && roomTokens.length > 1) return;
              if (lowerPrompt.includes(token)) score++;
            });
            if (score > maxScore) { maxScore = score; bestRoom = room; }
          });

          if (bestRoom && maxScore > 0) {
            newContext.room = bestRoom;
          } else if (waitingForRoom) {
            // If user just typed "Digital" but fuzzy failed slightly (unlikely), or typed "la prima",
            // we might be strict here. But let's assume if they typed something while waiting for Room, we retry fuzzy or exact.
          }
        }
      }

      // --- STEP 4: DATE & TIME ---
      const pDate = parseDateFromText(lowerPrompt);
      if (pDate) newContext.date = pDate;

      const pTime = parseTimeFromText(lowerPrompt);
      if (pTime.start) {
        newContext.startHour = pTime.start;
        newContext.endHour = pTime.end || (pTime.start + 1);
      }

      // --- STEP 5: RECURRENCE ---
      const countMatch = lowerPrompt.match(/(\d+)\s+(?:lezioni|incontri|volte|appuntamenti)/);
      if (countMatch) {
        newContext.recurrenceCount = parseInt(countMatch[1]);
      }
      if (lowerPrompt.includes("settimana") || lowerPrompt.includes("tutti i") || lowerPrompt.includes("ogni")) {
        newContext.isWeekly = true;
      }

      // UPDATE STATE WITH MERGED DATA
      setAiContext(newContext);

      // --- MISSING INFO CHECK ---
      const missing: string[] = [];
      if (!newContext.teacher && !newContext.course) missing.push('Docente o Corso');
      if (!newContext.date) missing.push('Data Inizio');
      if (!newContext.startHour) missing.push('Orario');
      if (!newContext.room) missing.push('Aula');

      if (missing.length > 0) {
        setAiLoading(false);
        // ENABLE WAITING MODE
        setIsWaitingForInput(true);

        setAiResult({
          status: 'action_required',
          message: "Mancano dati per procedere",
          details: `Specifica: ${missing.join(', ')}`,
          missingField: missing[0] // Useful for smart parsing next turn
        });
        setAiPrompt('');
        return;
      }

      // --- ALL DATA PRESENT -> DISABLE WAITING MODE ---
      setIsWaitingForInput(false);

      // --- GENERATION LOOP ---
      const generatedEvents: CalendarEvent[] = [];
      const iterations = newContext.recurrenceCount || 1;
      const finalTeacher = newContext.teacher || "N/D";
      const finalCourse = newContext.course || "Lezione";
      const finalRoom = newContext.room!;
      const durationHours = (newContext.endHour! - newContext.startHour!) || 1;
      const durationMinutes = durationHours * 60;

      let warnings = 0;
      let conflictDetails = "";

      const getMinutes = (timeStr: string) => {
        const [h, m] = timeStr.trim().split(':').map(Number);
        return h * 60 + m;
      };

      for (let i = 0; i < iterations; i++) {
        const targetDate = new Date(newContext.date!);
        if (newContext.isWeekly) {
          targetDate.setDate(targetDate.getDate() + (i * 7));
        }

        const checkConflict = (d: Date, startH: number): CalendarEvent | undefined => {
          const newStartMin = startH * 60;
          const newEndMin = newStartMin + durationMinutes;

          return events.find(ev => {
            const isSameDay = ev.date.getDate() === d.getDate() &&
              ev.date.getMonth() === d.getMonth() &&
              ev.date.getFullYear() === d.getFullYear();
            if (!isSameDay) return false;

            const sameRoom = ev.room.toLowerCase() === finalRoom.toLowerCase();
            const sameTeacher = ev.title.toLowerCase().includes(finalTeacher.toLowerCase());
            if (!sameRoom && !sameTeacher) return false;

            const [startStr, endStr] = ev.time.split('-');
            const evStartMin = getMinutes(startStr);
            const evEndMin = getMinutes(endStr);
            return (newStartMin < evEndMin) && (newEndMin > evStartMin);
          });
        };

        let finalStartHour = newContext.startHour!;
        let conflictingEvent = checkConflict(targetDate, finalStartHour);

        if (conflictingEvent) {
          warnings++;
          const offsets = [1, -1, 2, -2];
          let resolved = false;
          for (const off of offsets) {
            const testStart = newContext.startHour! + off;
            if (testStart >= START_HOUR && (testStart + durationHours) <= END_HOUR) {
              if (!checkConflict(targetDate, testStart)) {
                finalStartHour = testStart;
                resolved = true;
                conflictDetails = `Spostato per conflitto con: ${conflictingEvent.title}`;
                break;
              }
            }
          }
          if (!resolved) conflictDetails = `Conflitto irrisolto con: ${conflictingEvent.title}`;
        }

        const formatTime = (h: number) => `${h.toString().padStart(2, '0')}:00`;
        generatedEvents.push({
          id: Date.now() + i,
          title: `${finalCourse} - ${finalTeacher}`,
          room: finalRoom,
          type: 'lesson',
          time: `${formatTime(finalStartHour)} - ${formatTime(finalStartHour + durationHours)}`,
          date: targetDate,
          isHybrid: false
        });
      }

      setProposedEvents(generatedEvents);
      setAiLoading(false);
      setAiPrompt('');

      if (warnings > 0) {
        setAiResult({
          status: 'warning',
          message: `⚠️ Generati ${iterations} slot con ${warnings} modifiche`,
          details: conflictDetails || "Adattati orari per evitare sovrapposizioni."
        });
      } else {
        setAiResult({
          status: 'success',
          message: `✅ Generati ${iterations} eventi`,
          details: `Programmati dal ${generatedEvents[0].date.toLocaleDateString()} al ${generatedEvents[generatedEvents.length - 1].date.toLocaleDateString()}`
        });
      }

    }, 800);
  };

  const confirmAiInsertion = () => {
    if (proposedEvents.length > 0) {
      setEvents(prev => [...prev, ...proposedEvents]);
      setCurrentDate(proposedEvents[0].date);
      setProposedEvents([]);
      setAiResult(null);
      setAiContext({});
      setIsWaitingForInput(false); // Reset state
      setShowAiModal(false);
      setAiPrompt('');
    }
  };

  const resetAi = () => {
    setAiResult(null);
    setProposedEvents([]);
    setAiContext({});
    setIsWaitingForInput(false); // Explicit reset
    setAiPrompt('');
  };

  // --- STANDARD RENDER LOGIC (Unchanged) ---
  const handleEventDoubleClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    const parts = event.title.split(' - ');
    const course = parts[0] || '';
    const teacher = parts.length > 1 ? parts[1] : '';
    const [start, end] = event.time.split('-').map(t => t.trim());
    setFormCourse(course);
    setFormTeacher(teacher);
    setFormRoom(event.room);
    const year = event.date.getFullYear();
    const month = (event.date.getMonth() + 1).toString().padStart(2, '0');
    const day = event.date.getDate().toString().padStart(2, '0');
    setFormData(`${year}-${month}-${day}`);
    setFormStart(start);
    setFormEnd(end);
    setShowManualModal(true);
  };
  // ... (Rest of component methods like saveManual, delete, etc. assumed preserved) ...
  const handleSaveManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate new required fields
    if (!formMainCourse || !formSubject || !formTeacher || !formRoom) {
      alert("Compila tutti i campi obbligatori (Corso, Materia, Docente, Aula)");
      return;
    }

    const [year, month, day] = formData.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    const lessonDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Prepare payload for Supabase
    const supabasePayload = {
      title: formSubject,                  // La materia (es. "Informatica AU")
      course_name: formMainCourse,         // Il corso principale (es. "Fonico Anno Unico") - usato per filtrare nella PWA
      teacher_name: formTeacher,
      room: formRoom,
      lesson_date: lessonDateStr,
      start_time: formStart,
      end_time: formEnd,
      is_hybrid: false
    };

    try {
      if (editingEventId) {
        // UPDATE existing lesson
        const { error } = await supabase
          .from('lessons')
          .update(supabasePayload)
          .eq('id', editingEventId);

        if (error) throw error;

        // Update local state
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
          ...ev,
          title: `${formSubject} - ${formTeacher}`,
          room: formRoom,
          time: `${formStart} - ${formEnd}`,
          date: eventDate
        } : ev));
      } else {
        // INSERT new lesson
        const { data, error } = await supabase
          .from('lessons')
          .insert([supabasePayload])
          .select()
          .single();

        if (error) throw error;

        // Add to local state with Supabase ID
        const newEvent: CalendarEvent = {
          id: data.id,
          title: `${formSubject} - ${formTeacher}`,
          room: formRoom,
          type: 'lesson',
          time: `${formStart} - ${formEnd}`,
          date: eventDate,
          isHybrid: false
        };
        setEvents(prev => [...prev, newEvent]);
        setCurrentDate(eventDate);
      }

      setShowManualModal(false);
      setEditingEventId(null);
      // Reset form fields
      setFormMainCourse('');
      setFormSubject('');
      setFormCourse('');
      setFormTeacher('');
      setMainCourseSearch('');
      setSubjectSearch('');
      setTeacherSearch('');
    } catch (err: any) {
      console.error('Errore salvataggio:', err);
      alert('Errore salvataggio: ' + err.message);
    }
  };

  const handleDeleteEvent = () => {
    if (editingEventId) {
      if (confirm("Sei sicuro di voler eliminare questa lezione? L'azione è irreversibile.")) {
        setEvents(prev => prev.filter(e => e.id !== editingEventId));
        closeManualModal();
      }
    }
  };

  const closeManualModal = () => { setShowManualModal(false); setEditingEventId(null); setFormCourse(''); setFormTeacher(''); setFormRoom(''); };
  const handleTeacherSelect = (teacher: string) => { setSelectedTeacher(teacher); setIsTeacherDropdownOpen(false); setSelectedRoom(null); setSelectedCourse(null); };
  const handleRoomSelect = (room: string) => { setSelectedRoom(room); setIsRoomDropdownOpen(false); setSelectedTeacher(null); setSelectedCourse(null); };
  const handleCourseSelect = (course: string) => { setSelectedCourse(course); setIsCourseDropdownOpen(false); setSelectedTeacher(null); setSelectedRoom(null); };
  const clearFilters = () => { setSelectedTeacher(null); setSelectedRoom(null); setSelectedCourse(null); };
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };
  const handleToday = () => setCurrentDate(new Date());
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const getPeriodLabel = () => {
    const itLocale = 'it-IT';
    if (viewType === 'month') return capitalize(currentDate.toLocaleDateString(itLocale, { month: 'long', year: 'numeric' }));
    if (viewType === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(currentDate); startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `Settimana (${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${capitalize(endOfWeek.toLocaleDateString(itLocale, { month: 'short' }))} ${endOfWeek.getFullYear()})`;
    }
    return capitalize(currentDate.toLocaleDateString(itLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  };
  const getEventStyle = (timeStr: string) => {
    const [start, end] = timeStr.split('-').map(t => t.trim());
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutesTotal = (startH * 60) + startM;
    const endMinutesTotal = (endH * 60) + endM;
    const calendarStartMinutes = START_HOUR * 60;
    const topMinutes = startMinutesTotal - calendarStartMinutes;
    const durationMinutes = endMinutesTotal - startMinutesTotal;
    const topPx = (topMinutes / 60) * PIXELS_PER_HOUR;
    const heightPx = (durationMinutes / 60) * PIXELS_PER_HOUR;
    return { top: `${topPx}px`, height: `${heightPx}px` };
  };

  // Render Methods (Month, Week, Day) - Kept mostly identical but utilizing 'events' state
  const renderMonthView = () => {
    const daysHeader = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startingDay = firstDayOfMonth.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
    const totalSlots = [...Array(startingDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (totalSlots.length % 7 !== 0) totalSlots.push(null);
    return (
      <div className="flex flex-col h-full bg-white rounded shadow-sm border border-gray-300">
        <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-50">
          {daysHeader.map(d => <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase border-r border-gray-200 last:border-0">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {totalSlots.map((day, idx) => {
            const dateObj = day ? new Date(year, month, day) : null;
            const dateStr = dateObj ? dateObj.toDateString() : '';
            const dayEvents = day ? events.filter(e => e.date.toDateString() === dateStr) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={idx} className={`border-r border-b border-gray-200 p-2 relative hover:bg-gray-50 transition-colors min-h-[80px] ${!day ? 'bg-gray-50/30' : ''}`}
                onDragOver={day ? handleDragOver : undefined}
                onDrop={(e) => { if (day && dateObj && draggedEventId) { setEvents(prev => prev.map(ev => ev.id === draggedEventId ? { ...ev, date: dateObj } : ev)); setDraggedEventId(null); } }}>
                {day && (
                  <>
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-nam-blue text-white' : 'text-gray-700'}`}>{day}</span>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} draggable onDragStart={(evt) => handleDragStart(evt, e.id)} onDoubleClick={(evt) => handleEventDoubleClick(evt, e)} className={`h-2 px-1 rounded-sm text-[8px] leading-none text-white truncate cursor-move hover:scale-105 transition-transform ${e.type === 'lesson' ? 'bg-nam-yellow' : e.type === 'collective' ? 'bg-nam-blue' : 'bg-nam-red'}`} title={e.title}>{e.title}</div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[9px] text-gray-400 font-bold pl-1">+{dayEvents.length - 3} altri</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const currentDay = currentDate.getDay();
    const diff = currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(currentDate); monday.setDate(diff);
    const weekDates = Array.from({ length: 6 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return { dayName: d.toLocaleDateString('it-IT', { weekday: 'short' }), dayNum: d.getDate(), fullDate: d }; });
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    return (
      <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col">
        {/* Header con giorni - 7 colonne: 1 orario + 6 giorni */}
        <div className="grid grid-cols-[64px_repeat(6,1fr)] border-b border-gray-300 bg-gray-50 text-center text-sm font-bold text-gray-600 sticky top-0 z-20 shadow-sm">
          <div className="py-3 border-r border-gray-300 bg-gray-50 flex items-center justify-center">Orario</div>
          {weekDates.map((d, i) => {
            const isToday = d.fullDate.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`py-3 border-r border-gray-300 last:border-r-0 ${isToday ? 'bg-blue-50 text-nam-blue' : 'bg-gray-50'}`}>
                {capitalize(d.dayName)} {d.dayNum}
              </div>
            );
          })}
        </div>

        {/* Griglia ore - stessa struttura dell'header */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[64px_repeat(6,1fr)]">
            {/* Colonna orari */}
            <div className="border-r border-gray-300 bg-white">
              {hours.map((h, idx) => (
                <div
                  key={h}
                  className="border-b border-gray-200 text-xs text-gray-400 font-mono text-right pr-2 flex items-center justify-end"
                  style={{ height: `${PIXELS_PER_HOUR}px` }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Colonne giorni */}
            {weekDates.map((d, dayIndex) => {
              const dayEvents = events.filter(e => {
                const sameDay = e.date.getDate() === d.fullDate.getDate() &&
                  e.date.getMonth() === d.fullDate.getMonth() &&
                  e.date.getFullYear() === d.fullDate.getFullYear();
                if (!sameDay) return false;
                if (selectedTeacher && !e.title.includes(selectedTeacher)) return false;
                if (selectedRoom && e.room !== selectedRoom) return false;
                if (selectedCourse && !e.title.includes(selectedCourse)) return false;
                return true;
              });

              return (
                <div
                  key={dayIndex}
                  className="border-r border-gray-300 last:border-r-0 relative bg-white"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, d.fullDate)}
                  style={{ minHeight: `${hours.length * PIXELS_PER_HOUR}px` }}
                >
                  {/* Righe orarie di sfondo - linee orizzontali visibili */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="border-b border-gray-300 absolute w-full"
                      style={{ top: `${(h - START_HOUR) * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
                    />
                  ))}

                  {/* Eventi */}
                  {dayEvents.map(ev => {
                    const style = getEventStyle(ev.time);
                    return (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(evt) => handleDragStart(evt, ev.id)}
                        onDoubleClick={(evt) => handleEventDoubleClick(evt, ev)}
                        className={`absolute left-0.5 right-0.5 rounded shadow-md p-2 text-xs text-white cursor-move hover:brightness-110 hover:z-20 transition-all overflow-hidden ${ev.type === 'lesson' ? 'bg-nam-yellow/90 border-l-4 border-yellow-600' :
                          ev.type === 'collective' ? 'bg-nam-blue/90 border-l-4 border-blue-600' :
                            'bg-nam-red/90 border-l-4 border-red-600'
                          } ${draggedEventId === ev.id ? 'opacity-40' : 'z-10'}`}
                        style={style}
                      >
                        <div className="font-bold truncate">{ev.title}</div>
                        <div className="flex justify-between mt-1 text-[10px] opacity-90">
                          <span>{ev.time}</span>
                          {ev.isHybrid && <i className="fas fa-video"></i>}
                        </div>
                        <div className="mt-1 opacity-80 truncate">{ev.room}</div>
                      </div>
                    );
                  })}

                  {/* Linea ora corrente */}
                  {d.fullDate.toDateString() === new Date().toDateString() && (
                    <div
                      className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none"
                      style={{ top: `${((new Date().getHours() - START_HOUR) + (new Date().getMinutes() / 60)) * PIXELS_PER_HOUR}px` }}
                    >
                      <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const label = capitalize(currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
    const dayEvents = events.filter(e => { const sameDay = e.date.getDate() === currentDate.getDate() && e.date.getMonth() === currentDate.getMonth() && e.date.getFullYear() === currentDate.getFullYear(); if (!sameDay) return false; if (selectedTeacher && !e.title.includes(selectedTeacher)) return false; if (selectedRoom && e.room !== selectedRoom) return false; if (selectedCourse && !e.title.includes(selectedCourse)) return false; return true; });
    return (
      <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-1 border-b border-gray-300 bg-gray-50 text-center text-sm font-bold text-gray-600 sticky top-0 z-20 py-3 shadow-sm">{label}</div>
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="flex relative" style={{ height: `${hours.length * PIXELS_PER_HOUR}px` }}>
            <div className="w-16 flex-shrink-0 border-r border-gray-300 bg-white z-10">{hours.map(h => (<div key={h} className="border-b border-gray-300 text-sm text-gray-400 font-mono text-right pr-2 pt-1 relative" style={{ height: `${PIXELS_PER_HOUR}px` }}><span className="-top-3 relative">{h}:00</span></div>))}</div>
            <div className="flex-1 relative bg-white" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, currentDate)}>
              {hours.map(h => (<div key={h} className="border-b border-gray-300 w-full absolute pointer-events-none" style={{ top: `${(h - START_HOUR) * PIXELS_PER_HOUR}px`, height: '1px' }}></div>))}
              {dayEvents.map(ev => { const style = getEventStyle(ev.time); return (<div key={ev.id} draggable onDragStart={(evt) => handleDragStart(evt, ev.id)} onDoubleClick={(evt) => handleEventDoubleClick(evt, ev)} className={`absolute left-2 right-4 rounded shadow-lg p-4 text-white cursor-move hover:brightness-105 transition-all ${ev.type === 'lesson' ? 'bg-nam-yellow border-l-8 border-yellow-700' : ev.type === 'collective' ? 'bg-nam-blue border-l-8 border-blue-800' : 'bg-nam-red border-l-8 border-red-800'} ${draggedEventId === ev.id ? 'opacity-40' : 'z-10'}`} style={style}><div className="font-bold text-lg">{ev.title}</div><div className="flex items-center space-x-4 mt-2 text-sm opacity-90"><span><i className="far fa-clock mr-1"></i>{ev.time}</span><span><i className="fas fa-map-marker-alt mr-1"></i>{ev.room}</span></div></div>); })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <h2 className="text-2xl font-bold text-gray-700 capitalize w-[450px] truncate">{getPeriodLabel()}</h2>
            <div className="flex items-center bg-white border border-gray-300 rounded shadow-sm">
              <button onClick={handlePrev} className="px-3 py-1.5 hover:bg-gray-100 border-r border-gray-300 text-gray-600 font-bold text-lg active:scale-75 active:bg-gray-200 transition-all duration-150">◀</button>
              <button onClick={handleToday} className="px-4 py-1.5 hover:bg-gray-100 font-semibold text-sm text-gray-700 capitalize min-w-[90px] active:bg-blue-100 transition-colors">{viewType === 'month' ? 'Mese' : viewType === 'week' ? 'Settimana' : 'Giorno'}</button>
              <button onClick={handleNext} className="px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300 text-gray-600 font-bold text-lg active:scale-75 active:bg-gray-200 transition-all duration-150">▶</button>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => { setShowManualModal(true); setEditingEventId(null); setFormCourse(''); }} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded shadow-sm hover:bg-gray-300 text-xs font-bold border border-gray-300 uppercase tracking-wide"><i className="fas fa-plus mr-2"></i>Manuale</button>
            <button onClick={() => setShowAiModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded shadow-md hover:from-purple-700 hover:to-indigo-700 text-xs font-bold flex items-center uppercase tracking-wide"><i className="fas fa-magic mr-2"></i> AI Scheduler</button>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-3">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            {['month', 'week', 'day'].map(v => (
              <button key={v} onClick={() => setViewType(v as any)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${viewType === v ? 'bg-white shadow text-nam-dark' : 'text-gray-500 hover:text-gray-700'}`}>{v === 'month' ? 'Mese' : v === 'week' ? 'Settimana' : 'Giorno'}</button>
            ))}
          </div>
          <div className="relative">
            <input type="text" placeholder="Cerca evento..." className="border border-gray-300 px-3 py-1.5 text-sm rounded focus:outline-none focus:border-nam-blue w-56 shadow-sm" />
            <i className="fas fa-search absolute right-3 top-2 text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-4 flex space-x-2 z-20 relative">
        <div className="relative" ref={teacherDropdownRef}>
          <button onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)} className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ${selectedTeacher ? 'bg-nam-green text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>{selectedTeacher ? selectedTeacher : "Docenti"} <i className={`fas ${selectedTeacher ? 'fa-times' : 'fa-chevron-down'} ml-2 text-[10px]`}></i></button>
          {isTeacherDropdownOpen && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-80 overflow-y-auto z-50">{TEACHERS_LIST.map((t, i) => <div key={i} onClick={() => handleTeacherSelect(t)} className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">{t}</div>)}</div>}
        </div>
        <div className="relative" ref={roomDropdownRef}>
          <button onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)} className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ${selectedRoom ? 'bg-nam-green text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>{selectedRoom ? selectedRoom : "Aule"} <i className={`fas ${selectedRoom ? 'fa-times' : 'fa-chevron-down'} ml-2 text-[10px]`}></i></button>
          {isRoomDropdownOpen && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-80 overflow-y-auto z-50">{ROOMS_LIST.map((r, i) => <div key={i} onClick={() => handleRoomSelect(r)} className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">{r}</div>)}</div>}
        </div>
        <div className="relative" ref={courseDropdownRef}>
          <button onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)} className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ${selectedCourse ? 'bg-nam-green text-white' : 'bg-white text-gray-600 border border-gray-300'}`}><span className="truncate max-w-[100px]">{selectedCourse ? selectedCourse : "Corsi"}</span> <i className={`fas ${selectedCourse ? 'fa-times' : 'fa-chevron-down'} ml-2 text-[10px]`}></i></button>
          {isCourseDropdownOpen && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-80 overflow-y-auto z-50">{COURSES_LIST.map((c, i) => <div key={i} onClick={() => handleCourseSelect(c)} className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">{c}</div>)}</div>}
        </div>
        {(selectedTeacher || selectedRoom || selectedCourse) && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline px-2">Reset Filtri</button>}
      </div>

      {/* VIEW RENDERER */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>

      {/* --- MANUAL MODAL (EDIT/CREATE) --- */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-700">
                <i className={`fas ${editingEventId ? 'fa-edit' : 'fa-calendar-plus'} mr-2 text-nam-green`}></i>
                {editingEventId ? 'Modifica Evento' : 'Programmazione Manuale'}
              </h3>
              <button onClick={closeManualModal} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            {!editingEventId && (
              <div className="flex border-b border-gray-200">
                {['single', 'course', 'carnet', 'recovery'].map(tab => (
                  <button key={tab} onClick={() => setManualTab(tab as any)} className={`flex-1 py-3 text-sm font-bold text-center border-b-2 capitalize ${manualTab === tab ? 'border-nam-green text-nam-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab === 'single' ? 'Lezione Singola' : tab === 'course' ? 'Corso Intero' : tab}</button>
                ))}
              </div>
            )}
            <div className="p-6">
              <form className="space-y-4" onSubmit={handleSaveManualEvent}>
                {/* ROW 1: Corso Principale + Materia */}
                <div className="grid grid-cols-2 gap-4">
                  {/* CORSO PRINCIPALE */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Corso Principale *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Cerca corso..."
                        value={formMainCourse || mainCourseSearch}
                        onChange={(e) => {
                          setMainCourseSearch(e.target.value);
                          setFormMainCourse('');
                          setIsMainCourseOpen(true);
                        }}
                        onFocus={() => setIsMainCourseOpen(true)}
                        onBlur={() => setTimeout(() => setIsMainCourseOpen(false), 150)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none"
                      />
                      {isMainCourseOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                          {MAIN_COURSES
                            .filter(c => c.toLowerCase().includes((mainCourseSearch || '').toLowerCase()))
                            .map((c, i) => (
                              <div
                                key={i}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormMainCourse(c);
                                  setMainCourseSearch('');
                                  setFormSubject('');
                                  setSubjectSearch('');
                                  setIsMainCourseOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formMainCourse === c ? 'bg-blue-100 font-bold' : ''}`}
                              >
                                {c}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MATERIA */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Materia *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={formMainCourse ? "🔍 Cerca materia..." : "Seleziona prima il corso"}
                        value={formSubject || subjectSearch}
                        onChange={(e) => {
                          setSubjectSearch(e.target.value);
                          setFormSubject('');
                          setIsSubjectOpen(true);
                        }}
                        onFocus={() => formMainCourse && setIsSubjectOpen(true)}
                        onBlur={() => setTimeout(() => setIsSubjectOpen(false), 150)}
                        disabled={!formMainCourse}
                        className={`w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none ${!formMainCourse ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                      {isSubjectOpen && formMainCourse && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                          {availableSubjects
                            .filter(s => s.name.toLowerCase().includes((subjectSearch || '').toLowerCase()))
                            .map((s, i) => (
                              <div
                                key={i}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormSubject(s.name);
                                  setSubjectSearch('');
                                  setIsSubjectOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between ${formSubject === s.name ? 'bg-blue-100 font-bold' : ''}`}
                              >
                                <span>{s.name}</span>
                                <span className="text-gray-400 text-xs">{s.hours}h • {s.type}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW 2: Docente + Aula */}
                <div className="grid grid-cols-2 gap-4">
                  {/* DOCENTE con ricerca */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Docente *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Cerca docente..."
                        value={formTeacher || teacherSearch}
                        onChange={(e) => {
                          setTeacherSearch(e.target.value);
                          setFormTeacher('');
                          setIsTeacherOpen(true);
                        }}
                        onFocus={() => setIsTeacherOpen(true)}
                        onBlur={() => setTimeout(() => setIsTeacherOpen(false), 150)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none"
                      />
                      {isTeacherOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                          {TEACHERS_LIST
                            .filter(t => t.toLowerCase().includes((teacherSearch || '').toLowerCase()))
                            .map((t, i) => (
                              <div
                                key={i}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormTeacher(t);
                                  setTeacherSearch('');
                                  setIsTeacherOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formTeacher === t ? 'bg-blue-100 font-bold' : ''}`}
                              >
                                {t}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AULA */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Aula *</label>
                    <select value={formRoom} onChange={(e) => setFormRoom(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none">
                      <option value="">Seleziona Aula...</option>
                      {ROOMS_LIST.map((r, i) => <option key={i} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* ROW 3: Data + Orari */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Data</label>
                    <input type="date" value={formData} onChange={(e) => setFormData(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Orario Inizio</label>
                    <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Orario Fine</label>
                    <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-nam-blue focus:outline-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  {editingEventId && (
                    <button type="button" onClick={handleDeleteEvent} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded shadow hover:bg-red-700 flex items-center">
                      <i className="fas fa-trash mr-2"></i> Elimina
                    </button>
                  )}
                  <div className="flex space-x-2 ml-auto">
                    <button type="button" onClick={closeManualModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Annulla</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-nam-green rounded shadow hover:bg-green-700">{editingEventId ? 'Aggiorna Evento' : 'Salva'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- AI MODAL --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border-t-4 border-indigo-500 animate-fade-in-up">
            <div className="bg-indigo-50 px-8 py-6 border-b border-indigo-100">
              <h3 className="font-extrabold text-2xl text-indigo-900 flex items-center">
                <i className="fas fa-robot mr-3 text-indigo-600"></i>
                {proposedEvents.length > 0 ? "Risultato Ricerca" : "NAM AI Scheduler"}
              </h3>
              <p className="text-indigo-700 text-sm mt-1 opacity-80">
                {proposedEvents.length > 0 ? "Controlla le proposte generate qui sotto." : "Descrivi cosa vuoi programmare (es: '10 lezioni di basso con Fasoli ogni martedì')"}
              </p>
            </div>
            <div className="p-8">
              {!aiResult || aiResult.status === 'action_required' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {aiResult?.status === 'action_required' ? <span className="text-red-600"><i className="fas fa-comment-dots mr-2"></i>{aiResult.message}</span> : 'Prompt di Programmazione'}
                    </label>
                    <div className="relative">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiGenerate(); } }}
                        placeholder={aiResult?.status === 'action_required' ? `Inserisci solo ${aiResult.missingField?.toLowerCase()}...` : "Es: Corso di informatica, davide pantaleo, aula teoria, 6 gennaio dalle 10 alle 12..."}
                        className={`w-full h-32 p-4 border rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none ${aiResult?.status === 'action_required' ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        autoFocus={aiResult?.status === 'action_required'}
                      ></textarea>
                      {aiResult?.status === 'action_required' && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-white px-2 py-1 rounded shadow text-xs text-gray-500">
                            Dati acquisiti: {aiContext.teacher && <span className="font-bold text-green-600 mr-1">Docente <i className="fas fa-check"></i></span>}
                            {aiContext.date && <span className="font-bold text-green-600 mr-1">Data <i className="fas fa-check"></i></span>}
                            {aiContext.startHour && <span className="font-bold text-green-600">Orario <i className="fas fa-check"></i></span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {aiLoading && <div className="my-6 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div><p className="text-indigo-600 font-medium animate-pulse">Analisi richiesta in corso...</p></div>}
                  <div className="flex justify-end mt-4">
                    <button onClick={() => { setShowAiModal(false); resetAi(); }} className="px-6 py-2 mr-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Annulla</button>
                    <button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || aiLoading} className={`px-6 py-2 rounded-lg text-white font-bold shadow-lg flex items-center ${!aiPrompt.trim() || aiLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>{aiLoading ? 'Generazione...' : <><i className="fas fa-paper-plane mr-2"></i> {aiResult?.status === 'action_required' ? 'Rispondi' : 'Genera Proposta'}</>}</button>
                  </div>
                </>
              ) : (
                <div className="animate-fade-in-up">
                  <div className={`p-4 rounded-lg border-l-4 mb-6 ${aiResult.status === 'success' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-yellow-50 border-yellow-500 text-yellow-900'}`}>
                    <h4 className="font-bold text-lg mb-1 flex items-center">{aiResult.status === 'success' ? <i className="fas fa-check-circle mr-2 text-xl"></i> : <i className="fas fa-exclamation-triangle mr-2 text-xl"></i>}{aiResult.message}</h4>
                    <p className="pl-7 opacity-90">{aiResult.details}</p>
                  </div>

                  {/* Proposed Events Details Card (Multiple) */}
                  {proposedEvents.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 max-h-60 overflow-y-auto">
                      <div className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">
                        Riepilogo ({proposedEvents.length} eventi)
                      </div>
                      {proposedEvents.map((ev, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-700 w-8">{idx + 1}.</span>
                          <span className="text-gray-600 flex-1"><i className="far fa-calendar mr-1"></i>{ev.date.toLocaleDateString()}</span>
                          <span className="text-gray-600 w-24"><i className="far fa-clock mr-1"></i>{ev.time}</span>
                          <span className="text-gray-500 w-32 truncate text-right">{ev.room}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-4">
                    <button onClick={() => { resetAi(); }} className="text-indigo-600 text-sm font-semibold hover:underline">Nuova Ricerca</button>
                    <button onClick={confirmAiInsertion} className="px-4 py-2 bg-nam-green text-white rounded font-bold hover:bg-green-700 shadow-md flex items-center"><i className="fas fa-calendar-plus mr-2"></i>Conferma Tutto</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;