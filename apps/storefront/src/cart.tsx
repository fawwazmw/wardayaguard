import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiRequest } from './api';
import { useAuth } from './auth';
import type { Cart } from './types';

const EMPTY_CART: Cart = { items: [], subtotalCents: 0 };

interface CartValue {
  cart: Cart;
  count: number;
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  update: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      setLoaded(true);
      return;
    }
    try {
      setCart(await apiRequest<Cart>('/cart'));
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    setLoaded(false);
    refresh().catch(() => setCart(EMPTY_CART));
  }, [refresh]);

  const add = useCallback(async (productId: number, quantity = 1) => {
    setCart(
      await apiRequest<Cart>('/cart/items', {
        method: 'POST',
        body: { productId, quantity },
      }),
    );
  }, []);

  const update = useCallback(async (itemId: number, quantity: number) => {
    setCart(
      await apiRequest<Cart>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: { quantity },
      }),
    );
  }, []);

  const remove = useCallback(async (itemId: number) => {
    await apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' });
    setCart(await apiRequest<Cart>('/cart'));
  }, []);

  const count = cart.items.reduce((total, item) => total + item.quantity, 0);

  const value = useMemo<CartValue>(
    () => ({ cart, count, loaded, refresh, add, update, remove }),
    [cart, count, loaded, refresh, add, update, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
