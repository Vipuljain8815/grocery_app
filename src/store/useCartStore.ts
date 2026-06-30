import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Product } from '../models';

type CartItem = Product & {
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          if (existingItem.quantity >= product.stock_quantity) {
            return; // Enforce limit
          }
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          if (product.stock_quantity <= 0) return;
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === productId);
        
        // Enforce limit
        let finalQuantity = quantity;
        if (existingItem && quantity > existingItem.stock_quantity) {
          finalQuantity = existingItem.stock_quantity;
        }

        set({
          items: currentItems.map((item) =>
            item.id === productId ? { ...item, quantity: finalQuantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
