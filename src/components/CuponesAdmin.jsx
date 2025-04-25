import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

export default function CuponesAdmin() {
  const { user } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [descuento, setDescuento] = useState("");
  const [soloUnaVez, setSoloUnaVez] = useState(false);

  const cargarCupones = async () => {
    const snap = await getDocs(collection(db, "cupones"));
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCupones(lista);
  };

  useEffect(() => {
    cargarCupones();
  }, []);

  const registrarLog = async (accion, descripcion) => {
    try {
      await addDoc(collection(db, "logs"), {
        tipo: accion,
        entidad: "cupón",
        descripcion,
        userId: user?.uid,
        userEmail: user?.email,
        userName: user?.nombre || "desconocido",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error al registrar log:", err);
    }
  };

  const crearCupon = async () => {
    if (user?.rol === "empleado") {
      return Swal.fire("❌ No tienes permisos para crear cupones", "", "error");
    }

    if (!codigo || !descuento) return;

    const cuponID = codigo.trim().toUpperCase();

    await setDoc(doc(db, "cupones", cuponID), {
      descuento: Number(descuento),
      activo: true,
      soloUnaVez: soloUnaVez,
    });

    await registrarLog("creación", `Se creó el cupón ${cuponID} con ${descuento}% de descuento`);

    setCodigo("");
    setDescuento("");
    setSoloUnaVez(false);
    cargarCupones();
    Swal.fire("✅ Cupón creado correctamente", "", "success");
  };

  const toggleActivo = async (id, estado) => {
    if (user?.rol === "empleado") {
      return Swal.fire("❌ No puedes activar o desactivar cupones", "", "error");
    }

    await updateDoc(doc(db, "cupones", id), { activo: !estado });
    await registrarLog("actualización", `Se cambió el estado del cupón ${id} a ${!estado ? "activo" : "inactivo"}`);
    cargarCupones();
  };

  const eliminarCupon = async (id) => {
    if (user?.rol === "empleado") {
      return Swal.fire("❌ No puedes eliminar cupones", "", "error");
    }

    const confirm = await Swal.fire({
      title: "¿Eliminar cupón?",
      text: "Esta acción no se puede deshacer y se eliminará de los usuarios que lo hayan usado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "cupones", id));

      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      for (const usuario of usuariosSnap.docs) {
        const usadoRef = doc(db, "usuarios", usuario.id, "cupones_usados", id);
        const usadoSnap = await getDoc(usadoRef);
        if (usadoSnap.exists()) {
          await deleteDoc(usadoRef);
        }
      }

      await registrarLog("eliminación", `Se eliminó el cupón ${id} y sus registros en usuarios`);
      await cargarCupones();
      Swal.fire("✅ Cupón eliminado", "Y también eliminado de los usuarios", "success");
    } catch (err) {
      console.error("Error al eliminar cupón y sus rastros:", err);
      Swal.fire("Error", "No se pudo eliminar completamente el cupón", "error");
    }
  };

  return (
    <div className="text-white p-4 bg-gray-950 min-h-screen">
      <h2 className="text-2xl font-bold text-amber-400 mb-4">🎟️ Gestión de Cupones</h2>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        <input
          type="text"
          placeholder="Código (ej: PROMO10)"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="bg-gray-800 p-2 rounded text-white"
          disabled={user?.rol === "empleado"}
        />
        <input
          type="number"
          placeholder="% Descuento"
          value={descuento}
          onChange={(e) => setDescuento(e.target.value)}
          className="bg-gray-800 p-2 rounded text-white"
          disabled={user?.rol === "empleado"}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloUnaVez}
            onChange={(e) => setSoloUnaVez(e.target.checked)}
            disabled={user?.rol === "empleado"}
          />
          Solo un uso por usuario
        </label>
        <button
          onClick={crearCupon}
          className={`px-4 py-2 rounded ${
            user?.rol === "empleado"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600 text-black"
          }`}
          disabled={user?.rol === "empleado"}
        >
          Crear cupón
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-800 rounded overflow-hidden">
          <thead className="text-amber-300">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-center">Descuento (%)</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center">Tipo</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cupones.map((c) => (
              <tr key={c.id} className="border-t border-gray-700">
                <td className="p-2 font-semibold">{c.id}</td>
                <td className="p-2 text-center">{c.descuento}</td>
                <td className="p-2 text-center">
                  {c.activo ? (
                    <span className="text-green-400 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inactivo</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {c.soloUnaVez ? (
                    <span className="text-yellow-400 text-xs font-semibold">🔒 1 uso por usuario</span>
                  ) : (
                    <span className="text-gray-400 text-xs">♻️ Reutilizable</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {user?.rol === "admin" ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => toggleActivo(c.id, c.activo)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2 py-1 rounded"
                      >
                        {c.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => eliminarCupon(c.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Solo lectura</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
