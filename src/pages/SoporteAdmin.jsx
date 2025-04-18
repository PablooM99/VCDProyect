// src/pages/SoporteAdmin.jsx
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export default function SoporteAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  useEffect(() => {
    const cargarUsuarios = async () => {
      const snap = await getDocs(collection(db, "usuarios"));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    };
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (!usuarioSeleccionado) return;

    const ref = collection(
      db,
      "soporte",
      usuarioSeleccionado.id,
      "mensajes"
    );
    const q = query(ref, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMensajes(datos);
    });

    return () => unsub();
  }, [usuarioSeleccionado]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !usuarioSeleccionado) return;

    const mensaje = {
      mensaje: nuevoMensaje,
      remitente: "admin",
      leido: false,
      timestamp: serverTimestamp(),
    };

    const id = Date.now().toString();

    await setDoc(
      doc(db, "soporte", usuarioSeleccionado.id, "mensajes", id),
      mensaje
    );

    toast.success("Mensaje enviado al usuario");
    setNuevoMensaje("");
  };

  const borrarMensaje = async (msgId) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar este mensaje?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed && usuarioSeleccionado) {
      try {
        await deleteDoc(
          doc(db, "soporte", usuarioSeleccionado.id, "mensajes", msgId)
        );
        toast.success("🗑️ Mensaje eliminado");
      } catch (error) {
        console.error("Error al borrar mensaje:", error);
        toast.error("❌ No se pudo eliminar el mensaje");
      }
    }
  };

  const borrarConversacion = async () => {
    const confirm = await Swal.fire({
      title: "¿Eliminar toda la conversación?",
      text: "Se borrarán todos los mensajes del chat con este usuario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar todo",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed && usuarioSeleccionado) {
      try {
        const snap = await getDocs(
          collection(db, "soporte", usuarioSeleccionado.id, "mensajes")
        );
        const batch = snap.docs.map((docu) =>
          deleteDoc(doc(db, "soporte", usuarioSeleccionado.id, "mensajes", docu.id))
        );
        await Promise.all(batch);
        toast.success("🧹 Conversación eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar la conversación:", error);
        toast.error("❌ No se pudo eliminar la conversación");
      }
    }
  };

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">📨 Soporte a Usuarios</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de usuarios */}
        <div className="bg-gray-900 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 text-amber-300">Usuarios con cuenta</h2>
          <ul className="space-y-2 max-h-[400px] overflow-auto">
            {usuarios.map((u) => (
              <li
                key={u.id}
                onClick={() => setUsuarioSeleccionado(u)}
                className={`cursor-pointer p-2 rounded ${
                  usuarioSeleccionado?.id === u.id
                    ? "bg-amber-500 text-black"
                    : "bg-gray-800"
                }`}
              >
                {u.nombre || u.email}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat de soporte */}
        {usuarioSeleccionado && (
          <div className="md:col-span-2 bg-gray-900 p-4 rounded shadow flex flex-col">
            <h3 className="text-lg font-bold text-amber-300 mb-2">
              🧑‍💬 Conversación con: {usuarioSeleccionado.nombre || usuarioSeleccionado.email}
            </h3>

            <div className="flex-1 overflow-y-auto max-h-[400px] mb-4 space-y-2">
              {mensajes.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`relative p-2 rounded max-w-[70%] ${
                    msg.remitente === "admin"
                      ? "bg-amber-600 text-black self-end ml-auto"
                      : "bg-gray-700 text-white self-start mr-auto"
                  }`}
                >
                  <p className="text-sm">{msg.mensaje}</p>
                  <button
                    onClick={() => borrarMensaje(msg.id)}
                    className="absolute top-1 right-1 text-xs text-red-400 hover:text-red-300"
                    title="Eliminar mensaje"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-800 text-white"
                placeholder="Escribir mensaje..."
              />
              <button
                onClick={enviarMensaje}
                className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-black font-semibold"
              >
                Enviar
              </button>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={borrarConversacion}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                🧹 Borrar conversación completa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
