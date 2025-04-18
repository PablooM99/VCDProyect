// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ingresos, setIngresos] = useState(0);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [usuariosActivos, setUsuariosActivos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const pedidosSnap = await getDocs(collection(db, "pedidos"));
        const usuariosSnap = await getDocs(collection(db, "usuarios"));

        const pedidosData = pedidosSnap.docs.map(doc => doc.data());
        const usuariosData = usuariosSnap.docs.map(doc => doc.data());

        setPedidos(pedidosData);
        setUsuarios(usuariosData);

        // Ingresos totales de pedidos entregados
        let totalIngresos = 0;
        const ventasPorMes = {};
        const productoCount = {};
        const usuarioCount = {};

        pedidosData.forEach((p) => {
          if (p.estado === "entregado" && Array.isArray(p.productos)) {
            const fecha = p.fecha?.toDate?.() || new Date();
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

            const subtotal = p.productos.reduce((sum, item) => {
              const cantidad = item.qty || item.cantidad || 1;
              return sum + (item.price || 0) * cantidad;
            }, 0);

            totalIngresos += subtotal;

            ventasPorMes[mes] = (ventasPorMes[mes] || 0) + subtotal;

            p.productos.forEach((item) => {
              const nombre = item.title || "Sin nombre";
              productoCount[nombre] = (productoCount[nombre] || 0) + (item.qty || item.cantidad || 1);
            });

            if (p.usuarioId) {
              usuarioCount[p.usuarioId] = (usuarioCount[p.usuarioId] || 0) + 1;
            }
          }
        });

        setIngresos(totalIngresos);

        // Formatear datos para gráficos
        const ingresosData = Object.entries(ventasPorMes)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([mes, total]) => ({ mes, total }));

        const productosTop = Object.entries(productoCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([producto, cantidad]) => ({ producto, cantidad }));

        const usuariosTop = Object.entries(usuarioCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([usuario, pedidos]) => ({ usuario, pedidos }));

        setIngresosMensuales(ingresosData);
        setProductosMasVendidos(productosTop);
        setUsuariosActivos(usuariosTop);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    cargarDatos();
  }, []);

  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter(p => p.estado === "pendiente").length;
  const pedidosPreparados = pedidos.filter(p => p.estado === "preparado").length;
  const pedidosEntregados = pedidos.filter(p => p.estado === "entregado").length;

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-8">📊 Dashboard de Administración</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Preparados</h2>
          <p className="text-2xl font-bold mt-2 text-yellow-300">{pedidosPreparados}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Usuarios Registrados</h2>
          <p className="text-2xl font-bold mt-2">{usuarios.length}</p>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-gray-900 p-4 rounded shadow">
          <h3 className="text-lg text-amber-300 mb-4">🕒 Ingresos por Mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ingresosMensuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#fbbf24" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 p-4 rounded shadow">
          <h3 className="text-lg text-amber-300 mb-4">📦 Productos más Vendidos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productosMasVendidos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="producto" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 p-4 rounded shadow col-span-1 md:col-span-2">
          <h3 className="text-lg text-amber-300 mb-4">👤 Usuarios más Activos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usuariosActivos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="usuario" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pedidos" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
