import React, { useState } from 'react';
import { COURSES_LIST } from '../constants';

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

   // Funzione per formattare i nomi dei corsi in Title Case
   const formatCourseName = (name: string): string => {
      return name
         .toLowerCase()
         .split(' ')
         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
         .join(' ');
   };

   // Vista Piani di Studi - Mostra tutti i corsi
   const PianiStudiView = () => (
      <div className="p-6">
         <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Piani di Studi</h2>
            <p className="text-gray-500 text-sm mt-1">Tutti i corsi attivi della scuola</p>
         </div>

         {/* Filtri */}
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
            <div className="flex-1">
               <input
                  type="text"
                  placeholder="Cerca corso..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
               />
            </div>
            <span className="text-sm text-gray-500">{COURSES_LIST.length} corsi disponibili</span>
         </div>

         {/* Lista Corsi */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COURSES_LIST.map((corso, index) => (
               <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
               >
                  <div className="flex items-start justify-between">
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                           {formatCourseName(corso)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                           Clicca per vedere il piano di studi
                        </p>
                     </div>
                     <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                        <i className="fas fa-book"></i>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );

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