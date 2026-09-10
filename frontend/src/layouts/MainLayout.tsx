import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Store } from 'lucide-react';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors">
              <Store className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">EcoPOS</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Catalog</Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
                Sign In
              </button>
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