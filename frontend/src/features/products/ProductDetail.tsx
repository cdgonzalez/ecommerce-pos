import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { useCartStore } from '../../store/cart.store';

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
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

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

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: quantity
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading product...</div>;
  if (error || !product) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gray-100 min-h-[300px] flex items-center justify-center text-gray-400">
          [Product Image]
        </div>
        <div className="p-8 flex flex-col">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 mb-6">${Number(product.price).toFixed(2)}</p>
          <div className="prose prose-sm text-gray-500 mb-8 flex-1">
            <p>{product.description}</p>
          </div>
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="qty" className="text-sm font-medium text-gray-700">Quantity:</label>
              <input 
                id="qty" type="number" min="1" value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-center"
              />
            </div>
            <button 
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors text-white ${added ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {added ? <CheckCircle className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
              {added ? 'Added to Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;