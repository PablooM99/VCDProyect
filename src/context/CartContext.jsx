// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const data = localStorage.getItem("carrito");
    return data ? JSON.parse(data) : [];
  });

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (producto) => {
    setCart((prev) => {
      const item = prev.find((p) => p.id === producto.id);
      if (item) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id, cantidad) => {
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  const totalItems = cart.reduce((acc, p) => acc + p.cantidad, 0);
  const totalPrice = cart.reduce((acc, p) => acc + p.price * p.cantidad, 0);
  const lastThree = [...cart].slice(-3);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart, // <- ✅ ESTO FALTABA
        addToCart,
        removeFromCart,
        updateQuantity,
        totalItems,
        totalPrice,
        lastThree
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
