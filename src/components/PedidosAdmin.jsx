// src/components/PedidosAdmin.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { enviarNotificacionEstado } from "../utils/emailService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { enviarNotificacion } from "../utils/notificacionesService";

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleProductos, setDetalleProductos] = useState([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "pedidos"));
        const pedidosConUsuario = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const pedido = { id: docSnap.id, ...docSnap.data() };
            if (pedido.userId) {
              const userDoc = await getDoc(doc(db, "usuarios", pedido.userId));
              pedido.usuario = userDoc.exists()
                ? userDoc.data().nombre || userDoc.data().email
                : "-";
            } else {
              pedido.usuario = pedido.userEmail || "-";
            }
            return pedido;
          })
        );
        setPedidos(pedidosConUsuario);
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
      }
    };
    fetchPedidos();
  }, []);

  const actualizarCampo = async (id, campo, valor) => {
    try {
      const refPedido = doc(db, "pedidos", id);
      await updateDoc(refPedido, { [campo]: valor });

      const pedidoActualizado = pedidos.find((p) => p.id === id);

      if (campo === "estado" && pedidoActualizado?.userId) {
        await addDoc(
          collection(db, "usuarios", pedidoActualizado.userId, "notificaciones"),
          {
            titulo: "📦 Estado de Pedido Actualizado",
            descripcion: `Tu pedido #${id} ha sido actualizado a "${valor}".`,
            mensaje: `Tu pedido #${id} cambió a estado "${valor}".`,
            tipo: "estado",
            leido: false,
            timestamp: serverTimestamp(),
          }
        );
      }

      if (campo === "estado" && pedidoActualizado?.userEmail) {
        await enviarNotificacionEstado({
          email: pedidoActualizado.userEmail,
          nombre: pedidoActualizado.usuario || "cliente",
          estado: valor,
        });

        await enviarNotificacion(
          pedidoActualizado.userId,
          `📦 Tu pedido fue actualizado a "${valor}"`
        );
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
      );
    } catch (error) {
      console.error(`Error al actualizar ${campo} del pedido:`, error);
    }
  };

  const eliminarPedido = async (id) => {
    try {
      await deleteDoc(doc(db, "pedidos", id));
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      alert("🗑️ Pedido eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Pedidos", 10, 10);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Usuario", "Fecha", "Estado", "Método de Pago", "Cupón", "Descuento"]],
      body: pedidos.map((p) => [
        p.id,
        p.usuario || "-",
        p.fecha?.toDate?.().toLocaleString?.() || "-",
        p.estado || "-",
        p.metodoPago || "-",
        p.cuponAplicado || "-",
        `${p.descuento || 0}%`
      ]),
      theme: "grid",
      styles: { fontSize: 10 }
    });
    doc.save("pedidos.pdf");
  };

  const exportarExcel = () => {
    const datos = pedidos.map((p) => ({
      ID: p.id,
      Usuario: p.usuario || "-",
      Fecha: p.fecha?.toDate?.().toLocaleString?.() || "-",
      Estado: p.estado || "-",
      MetodoPago: p.metodoPago || "-",
      Cupon: p.cuponAplicado || "-",
      Descuento: `${p.descuento || 0}%`
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja, "Pedidos");
    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  const estadosEnvio = ["pendiente", "preparado", "entregado"];
  const metodosPago = [
    "pendiente",
    "efectivo",
    "cheque",
    "echeq",
    "transferencia",
    "pagado (MercadoPago)",
  ];

  const pedidosFiltrados = estadoFiltro
    ? pedidos.filter(
        (p) => p.estado === estadoFiltro || p.metodoPago === estadoFiltro
      )
    : pedidos;

  const abrirModalProductos = (items, cupon, descuento) => {
    setDetalleProductos({ items, cupon, descuento });
    setModalVisible(true);
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-400">📦 Gestión de Pedidos</h2>
        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded"
          >
            Exportar PDF
          </button>
          <button
            onClick={exportarExcel}
            className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded"
        >
          <option value="">Todos los estados</option>
          {[...new Set([...estadosEnvio, ...metodosPago])].map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEstadoFiltro("")}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Limpiar Filtro
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-amber-300">
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Método de Pago</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.id} className="border-b border-gray-700">
                <td>{pedido.id}</td>
                <td>{pedido.usuario || "-"}</td>
                <td>{pedido.fecha?.toDate?.().toLocaleString?.() || "-"}</td>
                <td>
                  <button
                    onClick={() =>
                      abrirModalProductos(pedido.items, pedido.cuponAplicado, pedido.descuento)
                    }
                    className="text-amber-300 underline hover:text-amber-400"
                  >
                    {pedido.items?.length || 0} productos
                  </button>
                </td>
                <td>
                  <select
                    value={pedido.estado || ""}
                    onChange={(e) =>
                      actualizarCampo(pedido.id, "estado", e.target.value)
                    }
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    {estadosEnvio.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={pedido.metodoPago || ""}
                    onChange={(e) =>
                      actualizarCampo(pedido.id, "metodoPago", e.target.value)
                    }
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => eliminarPedido(pedido.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-lg w-full relative">
            <h3 className="text-lg text-amber-400 font-semibold mb-4">🧾 Detalle del Pedido</h3>
            <ul className="list-disc list-inside text-sm mb-4 text-white">
              {detalleProductos.items?.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.qty || item.cantidad}
                </li>
              ))}
            </ul>
            {detalleProductos.cupon && (
              <p className="text-green-400 text-sm">
                Cupón aplicado: <strong>{detalleProductos.cupon}</strong> –{" "}
                {detalleProductos.descuento}% OFF
              </p>
            )}
            <button
              onClick={() => setModalVisible(false)}
              className="absolute top-2 right-3 text-white text-xl hover:text-red-500"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
