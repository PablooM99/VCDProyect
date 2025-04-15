// src/pages/Checkout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

export default function Checkout() {
  const { cart, totalPrice, setCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: user?.displayName || "",
    email: user?.email || "",
    direccion: "",
    metodoPago: "efectivo"
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const confirmarPedido = async () => {
    if (!formData.direccion || !formData.metodoPago) {
      return Swal.fire("Error", "Completa todos los campos", "error");
    }

    const nuevoPedido = {
      items: cart,
      total: totalPrice,
      fecha: serverTimestamp(),
      estado: "pendiente",
      metodoPago: formData.metodoPago,
      direccion: formData.direccion,
      userEmail: formData.email,
      userId: user?.uid || null
    };

    try {
      await addDoc(collection(db, "pedidos"), nuevoPedido);
      Swal.fire("✅ Pedido realizado", "Gracias por tu compra", "success");
      setCart([]);
      navigate("/");
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
      Swal.fire("Error", "No se pudo realizar el pedido", "error");
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
    <div className="p-6 max-w-2xl mx-auto  bg-gray-900 text-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-amber-400">📝 Confirmar Pedido</h1>
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
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="pendiente">Pendiente</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
            <option value="echeq">eCheq</option>
            <option value="transferencia">Transferencia</option>
            <option value="pagado (MercadoPago)">MercadoPago</option>
          </select>
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
