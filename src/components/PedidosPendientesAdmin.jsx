// src/components/PedidosPendientesAdmin.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PedidosPendientesAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [orden, setOrden] = useState({ campo: "fecha", asc: false });

  useEffect(() => {
    const cargarDatos = async () => {
      const pedidosSnap = await getDocs(
        query(collection(db, "pedidos"), where("metodoPago", "==", "pendiente"))
      );
      const pedidosList = pedidosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPedidos(pedidosList);

      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const usuariosList = usuariosSnap.docs.map((d) => d.data());
      setUsuarios(usuariosList);
    };

    cargarDatos();
  }, []);

  const pedidosFiltrados = pedidos
    .filter((p) => {
      if (!filtroTexto) return true;
      const usuario = usuarios.find((u) => u.email === p.userEmail);
      const textoUsuario = `${usuario?.nombre || ""} ${usuario?.email || ""}`.toLowerCase();
      return textoUsuario.includes(filtroTexto.toLowerCase());
    })
    .sort((a, b) => {
      if (orden.campo === "total") {
        return orden.asc ? a.total - b.total : b.total - a.total;
      } else if (orden.campo === "fecha") {
        const fechaA = a.fecha?.toDate()?.getTime() || 0;
        const fechaB = b.fecha?.toDate()?.getTime() || 0;
        return orden.asc ? fechaA - fechaB : fechaB - fechaA;
      }
      return 0;
    });

  const generarNombreArchivo = (extension) => {
    if (!filtroTexto) return `pedidos_pendientes.${extension}`;
    const usuario = usuarios.find((u) =>
      `${u.nombre} ${u.email}`.toLowerCase().includes(filtroTexto.toLowerCase())
    );
    const nombreArchivo = usuario?.nombre
      ? `pedidos_pendientes_${usuario.nombre.replace(/\s+/g, "_")}.${extension}`
      : `pedidos_pendientes_filtrados.${extension}`;
    return nombreArchivo;
  };

  const exportarExcel = () => {
    const datos = pedidosFiltrados.map((p) => {
      const usuario = usuarios.find((u) => u.email === p.userEmail);
      const totalSinDescuento = p.total / (1 - (p.descuento || 0) / 100);
      return {
        ID: p.id,
        Usuario: `${usuario?.nombre || ""} (${p.userEmail})`,
        Dirección: p.direccion || "Sin dirección",
        "Total sin descuento": `$${totalSinDescuento.toFixed(2)}`,
        "Cupón aplicado": p.cuponAplicado || "-",
        Total: `$${p.total?.toFixed(2) || 0}`,
        Fecha: p.fecha?.toDate().toLocaleString() || "Sin fecha",
      };
    });

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Pedidos Pendientes");
    XLSX.writeFile(libro, generarNombreArchivo("xlsx"));
  };

  const exportarPDF = () => {
    const docu = new jsPDF();
    docu.setFontSize(14);
    docu.text("Pedidos Pendientes de Pago", 14, 16);

    const filas = pedidosFiltrados.map((p) => {
      const usuario = usuarios.find((u) => u.email === p.userEmail);
      const totalSinDescuento = p.total / (1 - (p.descuento || 0) / 100);
      return [
        p.id,
        `${usuario?.nombre || ""} (${p.userEmail})`,
        p.direccion || "-",
        `$${totalSinDescuento.toFixed(2)}`,
        p.cuponAplicado || "-",
        `$${p.total?.toFixed(2) || 0}`,
        p.fecha?.toDate().toLocaleString() || "-",
      ];
    });

    autoTable(docu, {
      head: [["ID", "Usuario", "Dirección", "Total sin desc.", "Cupón", "Total", "Fecha"]],
      body: filas,
      startY: 20,
    });

    docu.save(generarNombreArchivo("pdf"));
  };

  const cambiarOrden = (campo) => {
    setOrden((prev) => ({
      campo,
      asc: prev.campo === campo ? !prev.asc : true,
    }));
  };

  return (
    <div className="text-white p-4 bg-gray-950 min-h-screen">
      <h2 className="text-2xl font-bold text-amber-400 mb-6">
        🧾 Pedidos Pendientes de Pago
      </h2>

      <div className="mb-4 flex flex-col md:flex-row gap-2 items-center md:items-end md:justify-between">
        <div className="flex flex-col w-full md:w-auto">
          <label className="block mb-1 font-semibold">Filtrar por nombre o email:</label>
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded w-full md:w-80"
            placeholder="Ej: Pablo, montenegro, email..."
          />
        </div>
        <button
          onClick={() => setFiltroTexto("")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mt-2 md:mt-0"
        >
          Limpiar filtro
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📥 Exportar Excel
        </button>
        <button
          onClick={exportarPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          🧾 Exportar PDF
        </button>
        <button
          onClick={() => cambiarOrden("total")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Ordenar por Total {orden.campo === "total" ? (orden.asc ? "↑" : "↓") : ""}
        </button>
        <button
          onClick={() => cambiarOrden("fecha")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Ordenar por Fecha {orden.campo === "fecha" ? (orden.asc ? "↑" : "↓") : ""}
        </button>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p className="text-gray-400">No hay pedidos pendientes para este usuario.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-800 rounded">
            <thead className="text-amber-300">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Usuario</th>
                <th className="p-2 text-left">Dirección</th>
                <th className="p-2 text-right">Total sin desc.</th>
                <th className="p-2 text-left">Cupón</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p) => {
                const usuario = usuarios.find((u) => u.email === p.userEmail);
                const totalSinDescuento = p.total / (1 - (p.descuento || 0) / 100);
                return (
                  <tr key={p.id} className="border-t border-gray-700">
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{`${usuario?.nombre || ""} (${p.userEmail})`}</td>
                    <td className="p-2">{p.direccion}</td>
                    <td className="p-2 text-right">${totalSinDescuento.toFixed(2)}</td>
                    <td className="p-2">{p.cuponAplicado || "-"}</td>
                    <td className="p-2 text-right">${p.total?.toFixed(2)}</td>
                    <td className="p-2">{p.fecha?.toDate().toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
