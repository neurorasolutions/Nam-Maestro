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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [role, setRole] = useState<Role>('direzione');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      {/* Sidebar - Conditionally Rendered */}
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

export default App;