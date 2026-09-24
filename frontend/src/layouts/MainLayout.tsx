import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Store, ShoppingCart, UserCircle } from 'lucide-react'; // <--- Icono UserCircle añadido
import { useCartStore } from '../store/cart.store';
import { useAuthStore } from '../store/auth.store'; // <--- Importar Auth Store

const MainLayout: React.FC = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user, logout } = useAuthStore(); // <--- Obtener estado de sesión

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors">
              <Store className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">EcoPOS</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link to="/cart" className="relative text-gray-600 hover:text-gray-900 flex items-center">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Botonera de Usuario Dinámica */}
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link to="/account" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <UserCircle className="w-5 h-5" />
                    <span>Hi, {user?.name.split(' ')[0]}</span>
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-600">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} EcoPOS System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;