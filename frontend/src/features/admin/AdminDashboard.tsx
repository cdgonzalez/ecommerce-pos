import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, MonitorSmartphone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/axios.client';

interface DashboardMetrics {
  kpis: {
    totalRevenue: number;
    orderRevenue: number;
    saleRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    lowStockCount: number;
  };
  recentActivity: {
    id: string;
    type: 'ORDER' | 'SALE';
    clientName: string;
    total: string;
    status: string;
    date: string;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to load dashboard metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Compiling analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  const { kpis, recentActivity } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time performance metrics and alerts.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">${kpis.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><DollarSign className="w-6 h-6" /></div>
          </div>
          <div className="flex items-center text-sm gap-4 text-gray-500">
            <span className="flex items-center gap-1"><Globe className="w-4 h-4"/> ${kpis.orderRevenue.toFixed(0)}</span>
            <span className="flex items-center gap-1"><MonitorSmartphone className="w-4 h-4"/> ${kpis.saleRevenue.toFixed(0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{kpis.totalTransactions}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
          </div>
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium"><TrendingUp className="w-4 h-4"/> Active volume</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Customers</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{kpis.totalCustomers}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600"><Users className="w-6 h-6" /></div>
          </div>
          <Link to="/admin/customers" className="text-sm text-indigo-600 hover:underline">View directory</Link>
        </div>

        <div className={`rounded-xl shadow-sm border p-6 flex flex-col justify-between ${kpis.lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm font-medium ${kpis.lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>Low Stock Alerts</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${kpis.lowStockCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{kpis.lowStockCount}</h3>
            </div>
            <div className={`${kpis.lowStockCount > 0 ? 'bg-red-200 text-red-700' : 'bg-orange-100 text-orange-600'} p-3 rounded-lg`}><AlertTriangle className="w-6 h-6" /></div>
          </div>
          {kpis.lowStockCount > 0 ? (
             <Link to="/admin/inventory" className="text-sm text-red-600 font-medium hover:underline">Replenish stock immediately</Link>
          ) : (
             <span className="text-sm text-gray-500">Inventory levels optimal</span>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          <Link to="/admin/transactions" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {recentActivity.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {tx.type === 'ORDER' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600"><Globe className="w-4 h-4"/> Web Order</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><MonitorSmartphone className="w-4 h-4"/> POS Sale</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{tx.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${Number(tx.total).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;