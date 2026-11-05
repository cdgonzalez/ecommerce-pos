import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, X, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { usePOSStore } from '../../store/pos.store';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const activeShift = usePOSStore((state) => state.activeShift);
  const [type, setType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeShift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser un valor positivo mayor a 0');
      return;
    }

    if (!reason.trim()) {
      setError('El motivo o justificación del movimiento es obligatorio');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.post(`/shifts/${activeShift.id}/movements`, {
        type,
        amount: parsedAmount,
        reason: reason.trim()
      });

      setAmount('');
      setReason('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el movimiento de caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg">Movimiento de Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('CASH_OUT')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
                  type === 'CASH_OUT'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ArrowDownRight className="w-5 h-5 text-amber-600" />
                <span>Salida (Sangría)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('CASH_IN')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
                  type === 'CASH_IN'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                <span>Entrada (Inyección)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Monto en Efectivo ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Motivo o Justificación
            </label>
            <textarea
              rows={3}
              required
              placeholder={
                type === 'CASH_OUT'
                  ? 'Ej. Retiro por exceso de efectivo a caja fuerte o pago a proveedor'
                  : 'Ej. Inyección de monedas para cambio'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:bg-blue-300"
            >
              {loading ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

