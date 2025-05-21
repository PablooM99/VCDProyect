// src/components/FacturacionAdmin.jsx
import { useState } from "react";

export default function FacturacionAdmin() {
  const [pestañaActiva, setPestañaActiva] = useState("remitos");

  const renderContenido = () => {
    switch (pestañaActiva) {
      case "remitos":
        const [remitosGenerados, setRemitosGenerados] = useState([]);
        const [remitosFiltrados, setRemitosFiltrados] = useState([]);
        const [busquedaRemito, setBusquedaRemito] = useState("");
        const [modalDetalleRemito, setModalDetalleRemito] = useState(null);
        const [remitoData, setRemitoData] = useState({
            pedidoId: "",
            receptor: "",
            direccion: "",
            numeroRemito: "",
          });
          const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
          const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
          
          useEffect(() => {
            const cargarRemitos = async () => {
              try {
                const snap = await getDocs(collection(db, "remitos"));
                const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRemitosGenerados(lista);
                setRemitosFiltrados(lista);
              } catch (error) {
                console.error("Error al cargar remitos:", error);
              }
            };
          
            cargarRemitos();
          }, []);
          
          useEffect(() => {
            const cargarPedidos = async () => {
              try {
                const snap = await getDocs(collection(db, "pedidos"));
                const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setPedidosDisponibles(lista);
              } catch (e) {
                console.error("Error al cargar pedidos:", e);
              }
            };
          
            const obtenerProximoNumero = async () => {
              const ref = doc(db, "facturacion", "contador");
              const snap = await getDoc(ref);
              let nro = 1;
          
              if (snap.exists()) {
                const data = snap.data();
                nro = (data?.remito || 0) + 1;
              }
          
              const formateado = nro.toString().padStart(4, "0");
              setRemitoData((prev) => ({ ...prev, numeroRemito: `R-${formateado}` }));
            };
          
            cargarPedidos();
            obtenerProximoNumero();
          }, []);
          
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
          
            // Actualizar numeración
            const refContador = doc(db, "facturacion", "contador");
            await updateDoc(refContador, {
              remito: parseInt(remitoData.numeroRemito.split("-")[1]),
            });
          
            // Generar PDF
            const docPDF = new jsPDF();
            const anchoPagina = docPDF.internal.pageSize.getWidth();

            // Encabezado estilizado con logo textual
            docPDF.setFont("helvetica", "bold");
            docPDF.setFontSize(18);
            docPDF.text("VCD Proyect", 10, 15);

            // Datos ficticios de empresa
            docPDF.setFontSize(10);
            docPDF.setFont("helvetica", "normal");
            docPDF.text("Dirección: Calle Ficticia 123 - Ciudad", 10, 22);
            docPDF.text("Tel: 223-456-7890 | Email: contacto@vcdproyect.com", 10, 27);

            // Fecha alineada a la derecha
            docPDF.text(`Fecha: ${new Date().toLocaleDateString()}`, anchoPagina - 60, 15);

            // Número de Remito
            docPDF.setFontSize(12);
            docPDF.text(`Remito N°: ${remitoData.numeroRemito}`, 10, 38);

            // Receptor
            docPDF.text(`Receptor: ${remitoData.receptor}`, 10, 45);
            docPDF.text(`Dirección entrega: ${remitoData.direccion}`, 10, 52);

            // Tabla de productos
            autoTable(docPDF, {
            startY: 60,
            head: [["Producto", "Cantidad"]],
            body: (pedidoSeleccionado?.items || []).map((item) => [
                item.title,
                item.cantidad,
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [255, 204, 0] },
            margin: { left: 10, right: 10 },
            });

            // Firma
            const finalY = docPDF.lastAutoTable.finalY || 100;
            docPDF.text("Firma del receptor: __________________________", 10, finalY + 20);

            // Observaciones
            docPDF.setFontSize(10);
            docPDF.setFont("helvetica", "italic");
            docPDF.text("Observaciones:", 10, finalY + 35);
            docPDF.setFont("helvetica", "normal");
            docPDF.text(
            "Este remito no reemplaza la factura. La mercadería fue entregada según lo solicitado.",
            10,
            finalY + 40
            );

            // Leyenda legal (opcional / configurable)
            docPDF.setFontSize(8);
            docPDF.setTextColor(120);
            docPDF.text(
            "VCD Proyect – Sistema de gestión © Todos los derechos reservados.",
            10,
            docPDF.internal.pageSize.getHeight() - 10
            );


          
            Swal.fire("✅ Remito generado", "Se guardó correctamente y se descargó el PDF.", "success");
            setPedidoSeleccionado(null);
            setRemitoData({
              pedidoId: "",
              receptor: "",
              direccion: "",
              numeroRemito: "",
            });
          };
          
          return (
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <label className="block mb-2 text-sm">🧾 Seleccionar Pedido:</label>
              <select
                className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
                value={remitoData.pedidoId}
                onChange={(e) => {
                  const id = e.target.value;
                  const pedido = pedidosDisponibles.find((p) => p.id === id);
                  setRemitoData((prev) => ({ ...prev, pedidoId: id }));
                  setPedidoSeleccionado(pedido || null);
                  if (pedido) {
                    setRemitoData((prev) => ({
                      ...prev,
                      receptor: pedido.usuario || pedido.userEmail || "",
                      direccion: pedido.direccion || "",
                    }));
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {pedidosDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.usuario || p.userEmail}
                  </option>
                ))}
              </select>
          
              <label className="block mb-2 text-sm">📛 Receptor:</label>
              <input
                type="text"
                className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
                value={remitoData.receptor}
                onChange={(e) => setRemitoData({ ...remitoData, receptor: e.target.value })}
              />
          
              <label className="block mb-2 text-sm">📍 Dirección:</label>
              <input
                type="text"
                className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
                value={remitoData.direccion}
                onChange={(e) => setRemitoData({ ...remitoData, direccion: e.target.value })}
              />
          
              <label className="block mb-2 text-sm">🧾 Número de Remito:</label>
              <input
                type="text"
                className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
                value={remitoData.numeroRemito}
                onChange={(e) => setRemitoData({ ...remitoData, numeroRemito: e.target.value })}
              />
          
              <button
                onClick={generarRemito}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white w-full"
              >
                📄 Generar Remito
              </button>

              <div className="mb-4">
                <input
                    type="text"
                    placeholder="🔍 Buscar por número, cliente o fecha"
                    value={busquedaRemito}
                    onChange={(e) => {
                    const valor = e.target.value.toLowerCase();
                    setBusquedaRemito(valor);
                    const filtrados = remitosGenerados.filter((r) => {
                        const fecha = r.fecha?.toDate?.().toLocaleDateString?.() || "";
                        return (
                        r.numeroRemito?.toLowerCase().includes(valor) ||
                        r.receptor?.toLowerCase().includes(valor) ||
                        fecha.toLowerCase().includes(valor)
                        );
                    });
                    setRemitosFiltrados(filtrados);
                    }}
                    className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                />
                </div>


              <h3 className="text-lg font-bold text-amber-400 mb-2">📄 Remitos generados</h3>

                <div className="overflow-x-auto">
                <table className="w-full text-sm bg-gray-800 text-white rounded">
                    <thead className="bg-gray-700 text-amber-300">
                    <tr>
                        <th className="p-2">N°</th>
                        <th className="p-2">Receptor</th>
                        <th className="p-2">Dirección</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2"><div className="flex gap-2">
                        <button
                            onClick={() => setModalDetalleRemito(remito)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                        >
                            🔍 Ver Detalle
                        </button>
                        <button
                            onClick={() => descargarRemitoPDF(remito)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                            📄 Descargar
                        </button>
                        </div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {remitosFiltrados.map((remito) => (
                        <tr key={remito.id} className="border-b border-gray-700">
                        <td className="p-2">{remito.numeroRemito}</td>
                        <td className="p-2">{remito.receptor}</td>
                        <td className="p-2">{remito.direccion}</td>
                        <td className="p-2">
                            {remito.fecha?.toDate?.().toLocaleDateString?.() || "-"}
                        </td>
                        <td className="p-2">
                            <button
                            onClick={() => setModalDetalleRemito(remito)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                            >
                            🔍 Ver Detalle
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            
          );
          
          {modalDetalleRemito && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg relative">
                <h3 className="text-xl text-amber-400 font-bold mb-4">📋 Detalle del Remito</h3>
                <p><strong>Número:</strong> {modalDetalleRemito.numeroRemito}</p>
                <p><strong>Receptor:</strong> {modalDetalleRemito.receptor}</p>
                <p><strong>Dirección:</strong> {modalDetalleRemito.direccion}</p>
                <p><strong>Fecha:</strong> {modalDetalleRemito.fecha?.toDate?.().toLocaleDateString?.() || "-"}</p>
          
                <h4 className="mt-4 font-semibold text-white">📦 Productos:</h4>
                <ul className="text-sm text-gray-300 list-disc pl-4 mb-4">
                  {modalDetalleRemito.items?.map((p, idx) => (
                    <li key={idx}>{p.title} x{p.cantidad}</li>
                  ))}
                </ul>
          
                <button
                  onClick={() => setModalDetalleRemito(null)}
                  className="absolute top-2 right-3 text-white text-xl hover:text-red-500"
                >
                  ✖
                </button>
              </div>
            </div>
          )}
          const descargarRemitoPDF = (remito) => {
            const docPDF = new jsPDF();
            const anchoPagina = docPDF.internal.pageSize.getWidth();
          
            docPDF.setFont("helvetica", "bold");
            docPDF.setFontSize(18);
            docPDF.text("VCD Proyect", 10, 15);
          
            docPDF.setFontSize(10);
            docPDF.setFont("helvetica", "normal");
            docPDF.text("Dirección: Calle Ficticia 123 - Ciudad", 10, 22);
            docPDF.text("Tel: 223-456-7890 | Email: contacto@vcdproyect.com", 10, 27);
            docPDF.text(
              `Fecha: ${remito.fecha?.toDate?.().toLocaleDateString?.() || "-"}`,
              anchoPagina - 60,
              15
            );
          
            docPDF.setFontSize(12);
            docPDF.text(`Remito N°: ${remito.numeroRemito}`, 10, 38);
            docPDF.text(`Receptor: ${remito.receptor}`, 10, 45);
            docPDF.text(`Dirección entrega: ${remito.direccion}`, 10, 52);
          
            autoTable(docPDF, {
              startY: 60,
              head: [["Producto", "Cantidad"]],
              body: (remito.items || []).map((item) => [
                item.title,
                item.cantidad,
              ]),
              styles: { fontSize: 10 },
              headStyles: { fillColor: [255, 204, 0] },
              margin: { left: 10, right: 10 },
            });
          
            const finalY = docPDF.lastAutoTable.finalY || 100;
            docPDF.text("Firma del receptor: __________________________", 10, finalY + 20);
          
            docPDF.setFontSize(8);
            docPDF.setTextColor(120);
            docPDF.text(
              "VCD Proyect – Sistema de gestión © Todos los derechos reservados.",
              10,
              docPDF.internal.pageSize.getHeight() - 10
            );
          
            docPDF.save(`${remito.numeroRemito}.pdf`);
          };
          
        
      case "facturas":
        const [facturasFiltradas, setFacturasFiltradas] = useState([]);
        const [busquedaFactura, setBusquedaFactura] = useState("");
        const [modalDetalleFactura, setModalDetalleFactura] = useState(null);
        const [facturasGeneradas, setFacturasGeneradas] = useState([]);

        useEffect(() => {
            const cargarFacturas = async () => {
              try {
                const snap = await getDocs(collection(db, "facturas"));
                const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFacturasGeneradas(lista);
                setFacturasFiltradas(lista); // inicializa también filtradas
              } catch (error) {
                console.error("Error al cargar facturas:", error);
              }
            };
          
            cargarFacturas();
          }, []);

        const [modoFactura, setModoFactura] = useState("pedido");
        const [facturaData, setFacturaData] = useState({
        numeroFactura: "",
        clienteNombre: "",
        clienteCUIT: "",
        clienteDireccion: "",
        pedidoId: "",
        productos: [],
        descuento: 0,
        });
        const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
        const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
        const [nuevoProducto, setNuevoProducto] = useState({ title: "", price: "", cantidad: "" });

        useEffect(() => {
        const cargarPedidos = async () => {
            const snap = await getDocs(collection(db, "pedidos"));
            const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setPedidosDisponibles(lista);
        };

        const obtenerNumeroFactura = async () => {
            const ref = doc(db, "facturacion", "contador");
            const snap = await getDoc(ref);
            let nro = 1;

            if (snap.exists()) {
            const data = snap.data();
            nro = (data?.factura || 0) + 1;
            }

            const formateado = nro.toString().padStart(4, "0");
            setFacturaData((prev) => ({ ...prev, numeroFactura: `F-${formateado}` }));
        };

        cargarPedidos();
        obtenerNumeroFactura();
        }, []);

        const agregarProductoManual = () => {
        const { title, price, cantidad } = nuevoProducto;
        if (!title || !price || !cantidad) {
            Swal.fire("Campos incompletos", "Completa todos los datos del producto", "warning");
            return;
        }
        setFacturaData((prev) => ({
            ...prev,
            productos: [...prev.productos, { title, price: parseFloat(price), cantidad: parseInt(cantidad) }],
        }));
        setNuevoProducto({ title: "", price: "", cantidad: "" });
        };

        const generarFactura = async () => {
        const { numeroFactura, clienteNombre, clienteCUIT, clienteDireccion, productos, descuento } = facturaData;
        if (!clienteNombre || !clienteCUIT || !clienteDireccion || productos.length === 0) {
            Swal.fire("Faltan datos", "Revisá que todos los campos estén completos", "error");
            return;
        }

        const total = productos.reduce((acc, p) => acc + p.price * p.cantidad, 0);
        const totalConDescuento = total * (1 - descuento / 100);

        const datosFactura = {
            numeroFactura,
            clienteNombre,
            clienteCUIT,
            clienteDireccion,
            productos,
            descuento,
            total: parseFloat(totalConDescuento.toFixed(2)),
            fecha: serverTimestamp(),
        };

        await addDoc(collection(db, "facturas"), datosFactura);
        await updateDoc(doc(db, "facturacion", "contador"), {
            factura: parseInt(numeroFactura.split("-")[1]),
        });

        // PDF
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
        docPDF.text(`Factura N°: ${numeroFactura}`, 10, 38);
        docPDF.text(`Cliente: ${clienteNombre}`, 10, 45);
        docPDF.text(`CUIT: ${clienteCUIT}`, 10, 52);
        docPDF.text(`Dirección: ${clienteDireccion}`, 10, 59);

        autoTable(docPDF, {
            startY: 68,
            head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
            body: productos.map((item) => [
            item.title,
            item.cantidad,
            `$${item.price.toFixed(2)}`,
            `$${(item.price * item.cantidad).toFixed(2)}`
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [255, 204, 0] },
            margin: { left: 10, right: 10 },
        });

        const finalY = docPDF.lastAutoTable.finalY || 100;
        docPDF.setFontSize(12);
        docPDF.text(
            `Descuento aplicado: ${descuento}%`,
            10,
            finalY + 10
        );
        docPDF.text(
            `Total: $${totalConDescuento.toFixed(2)}`,
            10,
            finalY + 18
        );

        docPDF.setFontSize(8);
        docPDF.setTextColor(120);
        docPDF.text(
            "VCD Proyect – Facturación interna © Todos los derechos reservados.",
            10,
            docPDF.internal.pageSize.getHeight() - 10
        );

        docPDF.save(`${numeroFactura}.pdf`);
        Swal.fire("✅ Factura generada", "La factura se descargó correctamente.", "success");

        setFacturaData({
            numeroFactura: "",
            clienteNombre: "",
            clienteCUIT: "",
            clienteDireccion: "",
            pedidoId: "",
            productos: [],
            descuento: 0,
        });
        setPedidoSeleccionado(null);
        };

        return (
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="mb-4">
            <label className="block text-sm mb-1">Modo de factura:</label>
            <select
                value={modoFactura}
                onChange={(e) => {
                const modo = e.target.value;
                setModoFactura(modo);
                setFacturaData((prev) => ({
                    ...prev,
                    productos: [],
                    clienteNombre: "",
                    clienteCUIT: "",
                    clienteDireccion: "",
                    pedidoId: "",
                }));
                }}
                className="w-full p-2 bg-gray-700 text-white rounded"
            >
                <option value="pedido">📦 Desde un pedido</option>
                <option value="manual">✍️ Manual</option>
            </select>
            </div>

            {modoFactura === "pedido" && (
            <>
                <label className="block mb-2 text-sm">Seleccionar pedido:</label>
                <select
                value={facturaData.pedidoId}
                onChange={(e) => {
                    const id = e.target.value;
                    const pedido = pedidosDisponibles.find((p) => p.id === id);
                    setFacturaData({
                    ...facturaData,
                    pedidoId: id,
                    clienteNombre: pedido.usuario || pedido.userEmail || "",
                    clienteCUIT: pedido.cuit || "",
                    clienteDireccion: pedido.direccion || "",
                    productos: pedido.items || [],
                    });
                    setPedidoSeleccionado(pedido);
                }}
                className="w-full mb-4 p-2 bg-gray-700 text-white rounded"
                >
                <option value="">Seleccionar...</option>
                {pedidosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                    #{p.id} - {p.usuario || p.userEmail}
                    </option>
                ))}
                </select>
            </>
            )}

            {/* Datos del cliente */}
            <label className="block mb-1 text-sm">📛 Cliente:</label>
            <input
            type="text"
            placeholder="Nombre / Razón Social"
            value={facturaData.clienteNombre}
            onChange={(e) => setFacturaData({ ...facturaData, clienteNombre: e.target.value })}
            className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
            />

            <label className="block mb-1 text-sm">🔢 CUIT:</label>
            <input
            type="text"
            placeholder="Ej: 20-12345678-9"
            value={facturaData.clienteCUIT}
            onChange={(e) => setFacturaData({ ...facturaData, clienteCUIT: e.target.value })}
            className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
            />

            <label className="block mb-1 text-sm">📍 Dirección:</label>
            <input
            type="text"
            placeholder="Dirección del cliente"
            value={facturaData.clienteDireccion}
            onChange={(e) => setFacturaData({ ...facturaData, clienteDireccion: e.target.value })}
            className="w-full mb-4 p-2 bg-gray-700 text-white rounded"
            />

            {/* Agregar productos manualmente */}
            {modoFactura === "manual" && (
            <div className="bg-gray-900 p-3 rounded mb-4">
                <h3 className="text-white font-bold mb-2">➕ Agregar producto</h3>
                <input
                type="text"
                placeholder="Nombre"
                value={nuevoProducto.title}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, title: e.target.value })}
                className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
                />
                <input
                type="number"
                placeholder="Precio"
                value={nuevoProducto.price}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, price: e.target.value })}
                className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
                />
                <input
                type="number"
                placeholder="Cantidad"
                value={nuevoProducto.cantidad}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
                />
                <button
                onClick={agregarProductoManual}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                Agregar al listado
                </button>
            </div>
            )}

            {/* Número de factura y descuento */}
            <label className="block mb-1 text-sm">🧾 Número de Factura:</label>
            <input
            type="text"
            value={facturaData.numeroFactura}
            onChange={(e) => setFacturaData({ ...facturaData, numeroFactura: e.target.value })}
            className="w-full mb-2 p-2 bg-gray-700 text-white rounded"
            />

            <label className="block mb-1 text-sm">🎁 Descuento (%):</label>
            <input
            type="number"
            value={facturaData.descuento}
            onChange={(e) => setFacturaData({ ...facturaData, descuento: parseFloat(e.target.value || 0) })}
            className="w-full mb-4 p-2 bg-gray-700 text-white rounded"
            />

            <button
            onClick={generarFactura}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
            📄 Generar Factura
            </button>
            <hr className="my-6 border-gray-600" />

            <h3 className="text-lg font-bold text-amber-400 mb-2">📜 Facturas generadas</h3>

            <div className="overflow-x-auto">
            <table className="w-full text-sm bg-gray-800 text-white rounded">
                <thead className="bg-gray-700 text-amber-300">
                <tr>
                    <th className="p-2">N°</th>
                    <th className="p-2">Cliente</th>
                    <th className="p-2">Fecha</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">
                    <button
                        className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                        onClick={() => setModalDetalleFactura(factura)}
                        >
                        🔍 Ver Detalle
                    </button>
                    </th>
                </tr>
                </thead>
                <tbody>
                {modalDetalleFactura && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg relative">
                    <h3 className="text-xl text-amber-400 font-bold mb-4">🧾 Detalle de Factura</h3>
                    <p><strong>N°:</strong> {modalDetalleFactura.numeroFactura}</p>
                    <p><strong>Cliente:</strong> {modalDetalleFactura.clienteNombre}</p>
                    <p><strong>CUIT:</strong> {modalDetalleFactura.clienteCUIT}</p>
                    <p><strong>Dirección:</strong> {modalDetalleFactura.clienteDireccion}</p>
                    <p><strong>Fecha:</strong> {modalDetalleFactura.fecha?.toDate?.().toLocaleDateString?.() || "-"}</p>

                    <h4 className="mt-4 font-semibold text-white">🧾 Productos:</h4>
                    <ul className="text-sm text-gray-300 list-disc pl-4 mb-4">
                        {modalDetalleFactura.productos.map((p, idx) => (
                        <li key={idx}>
                            {p.title} x{p.cantidad} – ${p.price.toFixed(2)} (Subtotal: ${(p.price * p.cantidad).toFixed(2)})
                        </li>
                        ))}
                    </ul>

                    <p className="text-green-400"><strong>Descuento:</strong> {modalDetalleFactura.descuento || 0}%</p>
                    <p className="text-amber-400 font-bold text-lg mt-2">
                        Total: ${modalDetalleFactura.total?.toFixed(2) || "0.00"}
                    </p>

                    <button
                        onClick={() => setModalDetalleFactura(null)}
                        className="absolute top-2 right-3 text-white text-xl hover:text-red-500"
                    >
                        ✖
                    </button>
                    </div>
                </div>
                )}
                <div className="mb-4">
                <input
                    type="text"
                    placeholder="🔍 Buscar por número, cliente o fecha"
                    value={busquedaFactura}
                    onChange={(e) => {
                    const valor = e.target.value.toLowerCase();
                    setBusquedaFactura(valor);
                    const filtradas = facturasGeneradas.filter((f) => {
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
                </div>
                {facturasFiltradas.map((factura) => (
                    <tr key={factura.id} className="border-b border-gray-700">
                    <td className="p-2">{factura.numeroFactura}</td>
                    <td className="p-2">{factura.clienteNombre}</td>
                    <td className="p-2">
                        {factura.fecha?.toDate?.().toLocaleDateString?.() || "-"}
                    </td>
                    <td className="p-2 text-green-400 font-semibold">
                        ${factura.total?.toFixed?.(2) || "0.00"}
                    </td>
                    <td className="p-2">
                        <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        onClick={() => descargarFacturaPDF(factura)}
                        >
                        📄 Descargar PDF
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

        </div>
        );
        const descargarFacturaPDF = (factura) => {
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
            docPDF.text(`Factura N°: ${factura.numeroFactura}`, 10, 38);
            docPDF.text(`Cliente: ${factura.clienteNombre}`, 10, 45);
            docPDF.text(`CUIT: ${factura.clienteCUIT}`, 10, 52);
            docPDF.text(`Dirección: ${factura.clienteDireccion}`, 10, 59);
          
            autoTable(docPDF, {
              startY: 68,
              head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
              body: factura.productos.map((item) => [
                item.title,
                item.cantidad,
                `$${item.price.toFixed(2)}`,
                `$${(item.price * item.cantidad).toFixed(2)}`
              ]),
              styles: { fontSize: 10 },
              headStyles: { fillColor: [255, 204, 0] },
              margin: { left: 10, right: 10 },
            });
          
            const finalY = docPDF.lastAutoTable.finalY || 100;
            docPDF.setFontSize(12);
            docPDF.text(`Descuento aplicado: ${factura.descuento || 0}%`, 10, finalY + 10);
            docPDF.text(`Total: $${factura.total?.toFixed(2)}`, 10, finalY + 18);
          
            docPDF.setFontSize(8);
            docPDF.setTextColor(120);
            docPDF.text(
              "VCD Proyect – Facturación interna © Todos los derechos reservados.",
              10,
              docPDF.internal.pageSize.getHeight() - 10
            );
          
            docPDF.save(`${factura.numeroFactura}.pdf`);
          };
          


      case "notas":
        return (
          <div className="mt-4">
            <h2 className="text-amber-400 text-xl font-bold mb-2">🔄 Notas de Crédito</h2>
            <p className="text-gray-300 mb-4">Emití una nota de crédito para una factura existente.</p>
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <p className="text-sm text-gray-400 italic">Funcionalidad próximamente...</p>
            </div>
          </div>
        );

      case "afip":
        return (
          <div className="mt-4">
            <h2 className="text-amber-400 text-xl font-bold mb-2">🛰️ Facturación Electrónica AFIP</h2>
            <p className="text-gray-300 mb-4">Integración futura para emitir facturas electrónicas válidas ante AFIP.</p>
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <p className="text-sm text-gray-400 italic">Pendiente de implementación.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white rounded shadow">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">🧾 Panel de Facturación</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setPestañaActiva("remitos")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "remitos"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          📦 Remitos
        </button>
        <button
          onClick={() => setPestañaActiva("facturas")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "facturas"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🧾 Facturas
        </button>
        <button
          onClick={() => setPestañaActiva("notas")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "notas"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🔄 Notas de Crédito
        </button>
        <button
          onClick={() => setPestañaActiva("afip")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "afip"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🛰️ AFIP
        </button>
      </div>

      {renderContenido()}
    </div>
  );
}
