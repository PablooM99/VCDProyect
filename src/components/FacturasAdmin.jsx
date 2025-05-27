// src/components/FacturasAdmin.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

export default function FacturasAdmin() {
  const { userData } = useAuth();
  const isAdmin = userData?.rol === "admin";

  const [facturas, setFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productoBuscado, setProductoBuscado] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [remitos, setRemitos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [modo, setModo] = useState("manual");
  const [mensajeOrigen, setMensajeOrigen] = useState("");

  const [facturaData, setFacturaData] = useState({
    numeroFactura: "",
    clienteNombre: "",
    clienteCUIT: "",
    clienteDireccion: "",
    productos: [],
    descuento: 0,
    origen: "",
    origenId: "",
    cupon: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [facturasSnap, productosSnap, pedidosSnap, remitosSnap] = await Promise.all([
        getDocs(collection(db, "facturas")),
        getDocs(collection(db, "productos")),
        getDocs(collection(db, "pedidos")),
        getDocs(collection(db, "remitos")),
      ]);

      setFacturas(facturasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setFacturasFiltradas(facturasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setProductosDisponibles(productosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setPedidos(pedidosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setRemitos(remitosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const contadorSnap = await getDoc(doc(db, "facturacion", "contador"));
      const nro = (contadorSnap.exists() ? contadorSnap.data().factura : 0) + 1;
      const formateado = nro.toString().padStart(4, "0");
      setFacturaData((prev) => ({ ...prev, numeroFactura: `F-${formateado}` }));
    };

    fetchData();
  }, []);
  const validarCupon = async () => {
    if (!facturaData.cupon) return;

    try {
      const ref = doc(db, "cupones", facturaData.cupon.toUpperCase());
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return Swal.fire("❌ Cupón no válido", "Verificá el código ingresado.", "error");
      }

      const cupon = snap.data();
      if (!cupon.activo) {
        return Swal.fire("⚠️ Cupón inactivo", "Este cupón no se encuentra habilitado.", "warning");
      }

      setFacturaData((prev) => ({
        ...prev,
        descuento: cupon.descuento || 0,
      }));

      Swal.fire("✅ Cupón aplicado", `Se aplicó un descuento de ${cupon.descuento}%`, "success");
    } catch (error) {
      console.error("Error al validar cupón:", error);
    }
  };

  const agregarProductoManual = () => {
    if (!productoSeleccionado || cantidadProducto <= 0) {
      return Swal.fire("Error", "Selecciona un producto y cantidad válida", "warning");
    }

    const existe = facturaData.productos.find((p) => p.id === productoSeleccionado.id);
    if (existe) {
      const actualizados = facturaData.productos.map((p) =>
        p.id === productoSeleccionado.id ? { ...p, cantidad: p.cantidad + cantidadProducto } : p
      );
      setFacturaData((prev) => ({ ...prev, productos: actualizados }));
    } else {
      setFacturaData((prev) => ({
        ...prev,
        productos: [
          ...prev.productos,
          {
            id: productoSeleccionado.id,
            title: productoSeleccionado.title,
            price: productoSeleccionado.precioVenta ?? productoSeleccionado.price ?? 0,
            cantidad: cantidadProducto,
          },
        ],
      }));
    }

    setProductoBuscado("");
    setProductoSeleccionado(null);
    setCantidadProducto(1);
  };

  const handleGenerarFactura = async () => {
    const { clienteNombre, clienteCUIT, clienteDireccion, productos, descuento, numeroFactura } = facturaData;
    if (!clienteNombre || !clienteCUIT || !clienteDireccion || productos.length === 0) {
      Swal.fire("Faltan datos", "Completa todos los campos", "error");
      return;
    }

    const total = productos.reduce((sum, p) => sum + p.price * p.cantidad, 0);
    const totalConDescuento = total * (1 - descuento / 100);

    await addDoc(collection(db, "facturas"), {
      ...facturaData,
      total: parseFloat(totalConDescuento.toFixed(2)),
      fecha: serverTimestamp(),
    });

    await updateDoc(doc(db, "facturacion", "contador"), {
      factura: parseInt(numeroFactura.split("-")[1]),
    });

    const docPDF = new jsPDF();
    const ancho = docPDF.internal.pageSize.getWidth();

    docPDF.setFont("helvetica", "bold");
    docPDF.setFontSize(18);
    docPDF.text("VCD Proyect", 10, 15);
    docPDF.setFontSize(10);
    docPDF.setFont("helvetica", "normal");
    docPDF.text("Dirección: Calle Ficticia 123", 10, 22);
    docPDF.text("Tel: 223-456-7890", 10, 27);
    docPDF.text(`Fecha: ${new Date().toLocaleDateString()}`, ancho - 60, 15);
    docPDF.setFontSize(12);
    docPDF.text(`Factura N°: ${numeroFactura}`, 10, 38);
    docPDF.text(`Cliente: ${clienteNombre}`, 10, 45);
    docPDF.text(`CUIT: ${clienteCUIT}`, 10, 52);
    docPDF.text(`Dirección: ${clienteDireccion}`, 10, 59);

    autoTable(docPDF, {
      startY: 68,
      head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
      body: productos.map((p) => [
        p.title,
        p.cantidad,
        `$${p.price.toFixed(2)}`,
        `$${(p.price * p.cantidad).toFixed(2)}`,
      ]),
    });

    const finalY = docPDF.lastAutoTable.finalY || 100;
    docPDF.text(`Descuento: ${descuento}%`, 10, finalY + 10);
    docPDF.text(`Total: $${totalConDescuento.toFixed(2)}`, 10, finalY + 18);
    docPDF.setFontSize(8);
    docPDF.setTextColor(120);
    docPDF.text("VCD Proyect © Todos los derechos reservados.", 10, docPDF.internal.pageSize.getHeight() - 10);
    docPDF.save(`${numeroFactura}.pdf`);

    Swal.fire("Factura generada", "La factura fue guardada y descargada.", "success");

    setFacturaData({
      numeroFactura: "",
      clienteNombre: "",
      clienteCUIT: "",
      clienteDireccion: "",
      productos: [],
      descuento: 0,
      origen: "",
      origenId: "",
      cupon: "",
    });
    setMensajeOrigen("");
  };

  const totalSinDescuento = facturaData.productos.reduce((sum, p) => sum + p.price * p.cantidad, 0);
  const totalConDescuento = totalSinDescuento * (1 - facturaData.descuento / 100);

  return (
    <div className="text-white p-4">
      <h2 className="text-2xl font-bold text-amber-400 mb-4">🧾 Panel de Facturación</h2>

      <select
        value={modo}
        onChange={(e) => setModo(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded"
      >
        <option value="manual">➕ Manual</option>
        <option value="pedido">📦 Desde Pedido</option>
        <option value="remito">🚚 Desde Remito</option>
      </select>

      {/* Selector de origen */}
      {modo === "pedido" && (
        <select
          className="w-full p-2 mb-4 bg-gray-700 rounded"
          value={facturaData.origenId}
          onChange={(e) => {
            const id = e.target.value;
            const pedido = pedidos.find(p => p.id === id);
            setFacturaData({
              ...facturaData,
              origen: "pedido",
              origenId: id,
              clienteNombre: pedido.usuario || pedido.userEmail,
              clienteCUIT: pedido.cuit || "",
              clienteDireccion: pedido.direccion || "",
              productos: (pedido.items || []).map(p => ({
                ...p,
                price: p.price ?? p.precioVenta ?? 0,
              })),
              descuento: pedido.descuento || 0,
              cupon: pedido.cupon || "",
            });
          }}
        >
          <option value="">Seleccionar pedido...</option>
          {pedidos.map(p => (
            <option key={p.id} value={p.id}>#{p.id} - {p.usuario || p.userEmail}</option>
          ))}
        </select>
      )}

      {modo === "remito" && (
        <select
          className="w-full p-2 mb-4 bg-gray-700 rounded"
          value={facturaData.origenId}
          onChange={(e) => {
            const id = e.target.value;
            const remito = remitos.find(r => r.id === id);
            setFacturaData({
              ...facturaData,
              origen: "remito",
              origenId: id,
              clienteNombre: remito.receptor,
              clienteCUIT: "",
              clienteDireccion: remito.direccion,
              productos: (remito.items || []).map(p => ({
                ...p,
                price: p.price ?? p.precioVenta ?? 0,
              })),
              descuento: remito.descuento || 0,
              cupon: remito.cupon || "",
            });
          }}
        >
          <option value="">Seleccionar remito...</option>
          {remitos.map(r => (
            <option key={r.id} value={r.id}>{r.numeroRemito} - {r.receptor}</option>
          ))}
        </select>
      )}

      {/* Datos del cliente */}
      <input
        type="text"
        placeholder="📛 Cliente / Razón Social"
        value={facturaData.clienteNombre}
        onChange={(e) => setFacturaData({ ...facturaData, clienteNombre: e.target.value })}
        className="w-full p-2 mb-2 bg-gray-700 rounded"
      />
      <input
        type="text"
        placeholder="🔢 CUIT"
        value={facturaData.clienteCUIT}
        onChange={(e) => setFacturaData({ ...facturaData, clienteCUIT: e.target.value })}
        className="w-full p-2 mb-2 bg-gray-700 rounded"
      />
      <input
        type="text"
        placeholder="📍 Dirección"
        value={facturaData.clienteDireccion}
        onChange={(e) => setFacturaData({ ...facturaData, clienteDireccion: e.target.value })}
        className="w-full p-2 mb-2 bg-gray-700 rounded"
      />

      {/* Agregar productos manualmente */}
      {(modo === "manual" || modo === "pedido" || modo === "remito") && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2 text-white">➕ Agregar producto manualmente</h3>
          <input
            type="text"
            placeholder="Buscar producto"
            value={productoBuscado}
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              setProductoBuscado(val);
              const encontrado = productosDisponibles.find(
                (p) =>
                  p.title.toLowerCase().includes(val) ||
                  p.id.toLowerCase().includes(val)
              );
              setProductoSeleccionado(encontrado || null);
            }}
            className="w-full p-2 mb-2 bg-gray-700 rounded"
          />
          {productoSeleccionado && (
            <div className="bg-gray-900 p-3 rounded mb-3">
              <p className="text-white font-semibold">{productoSeleccionado.title}</p>
              <p className="text-sm text-gray-300">💰 ${productoSeleccionado.precioVenta?.toFixed(2)}</p>
              <label className="text-sm mt-2 block">Cantidad:</label>
              <input
                type="number"
                min={1}
                value={cantidadProducto}
                onChange={(e) => setCantidadProducto(Number(e.target.value))}
                className="w-full p-2 mb-2 bg-gray-700 rounded"
              />
              <button
                onClick={agregarProductoManual}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                ➕ Agregar a la factura
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabla de productos agregados */}
      {facturaData.productos.length > 0 && (
        <div className="mt-4">
          <table className="w-full text-sm bg-gray-800 text-white rounded">
            <thead className="bg-gray-700 text-amber-300">
              <tr>
                <th className="p-2">Producto</th>
                <th className="p-2">Cantidad</th>
                <th className="p-2">Precio</th>
                <th className="p-2">Subtotal</th>
                <th className="p-2">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {facturaData.productos.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-700">
                  <td className="p-2">{item.title}</td>
                  <td className="p-2">{item.cantidad}</td>
                  <td className="p-2">${item.price?.toFixed(2)}</td>
                  <td className="p-2">${(item.price * item.cantidad).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => {
                        const nuevos = facturaData.productos.filter((_, i) => i !== index);
                        setFacturaData((prev) => ({ ...prev, productos: nuevos }));
                      }}
                      className="text-red-500 hover:text-red-700 text-lg"
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 text-right">
            <p>Total sin descuento: <span className="text-green-400 font-bold">${totalSinDescuento.toFixed(2)}</span></p>
            <p>Total con descuento: <span className="text-green-300 font-bold">${totalConDescuento.toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {/* Descuento y cupón */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1">🎁 Descuento manual (%):</label>
          <input
            type="number"
            value={facturaData.descuento}
            onChange={(e) =>
              setFacturaData((prev) => ({
                ...prev,
                descuento: parseFloat(e.target.value || 0),
              }))
            }
            className="w-full p-2 bg-gray-700 text-white rounded"
          />
          {userData?.role === "admin" && (
            <button
              onClick={() => {
                Swal.fire("✅ Descuento aplicado", `Se aplicó un ${facturaData.descuento}% manualmente`, "success");
              }}
              className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
            >
              Aplicar descuento manual
            </button>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm mb-1">🏷️ Código de cupón:</label>
          <input
            type="text"
            value={facturaData.cupon || ""}
            onChange={(e) =>
              setFacturaData((prev) => ({
                ...prev,
                cupon: e.target.value,
              }))
            }
            className="w-full p-2 bg-gray-700 text-white rounded"
            placeholder="Ej: DESCUENTO10"
            disabled={!!facturaData.descuento && !!facturaData.cupon}
          />

          {!facturaData.descuento && (
            <button
              onClick={validarCupon}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
            >
              Aplicar cupón
            </button>
          )}

          {facturaData.cupon && facturaData.descuento > 0 && (
            <div className="mt-3 p-3 bg-green-800 text-white rounded shadow flex justify-between items-center">
              <div>
                ✅ Cupón aplicado: <strong>{facturaData.cupon}</strong> –{" "}
                <span className="text-green-300">{facturaData.descuento}%</span> de descuento
              </div>
              <button
                onClick={() =>
                  setFacturaData((prev) => ({
                    ...prev,
                    cupon: "",
                    descuento: 0,
                  }))
                }
                className="ml-4 text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                ✖ Quitar
              </button>
            </div>
          )}
        </div>
      </div>


      <button
        onClick={handleGenerarFactura}
        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded text-lg"
      >
        📄 Generar Factura
      </button>

      {/* Tabla de facturas generadas */}
      <hr className="my-6 border-gray-600" />
      <h3 className="text-lg font-bold text-amber-400 mb-2">📜 Facturas Generadas</h3>
      <input
        type="text"
        placeholder="🔍 Buscar por número, cliente o fecha"
        value={busqueda}
        onChange={(e) => {
          const valor = e.target.value.toLowerCase();
          setBusqueda(valor);
          const filtradas = facturas.filter((f) => {
            const fecha = f.fecha?.toDate?.().toLocaleDateString?.() || "";
            return (
              f.numeroFactura?.toLowerCase().includes(valor) ||
              f.clienteNombre?.toLowerCase().includes(valor) ||
              fecha.toLowerCase().includes(valor)
            );
          });
          setFacturasFiltradas(filtradas);
        }}
        className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-800 text-white rounded">
          <thead className="bg-gray-700 text-amber-300">
            <tr>
              <th className="p-2">N°</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.map((f) => (
              <tr key={f.id} className="border-b border-gray-700">
                <td className="p-2">{f.numeroFactura}</td>
                <td className="p-2">{f.clienteNombre}</td>
                <td className="p-2">{f.fecha?.toDate?.().toLocaleDateString?.() || "-"}</td>
                <td className="p-2 text-green-400 font-semibold">${f.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
