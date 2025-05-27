// src/components/RemitosAdmin.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RemitosAdmin() {
  const [remitos, setRemitos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalDetalle, setModalDetalle] = useState(null);

  const [remitoData, setRemitoData] = useState({
    pedidoId: "",
    receptor: "",
    direccion: "",
    numeroRemito: "",
  });

  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  // Cargar remitos y pedidos al iniciar
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const remSnap = await getDocs(collection(db, "remitos"));
        const remList = remSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRemitos(remList);
        setFiltrados(remList);

        const pedSnap = await getDocs(collection(db, "pedidos"));
        const pedList = pedSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPedidosDisponibles(pedList);

        const contadorSnap = await getDoc(doc(db, "facturacion", "contador"));
        let nro = 1;
        if (contadorSnap.exists()) {
          const data = contadorSnap.data();
          nro = (data?.remito || 0) + 1;
        }
        const formateado = nro.toString().padStart(4, "0");
        setRemitoData((prev) => ({ ...prev, numeroRemito: `R-${formateado}` }));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    cargarTodo();
  }, []);

  // Crear y guardar remito
  const generarRemito = async () => {
    if (!remitoData.pedidoId || !remitoData.receptor || !remitoData.direccion) {
      Swal.fire("Campos incompletos", "Debes completar todos los datos del remito.", "warning");
      return;
    }

    const docRef = await addDoc(collection(db, "remitos"), {
      ...remitoData,
      fecha: serverTimestamp(),
      items: pedidoSeleccionado?.items || [],
    });

    await updateDoc(doc(db, "facturacion", "contador"), {
      remito: parseInt(remitoData.numeroRemito.split("-")[1]),
    });

    descargarPDF({
      ...remitoData,
      items: pedidoSeleccionado?.items || [],
      fecha: new Date(),
    });

    Swal.fire("✅ Remito generado", "Se guardó y descargó correctamente.", "success");

    setRemitoData({
      pedidoId: "",
      receptor: "",
      direccion: "",
      numeroRemito: "",
    });
    setPedidoSeleccionado(null);
  };

  const descargarPDF = (remito) => {
    const docPDF = new jsPDF();
    const ancho = docPDF.internal.pageSize.getWidth();

    docPDF.setFontSize(18);
    docPDF.setFont("helvetica", "bold");
    docPDF.text("VCD Proyect", 10, 15);

    docPDF.setFontSize(10);
    docPDF.setFont("helvetica", "normal");
    docPDF.text("Dirección: Calle Ficticia 123 - Ciudad", 10, 22);
    docPDF.text("Tel: 223-456-7890 | Email: contacto@vcdproyect.com", 10, 27);
    docPDF.text(`Fecha: ${new Date().toLocaleDateString()}`, ancho - 60, 15);

    docPDF.setFontSize(12);
    docPDF.text(`Remito N°: ${remito.numeroRemito}`, 10, 38);
    docPDF.text(`Receptor: ${remito.receptor}`, 10, 45);
    docPDF.text(`Dirección: ${remito.direccion}`, 10, 52);

    autoTable(docPDF, {
      startY: 60,
      head: [["Producto", "Cantidad"]],
      body: (remito.items || []).map((item) => [item.title, item.cantidad]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 204, 0] },
      margin: { left: 10, right: 10 },
    });

    const finalY = docPDF.lastAutoTable.finalY || 100;
    docPDF.text("Firma del receptor: __________________________", 10, finalY + 20);

    docPDF.setFontSize(10);
    docPDF.setFont("helvetica", "italic");
    docPDF.text("Observaciones:", 10, finalY + 35);
    docPDF.setFont("helvetica", "normal");
    docPDF.text(
      "Este remito no reemplaza la factura. La mercadería fue entregada según lo solicitado.",
      10,
      finalY + 40
    );

    docPDF.setFontSize(8);
    docPDF.setTextColor(120);
    docPDF.text(
      "VCD Proyect – Sistema de gestión © Todos los derechos reservados.",
      10,
      docPDF.internal.pageSize.getHeight() - 10
    );

    docPDF.save(`${remito.numeroRemito}.pdf`);
  };

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700">
      <h2 className="text-xl font-bold text-amber-400 mb-4">📦 Generar Remito</h2>

      <label className="block mb-1 text-sm">Seleccionar pedido:</label>
      <select
        value={remitoData.pedidoId}
        onChange={(e) => {
          const id = e.target.value;
          const pedido = pedidosDisponibles.find((p) => p.id === id);
          setRemitoData((prev) => ({
            ...prev,
            pedidoId: id,
            receptor: pedido.usuario || pedido.userEmail || "",
            direccion: pedido.direccion || "",
          }));
          setPedidoSeleccionado(pedido);
        }}
        className="w-full mb-3 p-2 bg-gray-700 text-white rounded"
      >
        <option value="">Seleccionar...</option>
        {pedidosDisponibles.map((p) => (
          <option key={p.id} value={p.id}>
            #{p.id} - {p.usuario || p.userEmail}
          </option>
        ))}
      </select>

      <label className="block mb-1 text-sm">Receptor:</label>
      <input
        value={remitoData.receptor}
        onChange={(e) => setRemitoData({ ...remitoData, receptor: e.target.value })}
        className="w-full mb-3 p-2 bg-gray-700 text-white rounded"
      />

      <label className="block mb-1 text-sm">Dirección de entrega:</label>
      <input
        value={remitoData.direccion}
        onChange={(e) => setRemitoData({ ...remitoData, direccion: e.target.value })}
        className="w-full mb-3 p-2 bg-gray-700 text-white rounded"
      />

      <label className="block mb-1 text-sm">Número de Remito:</label>
      <input
        value={remitoData.numeroRemito}
        onChange={(e) => setRemitoData({ ...remitoData, numeroRemito: e.target.value })}
        className="w-full mb-4 p-2 bg-gray-700 text-white rounded"
      />

      <button
        onClick={generarRemito}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-6"
      >
        📄 Generar y Descargar Remito
      </button>

      <hr className="border-gray-600 my-4" />
      <h3 className="text-lg font-bold text-amber-400 mb-2">📄 Remitos generados</h3>

      <input
        type="text"
        placeholder="🔍 Buscar por número, cliente o fecha"
        value={busqueda}
        onChange={(e) => {
          const valor = e.target.value.toLowerCase();
          setBusqueda(valor);
          const filtrados = remitos.filter((r) => {
            const fecha = r.fecha?.toDate?.().toLocaleDateString?.() || "";
            return (
              r.numeroRemito?.toLowerCase().includes(valor) ||
              r.receptor?.toLowerCase().includes(valor) ||
              fecha.toLowerCase().includes(valor)
            );
          });
          setFiltrados(filtrados);
        }}
        className="w-full mb-3 p-2 bg-gray-700 text-white rounded"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-800 text-white rounded">
          <thead className="bg-gray-700 text-amber-300">
            <tr>
              <th className="p-2">N°</th>
              <th className="p-2">Receptor</th>
              <th className="p-2">Dirección</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((remito) => (
              <tr key={remito.id} className="border-b border-gray-700">
                <td className="p-2">{remito.numeroRemito}</td>
                <td className="p-2">{remito.receptor}</td>
                <td className="p-2">{remito.direccion}</td>
                <td className="p-2">{remito.fecha?.toDate?.().toLocaleDateString?.() || "-"}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => setModalDetalle(remito)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                  >
                    🔍 Ver
                  </button>
                  <button
                    onClick={() => descargarPDF(remito)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg relative">
            <h3 className="text-xl text-amber-400 font-bold mb-4">📋 Detalle del Remito</h3>
            <p><strong>Número:</strong> {modalDetalle.numeroRemito}</p>
            <p><strong>Receptor:</strong> {modalDetalle.receptor}</p>
            <p><strong>Dirección:</strong> {modalDetalle.direccion}</p>
            <p><strong>Fecha:</strong> {modalDetalle.fecha?.toDate?.().toLocaleDateString?.() || "-"}</p>

            <h4 className="mt-4 font-semibold text-white">📦 Productos:</h4>
            <ul className="text-sm text-gray-300 list-disc pl-4 mb-4">
              {modalDetalle.items?.map((p, idx) => (
                <li key={idx}>{p.title} x{p.cantidad}</li>
              ))}
            </ul>

            <button
              onClick={() => setModalDetalle(null)}
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
