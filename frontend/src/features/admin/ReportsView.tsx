import React, { useEffect, useState } from 'react';
import { BarChart3, Calendar, PackageSearch, TrendingUp } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface DailySale {
  date: string;
  E_COMMERCE: number;
  POS: number;
  TOTAL: number;
}

interface TopProduct {
  name: string;
  sku: string;
  quantitySold: number;
  revenueGenerated: number;
}

interface InventoryValuation {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  unitValue: number;
  totalValue: number;
}

const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'PRODUCTS' | 'VALUATION'>('SALES');
  const [loading, setLoading] = useState(false);
  
  // Date states for Sales Report
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data states
  const [salesData, setSalesData] = useState<DailySale[]>([]);
  const [productsData, setProductsData] = useState<TopProduct[]>([]);
  const [valuationData, setValuationData] = useState<InventoryValuation[]>([]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
      setSalesData(res.data.data);
    } catch (error) {
      console.error("Failed to load sales report", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/reports/top-products?limit=15`);
      setProductsData(res.data.data);
    } catch (error) {
      console.error("Failed to load products report", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValuationData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/reports/inventory-valuation`);
      setValuationData(res.data.data);
    } catch (error) {
      console.error("Failed to load valuation report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'SALES') fetchSalesData();
    if (activeTab === 'PRODUCTS') fetchProductsData();
    if (activeTab === 'VALUATION') fetchValuationData();
  }, [activeTab]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Analytics & Reports
        </h1>
        <p className="text-gray-500 text-sm mt-1">Extract deep insights from operational data.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-t-lg border-b border-gray-200 overflow-hidden">
        <button 
          onClick={() => setActiveTab('SALES')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'SALES' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <TrendingUp className="w-4 h-4" /> Daily Sales
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCTS')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'PRODUCTS' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <BarChart3 className="w-4 h-4" /> Top Products
        </button>
        <button 
          onClick={() => setActiveTab('VALUATION')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'VALUATION' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <PackageSearch className="w-4 h-4" /> Inventory Valuation
        </button>
      </div>

      <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
        
        {/* SALES TAB */}
        {activeTab === 'SALES' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-gray-400">to</span>
              <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button onClick={fetchSalesData} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">Apply Filter</button>
            </div>

            {loading ? <div className="py-8 text-center text-gray-500">Generating report...</div> : (
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Web (E-Commerce)</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Store (POS)</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-500">No sales recorded in this period.</td></tr> : salesData.map((row) => (
                    <tr key={row.date} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.date}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">${row.E_COMMERCE.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">${row.POS.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">${row.TOTAL.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-4">
            {loading ? <div className="py-8 text-center text-gray-500">Generating report...</div> : (
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Units Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productsData.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{prod.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-mono">{prod.sku}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600 font-bold">{prod.quantitySold}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-blue-600">${prod.revenueGenerated.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VALUATION TAB */}
        {activeTab === 'VALUATION' && (
          <div className="space-y-4">
            {loading ? <div className="py-8 text-center text-gray-500">Generating report...</div> : (
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">In Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Total Asset Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {valuationData.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {inv.name} <span className="block text-xs text-gray-500 font-mono">{inv.sku}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{inv.category}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-700">{inv.quantityOnHand}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-500">${inv.unitValue.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-green-600">${inv.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;