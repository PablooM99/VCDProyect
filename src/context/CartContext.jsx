// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

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

  const [descuentosCantidad, setDescuentosCantidad] = useState([]);

  // Cargar descuentos por cantidad al inicio
  useEffect(() => {
    const cargarDescuentos = async () => {
      try {
        const snap = await getDocs(collection(db, "descuentosPorCantidad"));
        const lista = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDescuentosCantidad(lista);
      } catch (error) {
        console.error("Error al cargar descuentos por cantidad:", error);
      }
    };
    cargarDescuentos();
  }, []);

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("cupon", cupon);
    localStorage.setItem("descuento", descuentoCupon.toString());
  }, [cupon, descuentoCupon]);

  const aplicarDescuentoPorCantidad = (producto, cantidad) => {
    const descuento = descuentosCantidad.find(
      (d) => d.productoId === producto.id && cantidad >= d.cantidadMinima
    );
    if (descuento) {
      const nuevoPrecio = producto.price * (1 - descuento.descuento / 100);
      return parseFloat(nuevoPrecio.toFixed(2));
    }
    return producto.price;
  };

  const addToCart = (producto, cantidad = 1) => {
    setCart((prev) => {
      const itemExistente = prev.find((p) => p.id === producto.id);
      const nuevaCantidad = itemExistente ? itemExistente.cantidad + cantidad : cantidad;
      const precioConDescuento = aplicarDescuentoPorCantidad(producto, nuevaCantidad);

      let nuevoCart;
      if (itemExistente) {
        nuevoCart = prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: nuevaCantidad, price: precioConDescuento }
            : p
        );
      } else {
        nuevoCart = [...prev, { ...producto, cantidad, price: precioConDescuento }];
      }

      if (cantidad > 1) {
        toast.success(`✅ Se agregaron ${cantidad} unidades de "${producto.title}"`);
      } else if (itemExistente) {
        toast.info(`➕ Se agregó otra unidad de "${producto.title}"`);
      } else {
        toast.success(`🛒 Producto "${producto.title}" agregado al carrito`);
      }

      return nuevoCart;
    });
  };

  const updateQuantity = (id, nuevaCantidad) => {
    setCart((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nuevoPrecio = aplicarDescuentoPorCantidad(p, nuevaCantidad);
          return { ...p, cantidad: nuevaCantidad, price: nuevoPrecio };
        }
        return p;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
    toast.error("❌ Producto eliminado del carrito");
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("carrito");
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
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
