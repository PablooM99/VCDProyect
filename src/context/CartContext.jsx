// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [cupon, setCupon] = useState(() => localStorage.getItem("cupon") || "");
  const [descuentoCupon, setDescuentoCupon] = useState(() => {
    const d = localStorage.getItem("descuento");
    return d ? Number(d) : 0;
  });
  const [descuentosCantidad, setDescuentosCantidad] = useState([]);

  // 🔄 Cargar descuentos por cantidad
  useEffect(() => {
    const cargarDescuentos = async () => {
      try {
        const snap = await getDocs(collection(db, "descuentosPorCantidad"));
        const lista = snap.docs.map((doc) => ({
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

  // 🔄 Cargar carrito desde Firestore al iniciar sesión
  useEffect(() => {
    const cargarCarritoDesdeFirestore = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, "carritos", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.items)) {
              setCart(data.items);
            } else {
              setCart([]);
            }
          } else {
            setCart([]);
          }
        } catch (error) {
          console.error("Error al cargar el carrito:", error);
          setCart([]);
        }
      }
    };

    cargarCarritoDesdeFirestore();
  }, [user]);

  // 🧹 Vaciar carrito local al cerrar sesión
  useEffect(() => {
    if (!user) {
      setCart([]);
    }
  }, [user]);

  // 💾 Guardar carrito automáticamente en Firestore al modificar
  useEffect(() => {
    const guardarCarritoEnFirestore = async () => {
      if (user?.uid && cart.length > 0) {
        try {
          const docRef = doc(db, "carritos", user.uid);

          const itemsFormateados = cart
            .filter((p) => p.id && p.title && p.price && p.cantidad)
            .map(({ id, title, price, cantidad, precioOriginal }) => ({
              id,
              title,
              price,
              cantidad,
              precioOriginal: precioOriginal || price,
            }));

          await setDoc(docRef, {
            items: itemsFormateados,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error al guardar el carrito:", error);
        }
      }
    };

    guardarCarritoEnFirestore();
  }, [cart, user?.uid]);

  // 💾 Cupon sigue usando localStorage
  useEffect(() => {
    localStorage.setItem("cupon", cupon);
    localStorage.setItem("descuento", descuentoCupon.toString());
  }, [cupon, descuentoCupon]);

  const aplicarDescuentoPorCantidad = (productoId, cantidad, precioBase) => {
    const descuento = descuentosCantidad.find(
      (d) => d.productoId === productoId && cantidad >= d.cantidadMinima
    );
    if (descuento) {
      const nuevoPrecio = precioBase * (1 - descuento.descuento / 100);
      return parseFloat(nuevoPrecio.toFixed(2));
    }
    return precioBase;
  };

  const addToCart = (producto, cantidad = 1) => {
    setCart((prev) => {
      const itemExistente = prev.find((p) => p.id === producto.id);

      let nuevoCart;
      const precioOriginal = producto.precioOriginal || producto.price;

      if (itemExistente) {
        nuevoCart = prev.map((p) => {
          if (p.id === producto.id) {
            const nuevaCantidad = p.cantidad + cantidad;
            const nuevoPrecio = aplicarDescuentoPorCantidad(
              p.id,
              nuevaCantidad,
              p.precioOriginal || precioOriginal
            );
            return {
              ...p,
              cantidad: nuevaCantidad,
              price: nuevoPrecio,
              precioOriginal: p.precioOriginal || precioOriginal,
            };
          }
          return p;
        });
      } else {
        const nuevoPrecio = aplicarDescuentoPorCantidad(
          producto.id,
          cantidad,
          precioOriginal
        );
        nuevoCart = [
          ...prev,
          {
            ...producto,
            cantidad,
            price: nuevoPrecio,
            precioOriginal,
          },
        ];
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
          const precioBase = p.precioOriginal || p.price;
          const nuevoPrecio = aplicarDescuentoPorCantidad(
            p.id,
            nuevaCantidad,
            precioBase
          );
          return {
            ...p,
            cantidad: nuevaCantidad,
            price: nuevoPrecio,
            precioOriginal: precioBase,
          };
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
