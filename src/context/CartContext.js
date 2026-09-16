import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext({
  cart: [],
  toggleCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  setQuantity: () => {},
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const toggleCart = (product) =>
    setCart(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, { ...product, quantity: 1 }]
    );

  const removeFromCart = (productId) =>
    setCart(prev => prev.filter(p => p.id !== productId));

  const setQuantity = (productId, quantity) =>
    setCart(prev => prev.map(p => (p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p)));

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, toggleCart, removeFromCart, clearCart, setQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
