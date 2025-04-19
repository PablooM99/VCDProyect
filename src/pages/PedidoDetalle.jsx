// src/pages/PedidoDetalle.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function PedidoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const ref = doc(db, "pedidos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPedido({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      }
    };

    fetchPedido();
  }, [id]);

  if (!pedido) return <p className="text-white p-6">Cargando pedido...</p>;

  const { fecha, items, total, cuponAplicado, descuento, metodoPago, direccion } = pedido;
  const totalConDescuento = cuponAplicado
    ? total - (total * descuento) / 100
    : total;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="p-6 min-h-screen bg-gray-950 text-white max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-400 mb-4">🧾 Detalle del Pedido #{pedido.id}</h1>
      <p className="text-sm text-gray-400 mb-2">Fecha: {fecha?.toDate?.().toLocaleString?.() || "-"}</p>
      <p className="text-sm text-gray-400 mb-4">Dirección: {direccion}</p>

      <table className="w-full text-sm mb-4">
        <thead className="text-amber-300">
          <tr>
            <th className="text-left">Producto</th>
            <th className="text-center">Cantidad</th>
            <th className="text-right">Precio</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-800">
              <td>{item.title}</td>
              <td className="text-center">{item.cantidad}</td>
              <td className="text-right">${(item.price * item.cantidad).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-gray-900 p-4 rounded shadow space-y-2">
        <p><strong>Método de Pago:</strong> {metodoPago}</p>
        <p><strong>Total:</strong> ${total.toFixed(2)}</p>
        {cuponAplicado && (
          <>
            <p><strong>Cupón Aplicado:</strong> {cuponAplicado} ({descuento}%)</p>
            <p><strong>Total con Descuento:</strong> ${totalConDescuento.toFixed(2)}</p>
          </>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-6 text-amber-400 hover:underline"
      >
        ← Volver al panel de usuario
      </button>
    </div>
    </div>
  );
}
