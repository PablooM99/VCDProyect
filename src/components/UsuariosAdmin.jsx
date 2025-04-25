// src/components/UsuariosAdmin.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

export default function UsuariosAdmin() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const esEmpleado = user?.rol === "empleado";

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const snapshot = await getDocs(collection(db, "usuarios"));
        const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(datos);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  const registrarLog = async ({ tipo, entidad, descripcion }) => {
    try {
      await addDoc(collection(db, "logs"), {
        tipo,
        entidad,
        descripcion,
        userId: user?.uid || "desconocido",
        userEmail: user?.email || "desconocido",
        userName: user?.nombre || "desconocido",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error al registrar log:", err);
    }
  };

  const actualizarUsuario = async (id, campo, valor) => {
    if (esEmpleado) {
      return Swal.fire("❌ No tienes permisos para editar usuarios", "", "error");
    }
    try {
      const ref = doc(db, "usuarios", id);
      await updateDoc(ref, { [campo]: valor });
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, [campo]: valor } : u));

      await registrarLog({
        tipo: "actualización",
        entidad: "usuario",
        descripcion: `Se actualizó el campo '${campo}' del usuario ${id} a '${valor}'`,
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
    }
  };

  const eliminarUsuario = async (id) => {
    if (esEmpleado) {
      return Swal.fire("❌ No tienes permisos para eliminar usuarios", "", "error");
    }

    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "El usuario será eliminado permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No"
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "usuarios", id));
      setUsuarios(prev => prev.filter(u => u.id !== id));
      Swal.fire("✅ Usuario eliminado", "", "success");

      await registrarLog({
        tipo: "eliminación",
        entidad: "usuario",
        descripcion: `Se eliminó el usuario con ID ${id}`,
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      Swal.fire("❌ Error al eliminar usuario", error.message, "error");
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.rol?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h2 className="text-xl font-bold text-amber-400 mb-4">👥 Gestión de Usuarios</h2>

      <input
        type="text"
        placeholder="Buscar por nombre, email o rol..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full mb-4 p-2 bg-gray-700 rounded"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-amber-300">
            <tr>
              <th>Nombre</th><th>Email</th><th>CUIT</th><th>Dirección</th><th>Rol</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(u => (
              <tr key={u.id} className="border-b border-gray-700">
                <td>
                  <input
                    value={u.nombre}
                    onChange={(e) => actualizarUsuario(u.id, "nombre", e.target.value)}
                    className="bg-gray-700 p-1 rounded w-full"
                    disabled={esEmpleado}
                  />
                </td>
                <td className="text-sm text-gray-300">{u.email}</td>
                <td>
                  <input
                    value={u.cuit || ""}
                    onChange={(e) => actualizarUsuario(u.id, "cuit", e.target.value)}
                    className="bg-gray-700 p-1 rounded w-full"
                    disabled={esEmpleado}
                  />
                </td>
                <td>
                  <input
                    value={u.direccion || ""}
                    onChange={(e) => actualizarUsuario(u.id, "direccion", e.target.value)}
                    className="bg-gray-700 p-1 rounded w-full"
                    disabled={esEmpleado}
                  />
                </td>
                <td>
                  <select
                    value={u.rol || "usuario"}
                    onChange={(e) => actualizarUsuario(u.id, "rol", e.target.value)}
                    className="bg-gray-700 p-1 rounded w-full"
                    disabled={esEmpleado}
                  >
                    <option value="usuario">usuario</option>
                    <option value="empleado">empleado</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => eliminarUsuario(u.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    disabled={esEmpleado}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
