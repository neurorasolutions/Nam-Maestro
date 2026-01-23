import React, { useState } from 'react';
import { View } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Recupera l'email reale o mette un placeholder se qualcosa va storto
  const userEmail = session?.user?.email || 'Utente';
  const userInitial = userEmail.charAt(0).toUpperCase();

  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard & Calendario', icon: 'fa-calendar-alt' },
    { id: 'crm', label: 'CRM & Lead', icon: 'fa-bullhorn' },
    { id: 'didactics', label: 'Didattica & Corsi', icon: 'fa-graduation-cap' },
    { id: 'students', label: 'Segreteria & Iscritti', icon: 'fa-user-graduate' },
    { id: 'admin', label: 'Amministrazione', icon: 'fa-euro-sign' },
    { id: 'warehouse', label: 'Magazzino & Shop', icon: 'fa-boxes' },
    { id: 'reports', label: 'Reportistica', icon: 'fa-chart-pie' },
  ];

  return (
    <>
      <aside className="w-[230px] bg-[#222d32] text-white flex-shrink-0 flex flex-col">
        {/* Logo Header */}
        <div className="h-[50px] bg-[#367fa9] flex items-center justify-center font-bold text-xl tracking-wider">
          NAM <span className="font-light text-sm ml-1">MAESTRO</span>
        </div>
        
        {/* User Profile - Ora cliccabile */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="p-4 flex items-center border-b border-gray-700 mb-2 cursor-pointer hover:bg-[#2c3b41] transition-colors"
          title="Clicca per gestire il profilo"
        >
          {/* Avatar dinamico con iniziale */}
          <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white mr-3 font-bold border-2 border-transparent hover:border-white transition-all">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate max-w-[140px]">{userEmail}</p>
            <div className="flex items-center text-xs text-green-400">
              <i className="fas fa-circle text-[8px] mr-1"></i> Online
            </div>
          </div>
        </div>

        {/* Navigazione */}
        <nav className="flex-1 overflow-y-auto mt-2">
          <p className="px-4 text-xs text-gray-400 uppercase mb-2 font-semibold">Navigazione</p>
          <ul>
            {menuItems.map((item) => (
              <li key={item.id} className="mb-0.5">
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors border-l-4 flex items-center ${
                    activeView === item.id
                      ? 'bg-[#1e282c] border-nam-blue text-white'
                      : 'border-transparent text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white'
                  }`}
                >
                  <i className={`fas ${item.icon} w-6`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 text-xs text-gray-500 text-center">
          v2.4.1 - NAM Legacy
        </div>
      </aside>

      {/* Modale Profilo */}
      <UserProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar;