// src/components/OrderForm.jsx
import { useCart } from "../context/CartContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

export default function OrderForm({ user }) {
  const { cart, getTotal, clearCart } = useCart();

  const handleConfirm = async () => {
    try {
      if (cart.length === 0) {
        Swal.fire("Carrito vacío", "Agregá productos antes de confirmar.", "info");
        return;
      }

      const pedido = {
        usuario: user?.displayName || user?.email,
        email: user?.email,
        total: getTotal(),
        fecha: serverTimestamp(),
        estado: "pendiente",
        productos: cart
      };

      await addDoc(collection(db, "pedidos"), pedido);
      clearCart();
      Swal.fire("Pedido enviado", "Tu pedido fue guardado con estado 'pendiente'.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar el pedido.", "error");
    }
  };

  return (
    <div className="mt-6 text-center">
      <button
        onClick={handleConfirm}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Confirmar Pedido
      </button>
    </div>
  );
}
