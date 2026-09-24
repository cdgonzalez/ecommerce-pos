import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/cart.store';
import apiClient from '../../services/api/axios.client';

const CheckoutPage: React.FC = () => {
  const { items, getSubtotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirigir si el carrito está vacío
  if (items.length === 0 && !success) {
    return <Navigate to="/cart" replace />;
  }

  const subtotal = getSubtotal();
  const taxes = subtotal * 0.16;
  const total = subtotal + taxes;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const payload = {
        shippingAddress: address,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };

      await apiClient.post('/orders', payload);
      
      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error placing the order. Please try again.');
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center bg-white p-12 rounded-xl shadow-sm border border-gray-200">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-8">Thank you for your purchase. We are preparing your order for shipment.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition-colors"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>
          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Full Delivery Address</label>
              <textarea
                id="address"
                required
                rows={3}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main St, Apt 4B, City, Country, ZIP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate pr-2">{item.quantity}x {item.name}</span>
                <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes (16%)</span>
              <span>${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isProcessing}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors flex justify-center items-center gap-2 disabled:bg-green-400"
          >
            {isProcessing ? 'Processing...' : (
              <><ShieldCheck className="w-5 h-5" /> Place Order</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;