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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { totalItems } = useCart();
  const { favoritos } = useFavoritos();

  const cerrarSesion = () => {
    signOut(auth);
  };

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center flex-wrap relative z-50">
      <Link to="/" className="text-2xl font-bold text-amber-400">
        VCDProyect
      </Link>

      {/* Botón hamburguesa */}
      <button
        className="block md:hidden text-white text-2xl focus:outline-none"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        ☰
      </button>

      {/* Menú principal con animación */}
      <div
        className={`w-full md:flex md:items-center md:w-auto transition-all duration-300 ease-in-out overflow-hidden ${
          menuAbierto ? "max-h-screen opacity-100" : "max-h-0 opacity-0 md:opacity-100"
        } md:opacity-100 md:max-h-screen`}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center py-4 md:py-0">
          <Link to="/productos" onClick={cerrarMenu} className="hover:text-amber-400">
            Productos
          </Link>
          <Link to="/" onClick={cerrarMenu} className="hover:text-amber-400">
            Inicio
          </Link>

          {user && (
            <div className="relative flex items-center gap-2">
              <Link to="/favoritos" onClick={cerrarMenu} className="hover:text-red-400 relative">
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

          {user?.rol === "admin" && (
            <Link
              to="/admin"
              onClick={cerrarMenu}
              className="bg-amber-600 hover:bg-amber-700 text-black px-3 py-1 rounded"
            >
              Admin
            </Link>
          )}

          {user ? (
            <>
              <Link
                to="/panel"
                onClick={cerrarMenu}
                className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
              >
                Perfil
              </Link>
              <button
                onClick={() => {
                  cerrarSesion();
                  cerrarMenu();
                }}
                className="bg-gray-700 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMostrarModal(true);
                cerrarMenu();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
            >
              Iniciar sesión / Registro
            </button>
          )}

          {/* Carrito 🛒 */}
          <div className="relative">
            <button
              onClick={() => {
                setMostrarMiniCarrito(!mostrarMiniCarrito);
                cerrarMenu();
              }}
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
      </div>

      <AuthModal visible={mostrarModal} onClose={() => setMostrarModal(false)} />
    </nav>
  );
}
