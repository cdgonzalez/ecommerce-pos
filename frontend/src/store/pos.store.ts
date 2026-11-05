import { create } from 'zustand';

export interface POSItem {
  productId: string;
  name: string;
  price: number;
  sku: string;
  quantity: number;
}

interface CustomerBase {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ShiftInfo {
  id: string;
  cashierId: string;
  status: 'OPEN' | 'CLOSED';
  initialCash: number;
  expectedCash?: number | null;
  countedCash?: number | null;
  variance?: number | null;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
}

interface POSState {
  items: POSItem[];
  customer: CustomerBase | null;
  activeShift: ShiftInfo | null;
  shiftLoading: boolean;
  addItem: (item: POSItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomer: (customer: CustomerBase | null) => void;
  setActiveShift: (shift: ShiftInfo | null) => void;
  setShiftLoading: (loading: boolean) => void;
  clearShift: () => void;
  clearTerminal: () => void;
  getSubtotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  customer: null,
  activeShift: null,
  shiftLoading: false,
  addItem: (newItem) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.productId === newItem.productId);
    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...currentItems, newItem] });
    }
  },
  removeItem: (productId) => set({ items: get().items.filter((item) => item.productId !== productId) }),
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) return get().removeItem(productId);
    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
  },
  setCustomer: (customer) => set({ customer }),
  setActiveShift: (activeShift) => set({ activeShift }),
  setShiftLoading: (shiftLoading) => set({ shiftLoading }),
  clearShift: () => set({ activeShift: null }),
  clearTerminal: () => set({ items: [], customer: null }),
  getSubtotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
}));
