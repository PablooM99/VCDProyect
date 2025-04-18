// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const data = localStorage.getItem("carrito");
    return data ? JSON.parse(data) : [];
  });

  const [cupon, setCupon] = useState(() => localStorage.getItem("cupon") || "");
  const [descuentoCupon, setDescuentoCupon] = useState(() => {
    const d = localStorage.getItem("descuento");
    return d ? Number(d) : 0;
  });

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("cupon", cupon);
    localStorage.setItem("descuento", descuentoCupon.toString());
  }, [cupon, descuentoCupon]);

  const addToCart = (producto) => {
    setCart((prev) => {
      const item = prev.find((p) => p.id === producto.id);
      if (item) {
        toast.info(`➕ Se agregó otra unidad de "${producto.title}"`);
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      } else {
        toast.success(`🛒 Producto "${producto.title}" agregado al carrito`);
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
    toast.error("❌ Producto eliminado del carrito");
  };

  const updateQuantity = (id, cantidad) => {
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  const aplicarCupon = (codigo, porcentaje) => {
    setCupon(codigo);
    setDescuentoCupon(porcentaje);
    localStorage.setItem("cupon", codigo);
    localStorage.setItem("descuento", porcentaje.toString());
  };

  const limpiarCupon = () => {
    setCupon("");
    setDescuentoCupon(0);
    localStorage.removeItem("cupon");
    localStorage.removeItem("descuento");
  };

  const totalItems = cart.reduce((acc, p) => acc + p.cantidad, 0);
  const totalPrice = cart.reduce((acc, p) => acc + p.price * p.cantidad, 0);
  const totalConDescuento = totalPrice - (totalPrice * descuentoCupon) / 100;
  const lastThree = [...cart].slice(-3);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalItems,
        totalPrice,
        totalConDescuento,
        lastThree,
        cupon,
        descuentoCupon,
        aplicarCupon,
        limpiarCupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
