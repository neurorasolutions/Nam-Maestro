import React, { useState } from 'react';
import { View, Role } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import CrmView from './components/CrmView';
import DidacticsView from './components/DidacticsView';
import AdminView from './components/AdminView';
import WarehouseView from './components/WarehouseView';
import StudentsView from './components/StudentsView';
import ReportsView from './components/ReportsView';
// IMPORTANTE: Usiamo il nuovo nome per sbloccare Git
import AuthLogin from './components/AuthLogin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Questo componente gestisce il contenuto: Login o Gestionale?
const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [role, setRole] = useState<Role>('direzione');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Se sta caricando (controlla se c'è sessione), mostra attesa
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-nam-login-bg text-white">
        Caricamento...
      </div>
    );
  }

  // 2. Se NON c'è sessione, mostra la schermata di Login (Nuovo Componente)
  if (!session) {
    return <AuthLogin />;
  }

  // Componente placeholder per sezioni in sviluppo
  const InProduzioneView = ({ section }: { section: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-black text-gray-800 mb-2">IN PRODUZIONE</h1>
        <p className="text-gray-500 text-sm mb-4">
          La sezione <strong className="text-gray-700">{section}</strong> è attualmente in fase di sviluppo.
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
          <span className="animate-pulse">●</span> Coming Soon
        </div>
      </div>
    </div>
  );

  // 3. Se siamo qui, l'utente è loggato: Mostra il Gestionale
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <CalendarView />;
      case 'crm':
        return <CrmView />;
      case 'didactics':
        return <DidacticsView />;
      case 'students':
        return <StudentsView />;
      case 'admin':
        return <InProduzioneView section="Amministrazione" />;
      case 'warehouse':
        return <InProduzioneView section="Magazzino & Shop" />;
      case 'reports':
        return <InProduzioneView section="Reportistica" />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="flex h-screen bg-nam-bg overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar activeView={activeView} onViewChange={setActiveView} role={role} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <Header
          role={role}
          onRoleChange={setRole}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// App Principale che avvolge tutto con il Guardiano (AuthProvider)
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;