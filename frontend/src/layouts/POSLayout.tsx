import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const POSLayout: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-gray-900 text-white shadow-md flex justify-between items-center px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <MonitorSmartphone className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-xl tracking-wider uppercase">EcoPOS Terminal</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-gray-400">Cashier:</span> <span className="font-semibold">{user?.name}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Exit POS
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden flex">
        <Outlet />
      </main>
    </div>
  );
};

export default POSLayout;