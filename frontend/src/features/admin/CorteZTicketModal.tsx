import React, { useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface CorteZTicketModalProps {
  shiftId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CorteZTicketModal: React.FC<CorteZTicketModalProps> = ({
  shiftId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !shiftId) return;

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/shifts/${shiftId}/summary`);
        setData(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar resumen de Corte Z');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isOpen, shiftId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const variance = data?.cashDrawer?.variance ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-lg">Comprobante Corte Z</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content */}
        <div className="p-6 overflow-y-auto font-mono text-sm space-y-4 print:p-2">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-sans">
              <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
              <p className="mt-2 text-sm">Generando comprobante de arqueo...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl font-sans text-sm">
              {error}
            </div>
          ) : data ? (
            <div id="corte-z-print-area" className="border border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 print:bg-white print:border-none print:p-0">
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h3 className="font-extrabold text-lg text-gray-900 tracking-wider">ECOPOS TERMINAL</h3>
                <p className="text-xs text-gray-600">REPORTE FISCAL / ARQUEO CORTE Z</p>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {data.shift.id.slice(0, 8)} | ESTADO: {data.shift.status}
                </p>
              </div>

              <div className="py-3 text-xs space-y-1 border-b border-dashed border-gray-400">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cajero:</span>
                  <span className="font-bold text-gray-800">{data.shift.cashier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Apertura:</span>
                  <span>{new Date(data.shift.openedAt).toLocaleString()}</span>
                </div>
                {data.shift.closedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cierre:</span>
                    <span>{new Date(data.shift.closedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Financial breakdown */}
              <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>FONDO INICIAL:</span>
                  <span>${Number(data.cashDrawer.initialCash).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) Ventas en Efectivo:</span>
                  <span>${Number(data.cashDrawer.cashSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) Inyecciones de Efectivo:</span>
                  <span>${Number(data.cashDrawer.cashInTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(-) Sangrías / Retiros:</span>
                  <span>${Number(data.cashDrawer.cashOutTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-dotted border-gray-300">
                  <span>EFECTIVO ESPERADO:</span>
                  <span>${Number(data.cashDrawer.expectedCash).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-700">
                  <span>EFECTIVO CONTADO:</span>
                  <span>${Number(data.cashDrawer.countedCash || 0).toFixed(2)}</span>
                </div>

                {/* Variance Badge */}
                <div className="pt-2 flex justify-between items-center text-sm font-black">
                  <span>DIFERENCIA:</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      variance === 0
                        ? 'bg-green-100 text-green-800'
                        : variance > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {variance > 0 ? `+$${variance.toFixed(2)} (Sobrante)` : variance < 0 ? `-$${Math.abs(variance).toFixed(2)} (Faltante)` : '$0.00 (Cuadrado)'}
                  </span>
                </div>
              </div>

              {/* Summary of other payment methods */}
              <div className="py-3 text-xs space-y-1 border-b border-dashed border-gray-400">
                <div className="font-bold text-gray-700 mb-1">OTROS MÉTODOS DE PAGO:</div>
                <div className="flex justify-between">
                  <span>Tarjetas (Crédito/Débito):</span>
                  <span>${Number(data.salesSummary.byPaymentMethod.card).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transferencias:</span>
                  <span>${Number(data.salesSummary.byPaymentMethod.transfer).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1">
                  <span>VENTAS TOTALES DEL TURNO:</span>
                  <span>${Number(data.salesSummary.totalSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Transacciones realizadas:</span>
                  <span>{data.salesSummary.totalTransactions}</span>
                </div>
              </div>

              {data.shift.notes && (
                <div className="pt-3 text-xs">
                  <span className="font-bold text-gray-700">Observaciones:</span>
                  <p className="text-gray-600 mt-0.5 italic">{data.shift.notes}</p>
                </div>
              )}

              <div className="text-center pt-4 text-xs text-gray-400 font-sans">
                *** FIN DEL CORTE Z ***
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

