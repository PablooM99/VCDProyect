// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useState, useRef, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useCart } from "../context/CartContext";
import MiniCart from "./MiniCart";
import { useFavoritos } from "../context/FavoritosContext";
import NotificacionesPopover from "./NotificacionesPopover";
import { FaBars } from "react-icons/fa";

export default function NavBar() {
  const { user } = useAuth();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarMiniCarrito, setMostrarMiniCarrito] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { totalItems } = useCart();
  const { favoritos } = useFavoritos();

  const carritoRef = useRef(null);

  const cerrarSesion = () => {
    signOut(auth);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (carritoRef.current && !carritoRef.current.contains(e.target)) {
        setMostrarMiniCarrito(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setMenuAbierto(false);
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center relative z-50">
      <Link to="/" className="text-2xl font-bold text-amber-400">
        VCDProyect
      </Link>

      <button className="sm:hidden text-white" onClick={() => setMenuAbierto(!menuAbierto)}>
        <FaBars size={24} />
      </button>

      <div className="hidden sm:flex gap-4 items-center">
        <Link to="/productos" onClick={handleLinkClick} className="hover:text-amber-400">
          Productos
        </Link>
        <Link to="/" onClick={handleLinkClick} className="hover:text-amber-400">
          Inicio
        </Link>

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
            <NotificacionesPopover />
          </div>
        )}

        {["admin", "empleado"].includes(user?.rol) && (
          <Link to="/admin" className="bg-amber-600 hover:bg-amber-700 text-black px-3 py-1 rounded">
            Panel
          </Link>
        )}

        {user ? (
          <>
            <Link
              to="/panel"
              onClick={handleLinkClick}
              className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
            >
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

        <div className="relative" ref={carritoRef}>
          <button
            onClick={() => setTimeout(() => setMostrarMiniCarrito((prev) => !prev), 0)}
            className="relative text-white hover:text-amber-400"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-black rounded-full text-xs px-1">
                {totalItems}
              </span>
            )}
          </button>
          {mostrarMiniCarrito && <MiniCart onClose={() => setMostrarMiniCarrito(false)} />}
        </div>
      </div>

      {menuAbierto && (
        <div className="absolute top-full right-0 bg-gray-800 w-64 py-4 px-6 shadow-lg rounded-bl-md space-y-3 flex flex-col items-end sm:hidden z-50">
          <Link to="/productos" onClick={handleLinkClick} className="hover:text-amber-400">
            Productos
          </Link>
          <Link to="/" onClick={handleLinkClick} className="hover:text-amber-400">
            Inicio
          </Link>

          {user && (
            <>
              <Link to="/favoritos" onClick={handleLinkClick} className="hover:text-red-400">
                ❤️ Favoritos ({favoritos.length})
              </Link>

              <div className="w-full flex justify-end">
                <NotificacionesPopover />
              </div>

              <Link to="/panel" onClick={handleLinkClick} className="hover:text-amber-400">
                Perfil
              </Link>

              {["admin", "empleado"].includes(user.rol) && (
                <Link to="/admin" onClick={handleLinkClick} className="hover:text-amber-400">
                  Panel
                </Link>
              )}

              <button
                onClick={() => {
                  cerrarSesion();
                  handleLinkClick();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Cerrar sesión
              </button>
            </>
          )}

          {!user && (
            <button
              onClick={() => {
                setMostrarModal(true);
                handleLinkClick();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
            >
              Iniciar sesión / Registro
            </button>
          )}

          <div className="relative mt-2" ref={carritoRef}>
            <button
              onClick={() => {
                setTimeout(() => setMostrarMiniCarrito((prev) => !prev), 0);
              }}
              className="relative text-white hover:text-amber-400"
            >
              🛒 Carrito
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black rounded-full text-xs px-1">
                  {totalItems}
                </span>
              )}
            </button>
            {mostrarMiniCarrito && <MiniCart onClose={() => setMostrarMiniCarrito(false)} />}
          </div>
        </div>
      )}

      <AuthModal visible={mostrarModal} onClose={() => setMostrarModal(false)} />
    </nav>
  );
}
