// src/pages/AdminPanel.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import ProductoAdmin from "../components/ProductoAdmin";
import PedidosAdmin from "../components/PedidosAdmin";
import UsuariosAdmin from "../components/UsuariosAdmin";
import ProductosPorCategoria from "../components/ProductosPorCategoriaAdmin";
import DashboardAdmin from "../components/DashboardAdmin";
import SoporteAdmin from "../pages/SoporteAdmin";
import CuponesAdmin from "../components/CuponesAdmin";
import PedidosPendientesAdmin from "../components/PedidosPendientesAdmin";
import LogsAdmin from "../components/LogsAdmin";
import DescuentosCantidadAdmin from "../components/DescuentoCantidadAdmin";
import GestionContenidoAdmin from './GestionContenidoAdmin';


export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [rolAcceso, setRolAcceso] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarAcceso = async () => {
      if (!user) return navigate("/login");
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const data = userDoc.data();
        if (data?.rol === "admin" || data?.rol === "empleado") {
          setRolAcceso(data.rol); // admin o empleado
        } else {
          setRolAcceso(null);
          navigate("/");
        }
      } catch (error) {
        console.error("Error al verificar acceso:", error);
        navigate("/");
      }
    };
    verificarAcceso();
  }, [user, navigate]);

  if (rolAcceso === null) return <p className="text-white">Verificando acceso...</p>;

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">🛠️ Panel de Administración</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setTab("dashboard")}
          className={`px-4 py-2 rounded font-semibold ${tab === "dashboard" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab("productos")}
          className={`px-4 py-2 rounded font-semibold ${tab === "productos" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Productos
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`px-4 py-2 rounded font-semibold ${tab === "pedidos" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Pedidos
        </button>
        {["admin", "empleado"].includes(rolAcceso) && (
          <button
            onClick={() => setTab("usuarios")}
            className={`px-4 py-2 rounded font-semibold ${tab === "usuarios" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
          >
            Usuarios
          </button>
        )}
        {["admin", "empleado"].includes(rolAcceso) && (
          <button
            onClick={() => setTab("cupones")}
            className={`px-4 py-2 rounded font-semibold ${tab === "cupones" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
          >
            Cupones
          </button>
        )}
        <button
          onClick={() => setTab("categorias")}
          className={`px-4 py-2 rounded font-semibold ${tab === "categorias" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Productos por Categoría
        </button>
        <button
          onClick={() => setTab("pendientes")}
          className={`px-4 py-2 rounded font-semibold ${tab === "pendientes" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Pedidos Pendientes
        </button>
        <button onClick={() => setTab("descuentosCantidad")} 
        className={`px-4 py-2 rounded font-semibold ${tab === "descuentosCantidad" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}>
          Descuentos por Cantidad
        </button>
          {["admin", "empleado"].includes(rolAcceso) && (
            <button
              onClick={() => setTab("contenido")}
              className={`px-4 py-2 rounded font-semibold ${tab === "contenido" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
            >
              Contenido del Sitio
            </button>
          )}
        <button
          onClick={() => setTab("soporte")}
          className={`px-4 py-2 rounded font-semibold ${tab === "soporte" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Soporte
        </button>
        {user?.rol === "admin" && (
          <button
            onClick={() => setTab("logs")}
            className={`px-4 py-2 rounded font-semibold ${tab === "logs" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
          >
            📋 Logs
          </button>
        )}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && <DashboardAdmin />}
        {tab === "productos" && <ProductoAdmin />}
        {tab === "pedidos" && <PedidosAdmin />}
        {tab === "usuarios" && ["admin", "empleado"].includes(rolAcceso) && <UsuariosAdmin />}
        {tab === "categorias" && <ProductosPorCategoria />}
        {tab === "cupones" && ["admin", "empleado"].includes(rolAcceso) && <CuponesAdmin />}
        {tab === "pendientes" && <PedidosPendientesAdmin />}
        {tab === "descuentosCantidad" && user?.rol === "admin" && <DescuentosCantidadAdmin />}
        {tab === "contenido" && ["admin", "empleado"].includes(rolAcceso) && <GestionContenidoAdmin />}
        {tab === "soporte" && <SoporteAdmin />}
        {tab === "logs" && user?.rol === "admin" && <LogsAdmin />}
      </div>
    </div>
  );
}
