import React, { useEffect, useState } from 'react';
import { Receipt, RefreshCcw, MonitorSmartphone, Globe, AlertTriangle } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface UnifiedTransaction {
  id: string;
  type: 'ORDER' | 'SALE';
  clientName: string;
  total: string;
  status: string;
  date: string;
  paymentMethod: string;
}

const TransactionsHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/transactions');
      setTransactions(response.data.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefund = async (transactionId: string, type: 'ORDER' | 'SALE') => {
    const confirmRefund = window.confirm(`Are you sure you want to refund this ${type}? The items will be returned to inventory.`);
    if (!confirmRefund) return;

    const reason = window.prompt("Reason for refund (optional):") || `Customer requested refund`;

    try {
      setProcessingId(transactionId);
      await apiClient.post('/transactions/refund', { transactionId, type, reason });
      alert('Refund processed successfully.');
      fetchHistory();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error processing refund');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Transactions & Refunds
          </h1>
          <p className="text-gray-500 text-sm mt-1">Unified ledger of all E-Commerce and POS operations.</p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions recorded yet.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tx.type === 'ORDER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <Globe className="w-3 h-3" /> Web Order
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <MonitorSmartphone className="w-3 h-3" /> POS Sale
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    ${Number(tx.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {tx.status === 'REFUNDED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3" /> Refunded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tx.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {tx.status !== 'REFUNDED' && tx.status !== 'CANCELLED' && (
                      <button 
                        onClick={() => handleRefund(tx.id, tx.type)}
                        disabled={processingId === tx.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw className={`w-4 h-4 ${processingId === tx.id ? 'animate-spin' : ''}`} />
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsHistory;