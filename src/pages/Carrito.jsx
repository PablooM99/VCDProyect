// src/pages/Carrito.jsx
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function Carrito() {
  const cartContext = useCart();
  const { cart, removeFromCart, updateQuantity } = cartContext;
  const setCart = cartContext.setCart;
  const { user } = useAuth();

  const [cupon, setCupon] = useState("");
  const [descuento, setDescuento] = useState(0);

  const totalOriginal = cart.reduce(
    (acc, item) => acc + item.price * item.cantidad,
    0
  );
  const totalConDescuento = totalOriginal - (totalOriginal * descuento) / 100;

  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(cart));
  }, [cart]);

  const vaciarCarrito = () => {
    setCart([]);
    localStorage.removeItem("carrito");
    Swal.fire("🧹 Carrito vaciado", "Tu carrito fue vaciado correctamente", "success");
  };

  const aplicarCupon = async () => {
    if (!cupon.trim()) return;

    try {
      const ref = doc(db, "cupones", cupon.toUpperCase());
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        toast.error("❌ Cupón inválido");
        setDescuento(0);
        return;
      }

      const data = snap.data();

      if (!data.activo) {
        toast.warning("⚠️ Cupón no está activo");
        setDescuento(0);
        return;
      }

      setDescuento(data.descuento || 0);
      toast.success(`🎉 Cupón aplicado: ${data.descuento}% de descuento`);
    } catch (error) {
      console.error("Error al verificar cupón:", error);
      toast.error("❌ Error al validar el cupón");
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4">🛒 Carrito de Compras</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Revisa y edita los productos que elegiste antes de confirmar tu compra.
        </p>
      </div>

      {cart.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">Tu carrito está vacío.</p>
      ) : (
        <>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm text-left">
              <thead className="text-amber-300 border-b border-gray-700">
                <tr>
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cantidad</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      <img
                        src={item.imageURL}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      {item.title}
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        className="w-16 p-1 text-center bg-gray-800 border border-gray-700 rounded text-white"
                      />
                    </td>
                    <td className="text-white">${item.price}</td>
                    <td className="text-white">${(item.price * item.cantidad).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:underline"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-900 p-4 rounded shadow mb-6">
            <h2 className="text-xl text-amber-300 font-semibold mb-2">📋 Resumen del Pedido</h2>
            <ul className="text-sm text-gray-200 mb-3 space-y-1">
              {cart.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.title} x{item.cantidad}</span>
                  <span>${(item.price * item.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {descuento > 0 && (
              <div className="flex justify-between text-green-400 font-semibold">
                <span>Descuento ({descuento}%)</span>
                <span>- ${(totalOriginal - totalConDescuento).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-white border-t border-gray-700 pt-2">
              <span>Total</span>
              <span className="text-amber-400">${totalConDescuento.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4 items-center mb-6">
            <input
              type="text"
              placeholder="Ingresar cupón de descuento"
              className="bg-gray-800 text-white px-4 py-2 rounded w-full md:w-auto"
              value={cupon}
              onChange={(e) => setCupon(e.target.value)}
            />
            <button
              onClick={aplicarCupon}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
            >
              Aplicar Cupón
            </button>
          </div>

          <div className="flex flex-wrap gap-4 justify-between">
            <button
              onClick={vaciarCarrito}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow"
            >
              Vaciar carrito
            </button>
            <div className="flex gap-4">
              <Link
                to="/checkout"
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded shadow"
              >
                Confirmar Pedido
              </Link>
              <button
                onClick={() => Swal.fire("⚠️ Sin conexión a MercadoPago", "Esta funcionalidad se agregará próximamente", "info")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
              >
                Pagar (MercadoPago)
              </button>
            </div>
          </div>

          <div className="mt-4">
            <a href="/productos" className="text-amber-400 hover:underline">
              ← Seguir comprando
            </a>
          </div>
        </>
      )}
    </div>
  );
}
