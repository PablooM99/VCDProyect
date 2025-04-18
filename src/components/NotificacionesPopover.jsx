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

export default function NotificacionesPopover() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [open, setOpen] = useState(false);
  const refPop = useRef();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "usuarios", user.uid, "notificaciones"),
      orderBy("fecha", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotificaciones(lista);
    });

    return () => unsub();
  }, [user]);

  const eliminarNotificacion = async (id) => {
    await deleteDoc(doc(db, "usuarios", user.uid, "notificaciones", id));
  };

  const eliminarTodas = async () => {
    const promises = notificaciones.map((n) =>
      deleteDoc(doc(db, "usuarios", user.uid, "notificaciones", n.id))
    );
    await Promise.all(promises);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refPop.current && !refPop.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={refPop}>
      <button
        onClick={() => setOpen(!open)}
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
                <li key={n.id} className="p-3 text-sm text-white flex justify-between">
                  <div>
                    <p className="text-white">{n.mensaje}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(n.fecha?.seconds * 1000).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarNotificacion(n.id)}
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
