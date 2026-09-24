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

interface POSState {
  items: POSItem[];
  customer: CustomerBase | null;
  addItem: (item: POSItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomer: (customer: CustomerBase | null) => void;
  clearTerminal: () => void;
  getSubtotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  customer: null,
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
  clearTerminal: () => set({ items: [], customer: null }),
  getSubtotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
}));