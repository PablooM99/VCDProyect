// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ingresos, setIngresos] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      const pedidosSnap = await getDocs(collection(db, "pedidos"));
      const usuariosSnap = await getDocs(collection(db, "usuarios"));

      const pedidosData = pedidosSnap.docs.map(doc => doc.data());
      const usuariosData = usuariosSnap.docs.map(doc => doc.data());

      setPedidos(pedidosData);
      setUsuarios(usuariosData);

      const total = pedidosData.reduce((acc, p) => {
        if (p.estado === "entregado") {
          return acc + p.productos.reduce((sum, item) => sum + item.price * item.cantidad, 0);
        }
        return acc;
      }, 0);

      setIngresos(total);
    };

    cargarDatos();
  }, []);

  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter(p => p.estado === "pendiente").length;
  const pedidosEntregados = pedidos.filter(p => p.estado === "entregado").length;

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-8">📊 Dashboard de Administración</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Total de Ingresos</h2>
          <p className="text-2xl font-bold mt-2 text-green-400">${ingresos.toFixed(2)}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Total de Pedidos</h2>
          <p className="text-2xl font-bold mt-2">{totalPedidos}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Entregados</h2>
          <p className="text-2xl font-bold mt-2 text-green-300">{pedidosEntregados}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Pendientes</h2>
          <p className="text-2xl font-bold mt-2 text-red-400">{pedidosPendientes}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Usuarios Registrados</h2>
          <p className="text-2xl font-bold mt-2">{usuarios.length}</p>
        </div>
      </div>
    </div>
  );
}
