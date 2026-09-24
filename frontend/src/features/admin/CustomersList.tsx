import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, MapPin, Phone, Mail } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  addresses: { city: string; state: string }[];
}

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = searchTerm ? `/customers?search=${searchTerm}` : '/customers';
      const response = await apiClient.get(url);
      setCustomers(response.data.data);
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchCustomers(), 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customers Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage client profiles and contact information.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading directory...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No customers found.</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.firstName} {customer.lastName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </div>
                    )}
                    {!customer.email && !customer.phone && <span className="text-sm text-gray-400 italic">No contact info</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.addresses.length > 0 ? (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {customer.addresses[0].city}, {customer.addresses[0].state}</span>
                    ) : (
                      <span className="italic text-gray-400">Unspecified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
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

export default CustomersList;