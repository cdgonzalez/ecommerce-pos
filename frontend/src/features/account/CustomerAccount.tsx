import React, { useEffect, useState } from 'react';
import { Package, User, MapPin, Edit, Truck, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { useAuthStore } from '../../store/auth.store';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: string;
}

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
}

interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  addresses: { street: string; city: string; state: string; zipCode: string; isDefault: boolean }[];
}

const CustomerAccount: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PROFILE'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userName = useAuthStore(state => state.user?.name);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        // Consumimos el endpoint de órdenes (Iteración 10) y el nuevo de perfil
        const [ordersRes, profileRes] = await Promise.all([
          apiClient.get('/orders/my-orders'),
          apiClient.get('/customers/my-profile')
        ]);
        setOrders(ordersRes.data.data);
        setProfile(profileRes.data.data);
      } catch (error) {
        console.error("Error fetching account data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-bold"><Clock className="w-3 h-3"/> Pending</span>;
      case 'PROCESSING': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold"><Package className="w-3 h-3"/> Processing</span>;
      case 'SHIPPED': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-bold"><Truck className="w-3 h-3"/> Shipped</span>;
      case 'DELIVERED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle className="w-3 h-3"/> Delivered</span>;
      default: return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading your account details...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {userName}</h1>
        <p className="text-gray-500 mt-1">Manage your orders, tracking, and personal details.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Navegación por Pestañas */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === 'ORDERS' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" /> Order History
          </button>
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === 'PROFILE' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <User className="w-5 h-5" /> My Profile
          </button>
        </div>

        {/* Contenido: Órdenes */}
        {activeTab === 'ORDERS' && (
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">You haven't placed any orders yet.</div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-gray-100 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order ID: <span className="font-mono text-gray-900">{order.id}</span></p>
                        <p className="text-sm text-gray-500">Placed on: <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {order.items.map(item => (
                        <li key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-medium">{item.quantity}x {item.productName}</span>
                          <span className="text-gray-500">${Number(item.totalPrice).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contenido: Perfil */}
        {activeTab === 'PROFILE' && profile && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2"><User className="w-5 h-5 text-gray-400" /> Personal Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="mb-3"><span className="block text-xs text-gray-500 uppercase font-bold">Full Name</span><span className="text-gray-900 font-medium">{profile.firstName} {profile.lastName}</span></div>
                <div className="mb-3"><span className="block text-xs text-gray-500 uppercase font-bold">Email Address</span><span className="text-gray-900 font-medium">{profile.email}</span></div>
                <div><span className="block text-xs text-gray-500 uppercase font-bold">Phone Number</span><span className="text-gray-900 font-medium">{profile.phone || 'Not provided'}</span></div>
              </div>
              <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-800"><Edit className="w-4 h-4"/> Edit Details</button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2"><MapPin className="w-5 h-5 text-gray-400" /> Shipping Addresses</h3>
              {profile.addresses.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved addresses.</p>
              ) : (
                profile.addresses.map((addr, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                    {addr.isDefault && <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Default</span>}
                    <p className="text-sm font-medium text-gray-900">{addr.street}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.state} {addr.zipCode}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerAccount;