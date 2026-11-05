import React, { useState } from 'react';
import { DollarSign, AlertTriangle, X } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { usePOSStore } from '../../store/pos.store';

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClosedShift: (closedShiftData: any) => void;
}

export const ShiftClosingModal: React.FC<ShiftClosingModalProps> = ({
  isOpen,
  onClose,
  onClosedShift,
}) => {
  const { activeShift, clearShift, clearTerminal } = usePOSStore();
  const [countedCash, setCountedCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeShift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCash = parseFloat(countedCash);
    if (isNaN(parsedCash) || parsedCash < 0) {
      setError('El efectivo contado en arqueo debe ser mayor o igual a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(`/shifts/${activeShift.id}/close`, {
        countedCash: parsedCash,
        notes: notes.trim() || undefined,
      });

      const closedData = response.data.data;
      clearShift();
      clearTerminal();
      onClosedShift(closedData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cerrar el turno y generar Corte Z');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-red-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-lg">Cierre de Turno (Corte Z)</h2>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>Atención:</strong> Al cerrar el turno se realizará el arqueo de caja final,
            se calcularán sobrantes o faltantes de efectivo, se bloquearán ventas posteriores
            y se emitirá el ticket fiscal/administrativo Corte Z.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Efectivo Físico Contado en Gaveta (Arqueo) *
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
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Observaciones / Justificación de Diferencias (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalle cualquier discrepancia encontrada en el conteo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all disabled:bg-red-300 flex items-center gap-2"
            >
              {loading ? 'Cerrando Turno...' : 'Confirmar Cierre y Corte Z'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

