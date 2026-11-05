import React, { useEffect, useState } from 'react';
import { 
  X, Truck, CheckCircle2, AlertOctagon, Printer, 
  MapPin, User, CreditCard, Clock, AlertTriangle 
} from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { PackingSlipModal } from './PackingSlipModal';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose, onOrderUpdated }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals inside detail
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [carrier, setCarrier] = useState('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (status: string, payload: any = {}) => {
    try {
      setActionLoading(true);
      setError('');
      await apiClient.patch(`/orders/${orderId}/status`, { status, ...payload });
      setShowShippingModal(false);
      await fetchOrderDetail();
      onOrderUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason.trim()) return;

    try {
      setActionLoading(true);
      setError('');
      await apiClient.post(`/orders/${orderId}/cancel`, { cancellationReason });
      setShowCancelModal(false);
      await fetchOrderDetail();
      onOrderUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order?.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                order?.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                order?.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-800' :
                order?.status === 'CONFIRMED' ? 'bg-yellow-100 text-yellow-800' :
                order?.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {order?.status || 'LOADING'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            {order && (
              <button
                onClick={() => setShowPackingSlip(true)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4 text-gray-500" /> Packing Slip
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading full order history...</div>
          ) : order ? (
            <>
              {/* Cancellation Banner */}
              {order.status === 'CANCELLED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  <p className="font-bold flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5" /> This order has been cancelled and stock was restored.
                  </p>
                  {order.cancellationReason && (
                    <p className="mt-1 text-red-700 ml-7">Reason: <span className="italic">{order.cancellationReason}</span></p>
                  )}
                </div>
              )}

              {/* Shipping Info Card */}
              {order.status === 'SHIPPED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-bold">Shipped with {order.carrier}</p>
                      <p className="text-blue-700 text-xs">Tracking Number: <span className="font-mono font-bold">{order.trackingNumber}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid with Customer & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Customer Details
                  </h3>
                  <p className="font-semibold text-gray-900">{order.user?.name}</p>
                  <p className="text-sm text-gray-600">{order.user?.email}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Shipping Address
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{order.shippingAddress}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Payment Status
                  </h3>
                  <p className="text-sm font-semibold text-gray-900 uppercase">{order.payments?.[0]?.method || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">Ref: {order.payments?.[0]?.reference || 'N/A'}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    order.payments?.[0]?.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    order.payments?.[0]?.status === 'REFUNDED' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.payments?.[0]?.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Order Items ({order.items?.length || 0})</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Product</th>
                        <th className="px-4 py-2.5 text-left">SKU</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Qty</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {order.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                          <td className="px-4 py-3 text-right text-gray-600">${Number(item.unitPrice).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(item.totalPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Taxes breakdown */}
                <div className="flex justify-end mt-4">
                  <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${Number(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes (16% IVA)</span>
                      <span>${Number(order.taxes).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="border-t border-gray-200 pt-6 flex flex-wrap justify-between items-center gap-3">
                {/* Cancellation trigger */}
                {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 disabled:opacity-50"
                  >
                    Cancel Order & Restock
                  </button>
                ) : <div />}

                {/* Lifecycle State Transitions */}
                <div className="flex items-center gap-3">
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus('PROCESSING')}
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" /> Start Processing
                    </button>
                  )}

                  {order.status === 'PROCESSING' && (
                    <button
                      onClick={() => setShowShippingModal(true)}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" /> Mark as Shipped
                    </button>
                  )}

                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleUpdateStatus('DELIVERED')}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Shipping Tracking Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Enter Shipping Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Company</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. FedEx, DHL, Estafeta"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Code / Guide</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. TRK-928371948"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowShippingModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('SHIPPED', { carrier, trackingNumber })}
                disabled={actionLoading || !carrier.trim() || !trackingNumber.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Prompt Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> Cancel Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cancelling this order will immediately replenish inventory for all items and mark payment as refunded.
            </p>
            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  required
                  placeholder="e.g. Buyer requested cancellation prior to parcel dispatch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !cancellationReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packing Slip View */}
      {showPackingSlip && (
        <PackingSlipModal order={order} onClose={() => setShowPackingSlip(false)} />
      )}
    </div>
  );
};

