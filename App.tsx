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
// MODIFICA CRITICA: Importiamo LoginScreen invece di LoginView
import LoginScreen from './components/LoginScreen';
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

  // 2. Se NON c'è sessione, mostra la schermata di Login
  if (!session) {
    return <LoginScreen />;
  }

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
        return <AdminView role={role} />;
      case 'warehouse':
        return <WarehouseView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="flex h-screen bg-nam-bg overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
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