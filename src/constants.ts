import { Lead, Course, Event, Payment, InventoryItem } from './types';

// --- LISTE ESISTENTI (NON TOCCATE) ---

export const TEACHERS_LIST = [
  "Fasoli Daniele", "Fedele Laura", "Ferrara Fabrizio", "Ferri Max", "Fincato Camilla",
  "Flaminio Claudio", "Folli Paola", "Furian Maxx", "Meneghello Luca", "Merlo Simone",
  "Mezza Andrea", "Mezzadra Antonio", "Novali Ermanno", "Nuzzi Federica", "Odone Alberto",
  "Pagani Davide", "Pantaleo Davide", "Paulovich Federico", "Pecchenini Patrick", "Perini Daniele",
  "Pini Beppe", "Pirovano Simone", "Pizzetti Cesare", "Pontini Simone", "Prestigiacomo Davide",
  "Quilichini Pietro", "Raimondo Walter", "Renteria Gabriel", "Renteria Linda Gabriel",
  "Ricci Marco", "Ricci Tullio", "Risola Gianfranco", "Rizzo Cascio Joseph", "Romano Giacomo",
  "Rossi Pacho", "Rozza Simone", "Sabatino Francesca", "Salati Ralph", "Segreto Ivan",
  "Siliotto Francesco", "Slaviero Federico", "Sottilotta Giulia", "Tavoldini Francesco",
  "Tempesta Jenny", "Torella Antonio", "Tosi Riccardo", "Tumiati Stefano"
];

export const ROOMS_LIST = [
  "Canto piano terra",
  "Strumento piano terra",
  "Auditorium",
  "Studio A",
  "Studio B",
  "Aula Digital",
  "Teoria 1",
  "Teoria 2",
  "Strumento Secondo Piano"
];

// --- CORSI PRINCIPALI (per iscrizione studenti) ---
export const MAIN_COURSES = [
  "Fonico Anno Unico",
  // Altri corsi principali da aggiungere...
];

// --- MATERIE PER CORSO PRINCIPALE (con ore totali) ---
export const COURSE_SUBJECTS: Record<string, { name: string; hours: number; type: 'collettivo' | 'individuale' }[]> = {
  "Fonico Anno Unico": [
    { name: "Teoria e Tecnica AU", hours: 34, type: 'collettivo' },
    { name: "Pro Tools AU", hours: 26, type: 'collettivo' },
    { name: "Informatica AU", hours: 24, type: 'collettivo' },
    { name: "Teoria Musicale per Fonici AU", hours: 28, type: 'collettivo' },
    { name: "Pratica Studio AU", hours: 78, type: 'collettivo' },
    { name: "Fisica della Fonotecnica AU", hours: 30, type: 'collettivo' },
    { name: "Rec AU", hours: 15, type: 'collettivo' },
    { name: "Mixaggio AU", hours: 16, type: 'collettivo' },
    { name: "Music Business", hours: 8, type: 'collettivo' },
    { name: "Seminario Mastering", hours: 6, type: 'collettivo' },
    { name: "Seminario Sound Design", hours: 4, type: 'collettivo' },
    { name: "Riunione Preliminare Anno Unico Fonico", hours: 0, type: 'collettivo' },
  ],
};

// --- LISTA CORSI LEGACY (per compatibilità dropdown esistenti) ---
export const COURSES_LIST = [
  "Basso Avanzato Anno 1", "Basso Base Anno 1", "Basso Intermedio Anno 1", "Basso Pro Anno 1",
  "Basso Pro Anno 2", "Basso Pro Anno 3",
  "Batteria Avanzato Anno 1", "Batteria Base Anno 1", "Batteria Intermedio Anno 1",
  "Batteria Maxxima Anno 1", "Batteria Maxxima Anno 2", "Batteria Maxxima Anno 3",
  "Batteria Maxxima Quarto Anno Anno 1", "Batteria Mini Pro Anno 1", "Batteria Mini Pro Anno 2",
  "Batteria Mini Pro Anno 3", "Batteria Pro Anno 1", "Batteria Pro Anno 2",
  "Canto Avanzato Anno 1", "Canto Base Anno 1", "Canto Intermedio Anno 1", "Canto Pro Anno 1",
  "Canto Pro Anno 2", "Canto Pro Anno 3",
  "Chitarra Avanzato Anno 1", "Chitarra Base Anno 1", "Chitarra Intermedio Anno 1",
  "Chitarra Pro Anno 1", "Chitarra Pro Anno 2", "Chitarra Pro Anno 3",
  "DJ Pro Anno 1", "EMP PRO Anno 1",
  "Fonico Anno Unico Anno 1", "Fonico Anno Unico Full Anno 1", "Fonico Biennio Anno 1", "Fonico Biennio Anno 2",
  "GIOVANISSIMI basso Anno 1", "GIOVANISSIMI batteria Anno 1", "GIOVANISSIMI canto Anno 1",
  "GIOVANISSIMI chitarra Anno 1", "GIOVANISSIMI pianoforte Anno 1",
  "Pianoforte Avanzato Anno 1", "Pianoforte Base Anno 1", "Pianoforte Intermedio Anno 1",
  "Pianoforte Pro Anno 1", "Pianoforte Pro Anno 2",
  "Producer & Composer Anno Unico Anno 1", "Producer & Composer Biennio Anno 1", "Producer & Composer Biennio Anno 2",
  "Producer AU Full Anno 1",
  "Sax Base Anno 1", "Sax Intermedio Anno 1",
  "SOUND DESIGN PRO Anno 1",
  "Super Full Anno 1"
];

export const INITIAL_LEADS: Lead[] = [
  { id: 1, name: 'Marco Rossi', interest: 'Basso Elettrico', source: 'Instagram', status: 'contact' },
  { id: 2, name: 'Giulia Bianchi', interest: 'Canto Jazz', source: 'Sito Web', status: 'interview' },
  { id: 3, name: 'Luca Verdi', interest: 'Music Business', source: 'Passaparola', status: 'audition' },
  { id: 4, name: 'Sofia Neri', interest: 'Pianoforte', source: 'Facebook', status: 'enrolled' },
  { id: 5, name: 'Alessandro Gialli', interest: 'Batteria', source: 'Volantino', status: 'followup' },
];

export const COURSES: Course[] = [
  { id: 1, name: 'Teoria e Solfeggio 1 PRO', type: 'Collettivo', teacher: 'Prof. Allevi', day: 'Lunedì' },
  { id: 2, name: 'Laboratorio Chitarristico', type: 'Collettivo', teacher: 'Prof. Satriani', day: 'Martedì' },
  { id: 3, name: 'Music Business', type: 'Collettivo', teacher: 'Dott. Manager', day: 'Mercoledì' },
  { id: 4, name: 'Albero del Canto', type: 'Individuale', teacher: 'M. Callas', day: 'Giovedì' },
  { id: 5, name: 'Canto Pro 1', type: 'Individuale', teacher: 'M. Pavarotti', day: 'Venerdì' },
];

export const EVENTS: Event[] = [
  { id: 1, title: 'Batteria Maxxima Anno 1 - Furian Maxx', room: 'Strumento piano terra', type: 'lesson', time: '10:00 - 11:00' },
  { id: 2, title: 'Canto Pro Anno 1 - Folli Paola', room: 'Canto piano terra', type: 'lesson', time: '11:00 - 12:00', isHybrid: true },
  { id: 3, title: 'Teoria Collettiva', room: 'Auditorium', type: 'collective', time: '14:00 - 16:00' },
  { id: 4, title: 'Music Business', room: 'Teoria 1', type: 'collective', time: '16:00 - 18:00' },
  { id: 5, title: 'Chitarra Pro Anno 1 (Esame)', room: 'Studio A', type: 'exam', time: '18:00 - 19:00' },
];

export const PAYMENTS: Payment[] = [
  { id: 1, student: 'Marco Rossi', amount: 150, dueDate: '2023-11-01', status: 'paid' },
  { id: 2, student: 'Giulia Bianchi', amount: 180, dueDate: '2023-11-05', status: 'overdue' },
  { id: 3, student: 'Luca Verdi', amount: 150, dueDate: '2023-11-15', status: 'pending' },
  { id: 4, student: 'Sofia Neri', amount: 200, dueDate: '2023-11-20', status: 'pending' },
];

export const INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Manuale Armonia Vol. 1', category: 'Libri', stock: 45, royalties: 225.00 },
  { id: 2, name: 'T-shirt NAM Official', category: 'Gadget', stock: 12, royalties: 0 },
  { id: 3, name: 'Metodo Batteria Rock', category: 'Libri', stock: 8, royalties: 40.00 },
  { id: 4, name: 'Quaderno Pentagrammato', category: 'Cancelleria', stock: 100, royalties: 0 },
];


// --- NUOVE LISTE PER SCHEDA ISCRIZIONE STUDENTE ---

export const LISTS = {
  GENDER: ['Maschio', 'Femmina'],

  // Per il menù "Corso di interesse"
  INTEREST_AREAS: [
    "Albero del Canto",
    "Basso",
    "Canto",
    "Chitarra",
    "Coro",
    "Corsi Producer",
    "FUSSI",
    "Mix e Mastering",
    "Musica per Immagini",
    "Pianoforte",
    "Post Produzione Audio",
    "Producer",
    "Sound Design",
    "Batteria",
    "Batteria Maxxima",
    "Corso Giovanissimi",
    "DJ",
    "Fonico",
    "Music Business",
    "Sax"
  ],

  COURSE_TYPES: ['Carnet', 'Corso Base', 'Corso Pro', 'Masterclass'],

  LOCATIONS: ['Centrale', 'Bovisa'],

  OPEN_DAY: ['Prenotato', 'Non Prenotato'],

  ENROLLMENT_STATUS: [
    'Iscritto',
    'Colloquio',
    'Iscrizione',
    'Prenotato',
    'Non interessato/a'
  ],

  // Marketing & Lead Sources (usate per "Come ci hai conosciuto" e "Da dove arriva il contatto")
  LEAD_SOURCES: ['Sito Web', 'Passaparola', 'Social Media', 'Evento', 'Altro'],

  // Come ci hai conosciuto?
  MARKETING_SOURCES: [
    'Passa Parola',
    'Sito',
    'Google',
    'Instagram',
    'Youtube',
    'Facebook',
    'Tik Tok',
    'ADV',
    'Volantini'
  ],

  // Grado di Istruzione
  EDUCATION_LEVELS: [
    'Licenza Media',
    'Diploma Superiore',
    'Laurea Triennale',
    'Laurea Magistrale',
    'Master',
    'Dottorato',
    'Altro'
  ]
};