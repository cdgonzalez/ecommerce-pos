import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        // Construir URL dinámicamente según filtros
        let url = '/catalog/products?status=ACTIVE';
        if (searchTerm) url += `&search=${searchTerm}`;
        if (selectedCategory) url += `&category=${selectedCategory}`;

        const [prodRes, catRes] = await Promise.all([
          apiClient.get(url),
          apiClient.get('/catalog/categories')
        ]);
        
        setProducts(prodRes.data.data);
        setCategories(catRes.data.data);
      } catch (error) {
        console.error("Error fetching catalog", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce simple (en producción usar hook de debounce)
    const delay = setTimeout(() => fetchCatalog(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          No products found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              to={`/products/${product.slug}`}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="aspect-w-1 aspect-h-1 bg-gray-100 flex items-center justify-center h-48 text-gray-400">
                [Image Placeholder]
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                  <Tag className="w-3 h-3" /> {product.category.name}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <div className="mt-auto">
                  <span className="text-xl font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;