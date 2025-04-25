// src/components/DescuentosCantidadAdmin.jsx
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Swal from "sweetalert2";

export default function DescuentosCantidadAdmin() {
  const [productos, setProductos] = useState([]);
  const [productoBuscado, setProductoBuscado] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [cantidadMinima, setCantidadMinima] = useState("");
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("");
  const [descuentos, setDescuentos] = useState([]);

  useEffect(() => {
    const obtenerProductos = async () => {
      const snap = await getDocs(collection(db, "productos"));
      const productosBD = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosBD);
    };

    const obtenerDescuentos = async () => {
      const snap = await getDocs(collection(db, "descuentosPorCantidad"));
      const descuentosBD = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDescuentos(descuentosBD);
    };

    obtenerProductos();
    obtenerDescuentos();
  }, []);

  useEffect(() => {
    const texto = busquedaProducto.trim().toLowerCase();
    const palabras = texto.split(" ").filter(Boolean);

    const encontrado = productos.find((p) => {
      const titulo = p.title.toLowerCase();
      return palabras.every((palabra) => titulo.includes(palabra));
    });

    setProductoBuscado(encontrado || null);
  }, [busquedaProducto, productos]);

  const guardarDescuento = async () => {
    if (!productoBuscado || !cantidadMinima || !porcentajeDescuento) {
      return Swal.fire("Campos incompletos", "Completa todos los campos", "warning");
    }

    try {
      await addDoc(collection(db, "descuentosPorCantidad"), {
        productoId: productoBuscado.id,
        cantidadMinima: parseInt(cantidadMinima),
        descuento: parseInt(porcentajeDescuento),
      });

      Swal.fire("Descuento guardado", "El descuento fue creado exitosamente", "success");
      setCantidadMinima("");
      setPorcentajeDescuento("");
      setBusquedaProducto("");
      setProductoBuscado(null);

      const snap = await getDocs(collection(db, "descuentosPorCantidad"));
      const descuentosBD = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDescuentos(descuentosBD);
    } catch (err) {
      console.error("Error al guardar descuento:", err);
      Swal.fire("Error", "No se pudo guardar el descuento", "error");
    }
  };

  const eliminarDescuento = async (id) => {
    try {
      await deleteDoc(doc(db, "descuentosPorCantidad", id));
      setDescuentos((prev) => prev.filter((d) => d.id !== id));
      Swal.fire("Eliminado", "El descuento fue eliminado", "success");
    } catch (err) {
      console.error("Error al eliminar descuento:", err);
      Swal.fire("Error", "No se pudo eliminar el descuento", "error");
    }
  };

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h2 className="text-2xl text-amber-400 font-bold mb-4">📉 Descuentos por Cantidad</h2>

      <div className="bg-gray-800 p-4 rounded mb-6">
        <h3 className="text-lg font-semibold mb-4">➕ Agregar nuevo descuento</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Buscar producto por título o ID..."
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            className="bg-gray-700 p-2 rounded text-white"
          />

          {productoBuscado && (
            <div className="bg-gray-700 p-3 rounded">
              <p className="text-white font-bold">{productoBuscado.title}</p>
              <p className="text-sm">💲 Precio: ${productoBuscado.price}</p>
              {productoBuscado.imageURLs?.[0] && (
                <img
                  src={productoBuscado.imageURLs[0]}
                  alt={productoBuscado.title}
                  className="w-24 mt-2 rounded"
                />
              )}
            </div>
          )}

          <input
            type="number"
            placeholder="Cantidad mínima"
            value={cantidadMinima}
            onChange={(e) => setCantidadMinima(e.target.value)}
            className="bg-gray-700 p-2 rounded text-white"
          />

          <input
            type="number"
            placeholder="Descuento (%)"
            value={porcentajeDescuento}
            onChange={(e) => setPorcentajeDescuento(e.target.value)}
            className="bg-gray-700 p-2 rounded text-white"
          />

          <button
            onClick={guardarDescuento}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Guardar Descuento
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">📋 Descuentos Actuales</h3>
        {descuentos.length === 0 ? (
          <p className="text-gray-400">No hay descuentos configurados.</p>
        ) : (
          <ul className="space-y-2">
            {descuentos.map((d) => {
              const producto = productos.find((p) => p.id === d.productoId);
              return (
                <li
                  key={d.id}
                  className="bg-gray-700 p-3 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{producto?.title || "Producto eliminado"}</p>
                    <p className="text-sm text-gray-300">
                      Desde {d.cantidadMinima} unidades - {d.descuento}% OFF
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarDescuento(d.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
