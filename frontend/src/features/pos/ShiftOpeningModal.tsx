import React, { useState } from 'react';
import { DollarSign, Lock, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { usePOSStore } from '../../store/pos.store';

interface ShiftOpeningModalProps {
  isOpen: boolean;
}

export const ShiftOpeningModal: React.FC<ShiftOpeningModalProps> = ({ isOpen }) => {
  const [initialCash, setInitialCash] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const setActiveShift = usePOSStore((state) => state.setActiveShift);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(initialCash);
    if (isNaN(amount) || amount < 0) {
      setError('El fondo inicial debe ser un número mayor o igual a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/shifts/open', { initialCash: amount });
      setActiveShift(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al abrir el turno de caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Apertura de Turno</h2>
          <p className="text-blue-100 text-sm mt-1">
            Ingrese el fondo inicial en gaveta para desbloquear la terminal POS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fondo Inicial de Caja (Efectivo)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                autoFocus
                placeholder="0.00"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-lg font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Monto físico disponible para dar cambio al iniciar el turno.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white py-3.5 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Abrir Turno y Desbloquear POS'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

