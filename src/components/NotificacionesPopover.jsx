import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { FaBell, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function NotificacionesPopover() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [open, setOpen] = useState(false);
  const refPopover = useRef(null);
  const navigate = useNavigate();

  // 📦 Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "usuarios", user.uid, "notificaciones"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotificaciones(lista);
    });

    return () => unsub();
  }, [user]);

  // 🗑️ Eliminar una notificación
  const eliminarNotificacion = async (id) => {
    await deleteDoc(doc(db, "usuarios", user.uid, "notificaciones", id));
  };

  // 🧹 Eliminar todas
  const eliminarTodas = async () => {
    const promesas = notificaciones.map((n) =>
      deleteDoc(doc(db, "usuarios", user.uid, "notificaciones", n.id))
    );
    await Promise.all(promesas);
  };

  // ❌ Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refPopover.current && !refPopover.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={refPopover}>
      <button
        onClick={() => {
          // Evitamos que se cierre inmediatamente por el efecto
          setTimeout(() => setOpen((prev) => !prev), 0);
        }}
        className="relative text-white hover:text-amber-400"
      >
        <FaBell size={22} />
        {notificaciones.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {notificaciones.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <p className="text-amber-400 font-semibold">🔔 Notificaciones</p>
            {notificaciones.length > 0 && (
              <button
                onClick={eliminarTodas}
                className="text-sm text-red-400 hover:underline"
              >
                Borrar todas
              </button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">No hay notificaciones.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {notificaciones.map((n) => (
                <li
                  key={n.id}
                  className="p-3 text-sm text-white flex justify-between hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    if (n.redireccion) {
                      navigate(n.redireccion);
                    }
                  }}
                >
                  <div>
                    <p className="text-white">{n.descripcion || n.titulo}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(n.timestamp?.seconds * 1000).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarNotificacion(n.id);
                    }}
                    className="text-red-400 hover:text-red-600 ml-2"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
