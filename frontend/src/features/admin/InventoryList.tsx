import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, Plus, ArrowDown, X } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  product: { name: string; sku: string; price: string };
}

interface AdjustModalState {
  isOpen: boolean;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT';
}

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modal State for stock adjustments
  const [modal, setModal] = useState<AdjustModalState>({
    isOpen: false,
    productId: '',
    productName: '',
    type: 'IN',
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const url = filterLowStock ? '/inventory?lowStock=true' : '/inventory';
      const response = await apiClient.get(url);
      setInventory(response.data.data);
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterLowStock]);

  const openAdjustModal = (productId: string, productName: string, type: 'IN' | 'OUT') => {
    setModal({
      isOpen: true,
      productId,
      productName,
      type,
    });
    setQuantity(1);
    setReason('');
    setErrorMessage(null);
  };

  const closeAdjustModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    setErrorMessage(null);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || isNaN(quantity)) {
      setErrorMessage('Please enter a valid quantity greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await apiClient.post('/inventory/adjust', {
        productId: modal.productId,
        type: modal.type,
        quantity,
        reason: reason.trim() || `Manual ${modal.type} adjustment`,
      });
      closeAdjustModal();
      fetchInventory();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Error adjusting stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor stock levels and register movements.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-4 py-2 border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
          <input 
            type="checkbox" 
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          Show Low Stock Only
        </label>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">On Hand</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No inventory records found.</td></tr>
            ) : (
              inventory.map((item) => {
                const isLowStock = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {item.product.sku}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openAdjustModal(item.productId, item.product.name, 'IN')}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors" 
                          title="Add Stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openAdjustModal(item.productId, item.product.name, 'OUT')}
                          className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors" 
                          title="Deduct Stock"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal Dialog */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={closeAdjustModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              {modal.type === 'IN' ? (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600">
                  <Plus className="w-4 h-4" />
                </span>
              ) : (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600">
                  <ArrowDown className="w-4 h-4" />
                </span>
              )}
              {modal.type === 'IN' ? 'Add Stock' : 'Deduct Stock'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Product: <span className="font-semibold text-gray-800">{modal.productName}</span>
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  placeholder={modal.type === 'IN' ? 'e.g. Supplier purchase, Initial count' : 'e.g. Sale, Damaged item, Shrinkage'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
                    modal.type === 'IN'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } disabled:opacity-50`}
                >
                  {submitting ? 'Processing...' : modal.type === 'IN' ? 'Confirm Inbound' : 'Confirm Outbound'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;