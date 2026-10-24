import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Contact, 
  Receipt, BarChart3, ShieldAlert, LogOut, Store, Tag 
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/transactions', icon: Receipt, label: 'Transactions' },
    { to: '/admin/inventory', icon: Package, label: 'Inventory' },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/admin/customers', icon: Contact, label: 'Customers' },
    { to: '/admin/users', icon: Users, label: 'Users & Roles' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/audit', icon: ShieldAlert, label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Store className="w-6 h-6 text-blue-400 mr-2" />
          <span className="font-bold text-lg tracking-wider">ECOPOS ADMIN</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4 px-4 text-sm">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Logged in as</p>
            <p className="font-medium truncate">{user?.name}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header Placeholder */}
        <header className="md:hidden bg-gray-900 text-white h-16 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <Store className="w-6 h-6 text-blue-400 mr-2" />
            <span className="font-bold">ADMIN</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;