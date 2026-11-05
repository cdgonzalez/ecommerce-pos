import React from 'react';
import { X, Printer } from 'lucide-react';

interface PackingSlipModalProps {
  order: any;
  onClose: () => void;
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - Hidden in Print */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <h2 className="text-lg font-bold text-gray-900">Packing Slip & Invoice</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Packing Slip Area */}
        <div className="p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {/* Header */}
          <div className="border-b pb-6 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-gray-900">ECOPOS STORE</h1>
              <p className="text-xs text-gray-500 mt-1">E-Commerce & Warehouse Fulfillment</p>
              <p className="text-xs text-gray-500">Order ID: <span className="font-mono font-bold text-gray-900">{order.id}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">PACKING SLIP</p>
              <p className="text-xs text-gray-500 mt-1">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">Status: <span className="font-semibold uppercase">{order.status}</span></p>
            </div>
          </div>

          {/* Shipping & Customer Details */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 print:border-gray-300">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Ship To</h3>
              <p className="font-semibold text-gray-900">{order.user?.name || 'Customer'}</p>
              <p className="text-gray-600 whitespace-pre-line mt-1">{order.shippingAddress}</p>
              <p className="text-gray-500 text-xs mt-2">Email: {order.user?.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 print:border-gray-300">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Shipping Method</h3>
              <p className="text-gray-900">
                Carrier: <span className="font-semibold">{order.carrier || 'Standard Ground'}</span>
              </p>
              {order.trackingNumber && (
                <p className="text-gray-900 mt-1">
                  Tracking #: <span className="font-mono font-bold">{order.trackingNumber}</span>
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Payment: <span className="font-semibold uppercase">{order.payments?.[0]?.method || 'N/A'}</span> ({order.payments?.[0]?.status || 'PENDING'})
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs font-bold text-gray-600 uppercase">
                <th className="py-2">SKU</th>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {order.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="py-3 text-right font-bold">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">${Number(item.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes (16% IVA)</span>
                <span>${Number(order.taxes).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warehouse Checklist Footer */}
          <div className="border-t pt-6 text-xs text-gray-400 flex justify-between items-center">
            <p>Packed by: ____________________</p>
            <p>Verified by: ____________________</p>
            <p>Thank you for choosing ECOPOS Store!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

