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


export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarRolAdmin = async () => {
      if (!user) return navigate("/login");
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const data = userDoc.data();
        if (data?.rol === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate("/");
        }
      } catch (error) {
        console.error("Error al verificar rol de admin:", error);
        navigate("/");
      }
    };
    verificarRolAdmin();
  }, [user, navigate]);

  if (isAdmin === null) return <p className="text-white">Verificando acceso...</p>;

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
        <button
          onClick={() => setTab("usuarios")}
          className={`px-4 py-2 rounded font-semibold ${tab === "usuarios" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("cupones")}
          className={`px-4 py-2 rounded font-semibold ${
            tab === "cupones" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"
          }`}
        >
          Cupones
        </button>
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
        <button
          onClick={() => setTab("soporte")}
          className={`px-4 py-2 rounded font-semibold ${tab === "soporte" ? "bg-amber-500 text-black" : "bg-gray-700 text-white"}`}
        >
          Soporte
        </button>
      </div>

      <div className="mt-6">
        {tab === "dashboard" && <DashboardAdmin />}
        {tab === "productos" && <ProductoAdmin />}
        {tab === "pedidos" && <PedidosAdmin />}
        {tab === "usuarios" && <UsuariosAdmin />}
        {tab === "categorias" && <ProductosPorCategoria />}
        {tab === "soporte" && <SoporteAdmin />}
        {tab === "cupones" && <CuponesAdmin />}
        {tab === "pendientes" && <PedidosPendientesAdmin />}

      </div>
    </div>
  );
}
