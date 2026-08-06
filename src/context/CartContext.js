import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext({
  cart: [],
  toggleCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const toggleCart = (product) =>
    setCart(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );

  const removeFromCart = (productId) =>
    setCart(prev => prev.filter(p => p.id !== productId));

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, toggleCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
