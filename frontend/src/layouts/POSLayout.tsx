import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, MonitorSmartphone, ArrowLeftRight, CheckCircle2, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { usePOSStore } from '../store/pos.store';
import apiClient from '../services/api/axios.client';
import { ShiftOpeningModal } from '../features/pos/ShiftOpeningModal';
import { CashMovementModal } from '../features/pos/CashMovementModal';
import { ShiftClosingModal } from '../features/pos/ShiftClosingModal';
import { CorteZTicketModal } from '../features/admin/CorteZTicketModal';

const POSLayout: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { activeShift, shiftLoading, setActiveShift, setShiftLoading } = usePOSStore();

  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [closedShiftIdForTicket, setClosedShiftIdForTicket] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentShift = async () => {
      try {
        setShiftLoading(true);
        const res = await apiClient.get('/shifts/current');
        setActiveShift(res.data.data);
      } catch (err) {
        console.error('Error fetching current shift:', err);
      } finally {
        setShiftLoading(false);
      }
    };

    fetchCurrentShift();
  }, [setActiveShift, setShiftLoading]);

  const handleShiftClosed = (closedData: any) => {
    setClosedShiftIdForTicket(closedData.id);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-gray-900 text-white shadow-md flex justify-between items-center px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <MonitorSmartphone className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-xl tracking-wider uppercase">EcoPOS Terminal</span>
          {activeShift ? (
            <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Turno Activo (${Number(activeShift.initialCash).toFixed(2)})
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Lock className="w-3.5 h-3.5" />
              Caja Cerrada
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {activeShift && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMovementOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                Movimiento de Caja
              </button>
              <button
                onClick={() => setIsClosingOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-bold rounded-lg border border-red-500/30 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                Corte Z (Cierre)
              </button>
            </div>
          )}

          <div className="text-sm border-l border-gray-700 pl-4">
            <span className="text-gray-400">Cajero:</span>{' '}
            <span className="font-semibold">{user?.name}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex relative">
        <Outlet />

        {/* Lock Overlay Modal when no shift is open */}
        {!shiftLoading && !activeShift && (
          <ShiftOpeningModal isOpen={!activeShift} />
        )}
      </main>

      {/* Cash Movement Modal */}
      <CashMovementModal
        isOpen={isMovementOpen}
        onClose={() => setIsMovementOpen(false)}
      />

      {/* Shift Closing Modal */}
      <ShiftClosingModal
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
        onClosedShift={handleShiftClosed}
      />

      {/* Ticket Modal after closing */}
      {closedShiftIdForTicket && (
        <CorteZTicketModal
          shiftId={closedShiftIdForTicket}
          isOpen={Boolean(closedShiftIdForTicket)}
          onClose={() => setClosedShiftIdForTicket(null)}
        />
      )}
    </div>
  );
};

export default POSLayout;
