// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ingresos, setIngresos] = useState(0);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [usuariosActivos, setUsuariosActivos] = useState([]);
  const [productosVendidos, setProductosVendidos] = useState(0);
  const [mejorMes, setMejorMes] = useState("-");
  const [tendencia, setTendencia] = useState(0);
  const [efectividadEntrega, setEfectividadEntrega] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [preparados, setPreparados] = useState(0);
  const [entregados, setEntregados] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const pedidosSnap = await getDocs(collection(db, "pedidos"));
        const usuariosSnap = await getDocs(collection(db, "usuarios"));

        const pedidosData = pedidosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usuariosData = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setPedidos(pedidosData);
        setUsuarios(usuariosData);

        let totalIngresos = 0;
        let totalVendidos = 0;
        const ventasPorMes = {};
        const productoCount = {};
        const usuarioCount = {};
        let pend = 0, prep = 0, entr = 0;

        for (const p of pedidosData) {
          if (p.estado === "pendiente") pend++;
          if (p.estado === "preparado") prep++;
          if (p.estado === "entregado") entr++;

          const productos = p.productos || p.items || [];

          if (
            p.estado === "entregado" &&
            productos.length > 0 &&
            p.metodoPago &&
            p.metodoPago !== "pendiente"
          ) {
            const fecha = p.fecha?.toDate?.() || new Date();
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

            const subtotal = productos.reduce((sum, item) => {
              const cantidad = item.qty || item.cantidad || 1;
              totalVendidos += cantidad;
              return sum + (item.price || 0) * cantidad;
            }, 0);

            totalIngresos += subtotal;
            ventasPorMes[mes] = (ventasPorMes[mes] || 0) + subtotal;

            productos.forEach((item) => {
              const nombre = item.title || "Sin nombre";
              productoCount[nombre] = (productoCount[nombre] || 0) + (item.qty || item.cantidad || 1);
            });

            if (p.usuarioId) {
              usuarioCount[p.usuarioId] = (usuarioCount[p.usuarioId] || 0) + 1;
            }
          }
        }

        setPendientes(pend);
        setPreparados(prep);
        setEntregados(entr);
        setProductosVendidos(totalVendidos);
        setIngresos(totalIngresos);

        const ingresosData = Object.entries(ventasPorMes)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([mes, total]) => ({ mes, total }));

        const productosTop = Object.entries(productoCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([producto, cantidad]) => ({ producto, cantidad }));

        const usuariosTop = await Promise.all(
          Object.entries(usuarioCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(async ([usuarioId, pedidos]) => {
              const ref = doc(db, "usuarios", usuarioId);
              const snap = await getDoc(ref);
              const nombre = snap.exists() ? snap.data().nombre || snap.data().email : usuarioId;
              return { usuario: nombre, pedidos };
            })
        );

        setUsuariosActivos(usuariosTop);
        setIngresosMensuales(ingresosData);

        const sortedIncomes = ingresosData.slice().sort((a, b) => b.total - a.total);
        setMejorMes(sortedIncomes[0]?.mes || "-");

        if (ingresosData.length >= 2) {
          const ult = ingresosData[ingresosData.length - 1];
          const prev = ingresosData[ingresosData.length - 2];
          const diff = ult.total - prev.total;
          const perc = ((diff / prev.total) * 100).toFixed(1);
          setTendencia(perc);
        }

        const total = pedidosData.length;
        setEfectividadEntrega(total ? ((entr / total) * 100).toFixed(1) : 0);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    cargarDatos();
  }, []);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("📊 Informe del Dashboard", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de ingresos", `$${ingresos.toFixed(2)}`],
        ["Productos vendidos", productosVendidos],
        ["Mejor mes", mejorMes],
        ["Tendencia mensual", `${tendencia}%`],
        ["Efectividad de entrega", `${efectividadEntrega}%`],
        ["Pedidos pendientes", pendientes],
        ["Pedidos preparados", preparados],
        ["Pedidos entregados", entregados],
        ["Usuarios registrados", usuarios.length],
      ],
      theme: "striped",
      styles: { fontSize: 12 },
    });

    doc.save("dashboard_admin.pdf");
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gray-950">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-400">📊 Dashboard de Administración</h1>
        <button
          onClick={exportarPDF}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          📄 Exportar PDF
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Total de Ingresos</h2>
          <p className="text-2xl font-bold mt-2 text-green-400">${ingresos.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Productos Vendidos</h2>
          <p className="text-2xl font-bold mt-2 text-blue-400">{productosVendidos}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Mejor Mes en Ventas</h2>
          <p className="text-2xl font-bold mt-2 text-purple-400">{mejorMes}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Tendencia Mensual</h2>
          <p className="text-2xl font-bold mt-2 text-cyan-300">{tendencia}%</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Efectividad de Entrega</h2>
          <p className="text-2xl font-bold mt-2 text-green-300">{efectividadEntrega}%</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Usuarios Registrados</h2>
          <p className="text-2xl font-bold mt-2">{usuarios.length}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Pendientes</h2>
          <p className="text-2xl font-bold mt-2 text-red-400">{pendientes}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Preparados</h2>
          <p className="text-2xl font-bold mt-2 text-yellow-300">{preparados}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-amber-300">Pedidos Entregados</h2>
          <p className="text-2xl font-bold mt-2 text-green-300">{entregados}</p>
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
