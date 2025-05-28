// src/components/NotasCreditoAdmin.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { FileText, Eye, Download, PlusCircle } from "lucide-react";

export default function NotasCreditoAdmin() {
  const { user } = useAuth();
  const [notas, setNotas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevaNota, setModalNuevaNota] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [numeroNota, setNumeroNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [detalleNota, setDetalleNota] = useState(null);

  // Cargar notas de crédito
  useEffect(() => {
    async function fetchNotas() {
      const notasRef = collection(db, "notas_credito");
      const q = query(notasRef, orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      setNotas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchNotas();
  }, []);

  // Cargar facturas para selector
  useEffect(() => {
    async function fetchFacturas() {
      const facturasRef = collection(db, "facturas");
      const q = query(facturasRef, orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      setFacturas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchFacturas();
  }, [modalNuevaNota]);

  // Sugerir número automático
  useEffect(() => {
    if (modalNuevaNota) {
      const maxNumero = notas.reduce(
        (acc, n) => (parseInt(n.numero) > acc ? parseInt(n.numero) : acc),
        0
      );
      setNumeroNota(String(maxNumero + 1).padStart(4, "0"));
    }
  }, [modalNuevaNota, notas]);

  // Filtros de búsqueda
  const notasFiltradas = notas.filter(n =>
    (n.numero?.toLowerCase() ?? "").includes(busqueda.toLowerCase()) ||
    (n.clienteNombre?.toLowerCase() ?? "").includes(busqueda.toLowerCase()) ||
    (n.fecha ? new Date(n.fecha.seconds * 1000).toLocaleDateString().includes(busqueda) : false)
  );

  // PDF
  function generarPDF(nota, abrir = false) {
    const docPDF = new jsPDF();
    docPDF.setFontSize(18);
    docPDF.text("NOTA DE CRÉDITO", 14, 18);
    docPDF.setFontSize(12);
    docPDF.text(`N°: ${nota.numero}`, 14, 28);
    docPDF.text(`Fecha: ${new Date(nota.fecha.seconds * 1000).toLocaleDateString()}`, 100, 28);
    docPDF.text(`Cliente: ${nota.clienteNombre}`, 14, 38);
    docPDF.text(`CUIT: ${nota.clienteCUIT}`, 14, 46);
    docPDF.text(`Dirección: ${nota.clienteDireccion}`, 14, 54);
    docPDF.text(`Factura asociada: ${nota.facturaId}`, 14, 62);
    docPDF.text("Productos:", 14, 72);
    autoTable(docPDF, {
      startY: 76,
      head: [["Producto", "Cantidad", "Precio"]],
      body: nota.productos.map(p => [p.titulo, p.cantidad, `$${p.precio.toFixed(2)}`]),
    });
    docPDF.text(`Total: $${nota.total.toFixed(2)}`, 14, docPDF.lastAutoTable.finalY + 10);
    docPDF.text(`Motivo: ${nota.motivo}`, 14, docPDF.lastAutoTable.finalY + 18);
    docPDF.text(`Emitido por: ${nota.adminNombre || ""}`, 14, docPDF.lastAutoTable.finalY + 26);

    if (abrir) window.open(docPDF.output("bloburl"));
    else docPDF.save(`NotaCredito-${nota.numero}.pdf`);
  }

  // Crear nueva nota
  async function handleCrearNota() {
    if (!facturaSeleccionada || !motivo.trim()) {
      Swal.fire("Campos incompletos", "Seleccioná una factura y el motivo.", "warning");
      return;
    }
    setLoading(true);
    const factura = facturaSeleccionada;
    const nuevaNota = {
      numero: numeroNota,
      fecha: serverTimestamp(),
      motivo,
      facturaId: factura.id,
      clienteNombre: factura.clienteNombre,
      clienteCUIT: factura.clienteCUIT,
      clienteDireccion: factura.clienteDireccion,
      total: factura.total,
      productos: factura.productos,
      adminId: user.uid,
      adminNombre: user.displayName || user.email,
    };
    const docRef = await addDoc(collection(db, "notas_credito"), nuevaNota);
    setLoading(false);
    Swal.fire("¡Nota de crédito creada!", "", "success");
    setNotas([{ id: docRef.id, ...nuevaNota, fecha: new Date() }, ...notas]);
    setModalNuevaNota(false);
    setFacturaSeleccionada(null);
    setMotivo("");
    setNumeroNota("");
  }

  return (
    <div className="bg-gray-900 p-4 rounded min-h-[650px] border border-gray-800">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-200 flex items-center gap-2 mb-1">
            <FileText size={28} className="text-blue-400" /> Notas de Crédito
          </h2>
          <p className="text-gray-400">Historial y generación de notas de crédito</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl px-5 py-2 shadow transition"
          onClick={() => setModalNuevaNota(true)}
        >
          <PlusCircle size={18} /> Nueva Nota de Crédito
        </button>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          className="border border-gray-700 bg-gray-800 text-white px-3 py-2 rounded-xl w-full sm:w-80 shadow focus:outline-amber-300 placeholder-gray-400"
          placeholder="Buscar por número, cliente o fecha"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl shadow mb-10 bg-gray-900">
        <table className="min-w-full text-sm bg-gray-900 text-white rounded">
          <thead className="bg-gray-800 text-amber-300">
            <tr>
              <th className="p-3 text-left font-bold">Número</th>
              <th className="p-3 text-left font-bold">Fecha</th>
              <th className="p-3 text-left font-bold">Cliente</th>
              <th className="p-3 text-left font-bold">Motivo</th>
              <th className="p-3 text-left font-bold">Factura</th>
              <th className="p-3 text-right font-bold">Total</th>
              <th className="p-3 text-center font-bold">PDF</th>
              <th className="p-3 text-center font-bold">Ver</th>
            </tr>
          </thead>
          <tbody>
            {notasFiltradas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">No hay notas de crédito encontradas.</td>
              </tr>
            )}
            {notasFiltradas.map((nota, idx) => (
              <tr key={nota.id} className={idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}>
                <td className="p-3">{nota.numero}</td>
                <td className="p-3">
                  {nota.fecha
                    ? new Date(
                        nota.fecha.seconds
                          ? nota.fecha.seconds * 1000
                          : nota.fecha
                      ).toLocaleDateString()
                    : "-"}
                </td>
                <td className="p-3">{nota.clienteNombre}</td>
                <td className="p-3 truncate max-w-xs">{nota.motivo}</td>
                <td className="p-3">{nota.facturaId}</td>
                <td className="p-3 text-right font-semibold text-green-400">${nota.total?.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg shadow flex mx-auto"
                    onClick={() => generarPDF(nota)}
                  >
                    <Download size={15} />
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    className="text-blue-300 hover:text-blue-400 transition underline flex mx-auto"
                    onClick={() => setDetalleNota(nota)}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVA NOTA */}
      {modalNuevaNota && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-red-400 text-xl"
              onClick={() => setModalNuevaNota(false)}
            >
              ✖
            </button>
            <h3 className="text-xl font-bold mb-4 text-amber-300 flex items-center gap-2">
              <PlusCircle /> Nueva Nota de Crédito
            </h3>
            <div className="mb-3">
              <label className="font-semibold mb-1 block text-gray-200">Seleccionar Factura:</label>
              <select
                className="border rounded-xl px-3 py-2 w-full bg-gray-800 text-white shadow focus:outline-amber-300"
                value={facturaSeleccionada?.id || ""}
                onChange={e => {
                  const factura = facturas.find(f => f.id === e.target.value);
                  setFacturaSeleccionada(factura);
                }}
              >
                <option value="">-- Seleccioná una factura --</option>
                {facturas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.numero} - {f.clienteNombre} - {new Date(f.fecha.seconds * 1000).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            {facturaSeleccionada && (
              <div className="border border-amber-200 p-3 mb-3 rounded-xl bg-gray-800">
                <div>
                  <b className="text-gray-200">Cliente:</b> {facturaSeleccionada.clienteNombre} | <b>CUIT:</b> {facturaSeleccionada.clienteCUIT}
                </div>
                <div>
                  <b className="text-gray-200">Dirección:</b> {facturaSeleccionada.clienteDireccion}
                </div>
                <div>
                  <b className="text-gray-200">Total:</b> <span className="text-green-400 font-semibold">${facturaSeleccionada.total?.toFixed(2)}</span>
                </div>
                <div>
                  <b className="text-gray-200">Productos:</b>
                  <ul className="list-disc ml-7 mt-1 text-sm text-gray-300">
                    {facturaSeleccionada.productos.map((p, i) => (
                      <li key={i}>
                        {p.titulo} (x{p.cantidad}) - ${p.precio.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="font-semibold mb-1 block text-gray-200">Número de Nota:</label>
              <input
                className="border rounded-xl px-3 py-2 w-full bg-gray-800 text-white shadow focus:outline-amber-300"
                value={numeroNota}
                onChange={e => setNumeroNota(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="font-semibold mb-1 block text-gray-200">Motivo:</label>
              <textarea
                className="border rounded-xl px-3 py-2 w-full bg-gray-800 text-white shadow focus:outline-amber-300 min-h-[60px]"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-2 font-semibold shadow"
                onClick={handleCrearNota}
                disabled={loading}
              >
                {loading ? "Generando..." : "Generar Nota de Crédito"}
              </button>
              <button
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-2xl px-4 py-2 shadow"
                onClick={() => setModalNuevaNota(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE NOTA */}
      {detalleNota && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-red-400 text-xl"
              onClick={() => setDetalleNota(null)}
            >
              ✖
            </button>
            <h3 className="text-xl font-bold mb-3 text-blue-300 flex items-center gap-2">
              <Eye size={22} /> Detalle Nota de Crédito N° {detalleNota.numero}
            </h3>
            <div className="mb-2"><b className="text-gray-200">Fecha:</b>{" "}
              {detalleNota.fecha
                ? new Date(
                    detalleNota.fecha.seconds
                      ? detalleNota.fecha.seconds * 1000
                      : detalleNota.fecha
                  ).toLocaleDateString()
                : "-"}
            </div>
            <div className="mb-2"><b className="text-gray-200">Cliente:</b> {detalleNota.clienteNombre}</div>
            <div className="mb-2"><b className="text-gray-200">CUIT:</b> {detalleNota.clienteCUIT}</div>
            <div className="mb-2"><b className="text-gray-200">Dirección:</b> {detalleNota.clienteDireccion}</div>
            <div className="mb-2"><b className="text-gray-200">Factura asociada:</b> {detalleNota.facturaId}</div>
            <div className="mb-2"><b className="text-gray-200">Motivo:</b> {detalleNota.motivo}</div>
            <div className="mb-2"><b className="text-gray-200">Total:</b> <span className="text-green-400 font-semibold">${detalleNota.total?.toFixed(2)}</span></div>
            <div>
              <b className="text-gray-200">Productos:</b>
              <ul className="list-disc ml-7 mt-1 text-sm text-gray-300">
                {detalleNota.productos.map((p, i) => (
                  <li key={i}>
                    {p.titulo} (x{p.cantidad}) - ${p.precio.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-2xl shadow flex items-center gap-2"
              onClick={() => generarPDF(detalleNota)}
            >
              <Download size={18} /> Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
