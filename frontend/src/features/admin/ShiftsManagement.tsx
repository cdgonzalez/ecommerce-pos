import React, { useEffect, useState } from 'react';
import { FileText, Filter, RefreshCw, User } from 'lucide-react';
import apiClient from '../../services/api/axios.client';
import { CorteZTicketModal } from './CorteZTicketModal';

export const ShiftsManagement: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const fetchShifts = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/shifts?page=${page}&limit=${pagination.limit}`;
      if (status) url += `&status=${status}`;

      const res = await apiClient.get(url);
      setShifts(res.data.data.shifts);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el historial de turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(1, statusFilter);
  }, [statusFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Turnos y Cortes Z</h1>
          <p className="text-gray-500 text-sm mt-1">
            Auditoría de aperturas de caja, arqueos físicos y conciliación de diferencias.
          </p>
        </div>

        <button
          onClick={() => fetchShifts(pagination.page, statusFilter)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los turnos</option>
            <option value="OPEN">En Curso (OPEN)</option>
            <option value="CLOSED">Cerrados (CLOSED)</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Mostrando {shifts.length} de {pagination.total} turnos registrados
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            <p className="mt-2 text-sm">Cargando turnos de caja...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        ) : shifts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-base font-semibold">No se encontraron turnos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="py-3.5 px-4">Cajero</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fondo Inicial</th>
                  <th className="py-3.5 px-4">Efectivo Contado</th>
                  <th className="py-3.5 px-4">Diferencia (Varianza)</th>
                  <th className="py-3.5 px-4">Apertura</th>
                  <th className="py-3.5 px-4">Cierre</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shifts.map((shift) => {
                  const variance = shift.variance !== null ? Number(shift.variance) : null;
                  return (
                    <tr key={shift.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{shift.cashier?.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            shift.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {shift.status === 'OPEN' ? '🟢 En Curso' : 'Cerrado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-800">
                        ${Number(shift.initialCash).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-800">
                        {shift.countedCash !== null ? `$${Number(shift.countedCash).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {variance !== null ? (
                          <span
                            className={`font-mono font-bold ${
                              variance === 0
                                ? 'text-green-600'
                                : variance > 0
                                ? 'text-blue-600'
                                : 'text-red-600'
                            }`}
                          >
                            {variance > 0 ? `+$${variance.toFixed(2)}` : `$${variance.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(shift.openedAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedShiftId(shift.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Corte Z
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
            <button
              onClick={() => fetchShifts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-50 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Anterior
            </button>
            <span className="text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchShifts(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-50 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {selectedShiftId && (
        <CorteZTicketModal
          shiftId={selectedShiftId}
          isOpen={Boolean(selectedShiftId)}
          onClose={() => setSelectedShiftId(null)}
        />
      )}
    </div>
  );
};

