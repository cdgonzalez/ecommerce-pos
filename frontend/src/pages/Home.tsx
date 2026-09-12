import React from 'react';
import ProductList from '../features/products/ProductList';

const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Explore Catalog</h1>
        <p className="text-gray-500">Discover our latest products and collections.</p>
      </div>
      <ProductList />
    </div>
  );
};

export default Home;