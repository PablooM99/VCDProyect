import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Swal from "sweetalert2";

export default function CuponesAdmin() {
  const [cupones, setCupones] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [descuento, setDescuento] = useState("");
  const [soloUnaVez, setSoloUnaVez] = useState(false); // ✅ NUEVO

  const cargarCupones = async () => {
    const snap = await getDocs(collection(db, "cupones"));
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCupones(lista);
  };

  useEffect(() => {
    cargarCupones();
  }, []);

  const crearCupon = async () => {
    if (!codigo || !descuento) return;

    const cuponID = codigo.trim().toUpperCase();

    await setDoc(doc(db, "cupones", cuponID), {
      descuento: Number(descuento),
      activo: true,
      soloUnaVez: soloUnaVez, // ✅ Guardar en Firestore
    });

    setCodigo("");
    setDescuento("");
    setSoloUnaVez(false); // ✅ Reiniciar casilla
    cargarCupones();
    Swal.fire("✅ Cupón creado correctamente", "", "success");
  };

  const toggleActivo = async (id, estado) => {
    await updateDoc(doc(db, "cupones", id), { activo: !estado });
    cargarCupones();
  };

  const eliminarCupon = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar cupón?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirm.isConfirmed) return;

    await deleteDoc(doc(db, "cupones", id));
    cargarCupones();
    Swal.fire("✅ Cupón eliminado", "", "success");
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
        />
        <input
          type="number"
          placeholder="% Descuento"
          value={descuento}
          onChange={(e) => setDescuento(e.target.value)}
          className="bg-gray-800 p-2 rounded text-white"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloUnaVez}
            onChange={(e) => setSoloUnaVez(e.target.checked)}
          />
          Solo un uso por usuario
        </label>
        <button
          onClick={crearCupon}
          className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded"
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
                <td className="p-2 flex gap-2 justify-center">
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
                </td>
                {c.soloUnaVez && c.usadoPor?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td colSpan="4" className="p-2 text-sm text-gray-300">
                      <strong className="text-amber-400">Usado por:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {c.usadoPor.map((u, idx) => (
                          <li key={idx}>
                            {u.nombre} ({u.id})
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
