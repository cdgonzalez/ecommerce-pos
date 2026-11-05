import React, { useState, useEffect } from 'react';
import { Search, UserPlus, ShoppingCart, X, CreditCard, Banknote, Building } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { usePOSStore } from '../../store/pos.store';

interface CatalogProduct { id: string; name: string; sku: string; price: string; }

const POSPage: React.FC = () => {
  const { items, customer, activeShift, addItem, removeItem, updateQuantity, setCustomer, clearTerminal, getSubtotal } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'>('CASH'); // <--- NUEVO ESTADO

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = searchTerm ? `/catalog/products?search=${searchTerm}` : '/catalog/products';
        const response = await apiClient.get(url);
        setProducts(response.data.data);
      } catch (error) {
        console.error("Error fetching products for POS", error);
      }
    };
    const delay = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleCharge = async () => {
    if (items.length === 0) return;
    if (!activeShift) {
      alert('Debe abrir un turno de caja antes de procesar ventas.');
      return;
    }
    setIsProcessing(true);
    
    try {
      const payload = {
        customerId: customer?.id || null,
        paymentMethod: paymentMethod, // <--- INYECCIÓN AL PAYLOAD
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };
      
      await apiClient.post('/sales', payload);
      alert(`Transaction Approved! Paid with ${paymentMethod}`);
      clearTerminal();
      setPaymentMethod('CASH'); // Reset
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transaction Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getSubtotal();
  const taxes = subtotal * 0.16;
  const total = subtotal + taxes;

  return (
    <div className="flex w-full h-full">
      {/* Panel Izquierdo: Catálogo (Sin cambios estructurales masivos) */}
      <div className="w-2/3 flex flex-col border-r border-gray-200 bg-gray-50 h-full">
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text" autoFocus placeholder="Scan barcode or search by name / SKU..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <button key={product.id} onClick={() => addItem({ productId: product.id, name: product.name, sku: product.sku, price: Number(product.price), quantity: 1 })} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col h-32 active:scale-95">
                <span className="text-xs text-gray-500 font-mono mb-1">{product.sku}</span>
                <span className="font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">{product.name}</span>
                <span className="text-blue-600 font-extrabold text-lg">${Number(product.price).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Derecho: Ticket y Pagos */}
      <div className="w-1/3 flex flex-col bg-white h-full relative shadow-lg">
        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <UserPlus className="w-5 h-5 text-gray-400" />
            <span className={customer ? "font-semibold text-gray-800" : "text-gray-500 italic"}>
              {customer ? `${customer.firstName} ${customer.lastName}` : "Walk-in Customer"}
            </span>
          </div>
          {customer && <button onClick={() => setCustomer(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
              <p>Add products to start sale</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li key={item.productId} className="flex justify-between items-start group">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 leading-tight">{item.name}</div>
                    <div className="text-sm text-gray-500">${item.price.toFixed(2)} / ea</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="1" className="w-12 text-center border border-gray-300 rounded text-sm py-1" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)} />
                    <div className="w-16 text-right font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sección de Pago */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setPaymentMethod('CASH')} className={`py-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              <Banknote className="w-5 h-5" /> <span className="text-xs font-semibold">Cash</span>
            </button>
            <button onClick={() => setPaymentMethod('CREDIT_CARD')} className={`py-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${paymentMethod === 'CREDIT_CARD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              <CreditCard className="w-5 h-5" /> <span className="text-xs font-semibold">Credit</span>
            </button>
            <button onClick={() => setPaymentMethod('DEBIT_CARD')} className={`py-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${paymentMethod === 'DEBIT_CARD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              <Building className="w-5 h-5" /> <span className="text-xs font-semibold">Debit</span>
            </button>
          </div>

          <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t border-gray-300 mb-4">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          
          <button onClick={handleCharge} disabled={items.length === 0 || isProcessing || !activeShift} className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300 disabled:text-gray-500 shadow-md">
            {isProcessing ? 'Processing...' : `Charge $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;