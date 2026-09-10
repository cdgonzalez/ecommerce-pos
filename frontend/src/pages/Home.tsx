import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Welcome to the Store
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Our product catalog will be displayed here in upcoming iterations. 
          The routing and layout infrastructure is now fully operational.
        </p>
      </div>
    </div>
  );
};

export default Home;