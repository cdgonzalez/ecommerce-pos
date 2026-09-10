import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const error = useRouteError() as any;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Oops!</h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, an unexpected error has occurred or the page does not exist.
      </p>
      <p className="text-sm text-gray-400 mb-8 italic">
        {error?.statusText || error?.message || "404 Not Found"}
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;