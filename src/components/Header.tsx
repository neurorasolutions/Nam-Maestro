import React from 'react';
import { Role } from '../types';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ role, onRoleChange, onToggleSidebar }) => {
  return (
    <header className="h-[50px] bg-white shadow-sm flex items-center justify-between px-4 z-10">
      <div className="flex items-center text-gray-500">
        <button
          onClick={onToggleSidebar}
          className="mr-4 hover:bg-gray-100 p-2 rounded focus:outline-none transition-colors"
        >
          <i className="fas fa-bars"></i>
        </button>
        <span className="text-sm font-light">Anno 2026/2027</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Simulator Toggle */}
        <div className="flex items-center bg-gray-100 rounded-full px-1 py-1 border border-gray-200">
          <span className="text-xs font-semibold text-gray-600 px-3 uppercase tracking-wide">Vista:</span>
          <button
            onClick={() => onRoleChange('direzione')}
            className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${role === 'direzione'
              ? 'bg-nam-red text-white shadow'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            DIREZIONE
          </button>
          <button
            onClick={() => onRoleChange('segreteria')}
            className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${role === 'segreteria'
              ? 'bg-nam-blue text-white shadow'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            SEGRETERIA
          </button>
        </div>

        <div className="flex items-center space-x-3 text-gray-500 border-l pl-4">
          <i className="fas fa-envelope hover:text-nam-blue cursor-pointer"></i>
          <NotificationBell />
          <i className="fas fa-flag hover:text-nam-red cursor-pointer"></i>
        </div>
      </div>
    </header>
  );
};

export default Header;