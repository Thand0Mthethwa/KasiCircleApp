import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const storageKey = 'kasicircle_collection_cart';
export const maxQuantity = 100;
export const maxProducts = 30;

function restoreCart() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey));
    if (stored?.businessId && stored?.businessName && Array.isArray(stored.items) && stored.items.length) {
      return stored;
    }
  } catch {
    // A blocked or invalid session cache starts with an empty cart.
  }
  return null;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(restoreCart);
  useEffect(() => {
    try {
      if (cart) sessionStorage.setItem(storageKey, JSON.stringify(cart));
      else sessionStorage.removeItem(storageKey);
    } catch {
      // The current tab still works without session storage.
    }
  }, [cart]);

  function add(business, product) {
    setCart((value) => {
      const current = value?.businessId === business.id ? value.items : [];
      const existing = current.find((item) => item.productId === product.id);
      const items = existing
        ? current.map((item) => item === existing && item.quantity < maxQuantity
          ? { ...item, quantity: item.quantity + 1 } : item)
        : current.length < maxProducts ? [...current, {
          productId: product.id, name: product.name, quantity: 1, priceMinor: product.priceMinor,
        }] : current;
      return { businessId: business.id, businessName: business.name, items };
    });
  }

  function update(items) {
    setCart((value) => value && items.length ? { ...value, items } : null);
  }

  return <CartContext.Provider value={{ cart, add, update, clear: () => setCart(null) }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
