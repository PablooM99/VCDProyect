// src/components/LogsAdmin.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export default function LogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    const cargarLogs = async () => {
      try {
        const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLogs(data);
      } catch (error) {
        console.error("Error al cargar logs:", error);
      }
    };

    cargarLogs();
  }, []);

  const logsFiltrados = logs.filter((log) => {
    const coincideUsuario =
      filtroUsuario.trim() === "" ||
      log.userEmail?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      log.userName?.toLowerCase().includes(filtroUsuario.toLowerCase());
    const coincideTipo =
      filtroTipo.trim() === "" || log.tipo?.toLowerCase() === filtroTipo.toLowerCase();
    return coincideUsuario && coincideTipo;
  });

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h2 className="text-2xl font-bold text-amber-400 mb-4">📋 Registro de Actividades</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar por usuario o email..."
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
          className="bg-gray-700 px-3 py-2 rounded w-72"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-gray-700 px-3 py-2 rounded"
        >
          <option value="">Todos los tipos</option>
          <option value="creación">Creación</option>
          <option value="actualización">Actualización</option>
          <option value="eliminación">Eliminación</option>
        </select>
        <button
          onClick={() => {
            setFiltroUsuario("");
            setFiltroTipo("");
          }}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-900 rounded">
          <thead className="text-amber-300">
            <tr>
              <th className="p-2">Fecha</th>
              <th className="p-2">Usuario</th>
              <th className="p-2">Email</th>
              <th className="p-2">Acción</th>
              <th className="p-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logsFiltrados.map((log) => (
              <tr key={log.id} className="border-t border-gray-700">
                <td className="p-2">
                  {log.timestamp?.toDate?.().toLocaleString() || "-"}
                </td>
                <td className="p-2">{log.userName || "-"}</td>
                <td className="p-2">{log.userEmail || "-"}</td>
                <td className="p-2 capitalize">{log.tipo || "-"}</td>
                <td className="p-2 text-gray-300">{log.descripcion || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
