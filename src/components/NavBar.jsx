// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { useCart } from "../context/CartContext";
import MiniCart from "./MiniCart";
import { useFavoritos } from "../context/FavoritosContext";
import NotificacionesPopover from "../components/NotificacionesPopover";

export default function NavBar() {
  const { user } = useAuth();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarMiniCarrito, setMostrarMiniCarrito] = useState(false);
  const { totalItems } = useCart();
  const { favoritos } = useFavoritos();

  const cerrarSesion = () => {
    signOut(auth);
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center relative">
      <Link to="/" className="text-2xl font-bold text-amber-400">
        VCDProyect
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/productos" className="hover:text-amber-400">Productos</Link>
        <Link to="/" className="hover:text-amber-400">Inicio</Link>

        {/* ❤️ Favoritos */}
        {user && (
          <div className="relative flex items-center gap-2">
            <Link to="/favoritos" className="hover:text-red-400 relative">
              ❤️
              {favoritos.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-1">
                  {favoritos.length}
                </span>
              )}
            </Link>

            {/* 🔔 Notificaciones */}
            <NotificacionesPopover />
          </div>
        )}

        {user?.rol === "admin" && (
          <Link to="/admin" className="bg-amber-600 hover:bg-amber-700 text-black px-3 py-1 rounded">
            Admin
          </Link>
        )}
        {user ? (
          <>
            <Link to="/panel" className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded">
              Perfil
            </Link>
            <button
              onClick={cerrarSesion}
              className="bg-gray-700 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
          >
            Iniciar sesión / Registro
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setMostrarMiniCarrito(!mostrarMiniCarrito)}
            className="relative text-white hover:text-amber-400"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-black rounded-full text-xs px-1">
                {totalItems}
              </span>
            )}
          </button>

          {mostrarMiniCarrito && (
            <MiniCart onClose={() => setMostrarMiniCarrito(false)} />
          )}
        </div>
      </div>
      <AuthModal visible={mostrarModal} onClose={() => setMostrarModal(false)} />
    </nav>
  );
}
