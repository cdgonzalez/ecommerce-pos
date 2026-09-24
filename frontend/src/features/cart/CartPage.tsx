import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../../store/cart.store';
import apiClient from '../../services/api/axios.client';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setIsValidating(true);
    setValidationError('');

    try {
      const payload = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };
      
      // Validar inventario y precios reales en Backend
      await apiClient.post('/cart/validate', payload);
      
      // Si el backend autoriza (200 OK), procedemos a checkout (Iteración 10)
      navigate('/checkout');
    } catch (error: any) {
      setValidationError(error.response?.data?.message || 'Error validating cart. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
        <Link to="/" className="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-md hover:bg-blue-700">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart</h1>
      
      {validationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{validationError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.productId} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900"><Link to={`/products/${item.productId}`} className="hover:text-blue-600">{item.name}</Link></h3>
                <p className="text-gray-500">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center"
                />
                <div className="text-right w-24 font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-gray-400 hover:text-red-600 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-lg text-gray-600">
            Subtotal ({useCartStore.getState().getTotalItems()} items): 
            <span className="font-extrabold text-gray-900 ml-2">${getSubtotal().toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={isValidating}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition-colors disabled:bg-blue-400"
          >
            {isValidating ? 'Validating...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;