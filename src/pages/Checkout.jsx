// src/pages/Checkout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export default function Checkout() {
  const {
    cart,
    totalConDescuento,
    setCart,
    cupon,
    descuentoCupon,
    limpiarCupon,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: user?.displayName || "",
    email: user?.email || "",
    direccion: "",
    metodoPago: "pendiente",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const confirmarPedido = async () => {
    if (!formData.direccion) {
      return Swal.fire("Error", "Completa todos los campos", "error");
    }

    try {
      // 🔒 Validar cupón de un solo uso
      if (cupon && user?.uid) {
        const cuponRef = doc(db, "cupones", cupon);
        const cuponSnap = await getDoc(cuponRef);

        if (cuponSnap.exists()) {
          const cuponData = cuponSnap.data();

          if (cuponData.soloUnaVez) {
            const usadoRef = doc(db, "usuarios", user.uid, "cupones_usados", cupon);
            const usadoSnap = await getDoc(usadoRef);

            if (usadoSnap.exists()) {
              return Swal.fire(
                "Cupón ya utilizado",
                "Este cupón solo puede ser usado una vez por usuario.",
                "warning"
              );
            }
          }
        }
      }

      const nuevoPedido = {
        items: cart,
        total: totalConDescuento,
        cuponAplicado: cupon || null,
        descuento: descuentoCupon || 0,
        fecha: serverTimestamp(),
        estado: "pendiente",
        metodoPago: "pendiente",
        direccion: formData.direccion,
        userEmail: formData.email,
        userId: user?.uid || null,
      };

      await addDoc(collection(db, "pedidos"), nuevoPedido);

      // 🧠 Marcar cupón como usado si aplica
      if (cupon && user?.uid) {
        const cuponRef = doc(db, "cupones", cupon);
        const cuponSnap = await getDoc(cuponRef);

        if (cuponSnap.exists() && cuponSnap.data().soloUnaVez) {
          const usadoRef = doc(db, "usuarios", user.uid, "cupones_usados", cupon);
          await setDoc(usadoRef, {
            usado: true,
            fecha: serverTimestamp(),
          });
        }
      }

      Swal.fire("✅ Pedido realizado", "Gracias por tu compra", "success");
      toast.success("Pedido confirmado correctamente 🎉");
      setCart([]);
      limpiarCupon();
      navigate("/");
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
      Swal.fire("Error", "No se pudo realizar el pedido", "error");
      toast.error("Error al confirmar el pedido 😓");
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-amber-400">
          📝 Confirmar Pedido
        </h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 bg-gray-700 rounded"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="w-full p-2 bg-gray-700 rounded"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm">Dirección de entrega</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full p-2 bg-gray-800 rounded"
              placeholder="Ej: Calle falsa 123, Localidad"
            />
          </div>

          <div>
            <label className="block text-sm">Método de pago</label>
            <input
              type="text"
              value="pendiente"
              disabled
              className="w-full p-2 bg-gray-700 rounded text-gray-300 cursor-not-allowed"
            />
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={confirmarPedido}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-2 rounded"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
