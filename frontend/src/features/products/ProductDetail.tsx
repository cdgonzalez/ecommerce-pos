import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: string;
  category: { name: string };
  brand?: { name: string };
}

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/catalog/products/${slug}`);
        setProduct(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading product...</div>;
  if (error || !product) return (
    <div className="p-8 text-center text-red-500">
      {error} <br/> <Link to="/" className="text-blue-600 underline mt-2 inline-block">Return to Catalog</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gray-100 min-h-[300px] flex items-center justify-center text-gray-400">
          [High-Res Product Image]
        </div>
        <div className="p-8 flex flex-col">
          <div className="text-sm text-blue-600 font-semibold mb-2 tracking-wide uppercase">
            {product.category.name} {product.brand && `• ${product.brand.name}`}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 mb-6">${Number(product.price).toFixed(2)}</p>
          
          <div className="prose prose-sm text-gray-500 mb-8 flex-1">
            <p>{product.description}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-500 mb-4">SKU: <span className="font-mono text-gray-900">{product.sku}</span></div>
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;