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
import { useAuth } from "../context/AuthContext";
import { collectionGroup } from "firebase/firestore";
import Swal from "sweetalert2";

export default function PedidosAdmin() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("desconocido");
  const [pedidos, setPedidos] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleProductos, setDetalleProductos] = useState([]);
  const [ordenFechaAsc, setOrdenFechaAsc] = useState(true);
  const [ordenAZ, setOrdenAZ] = useState(null);
  const [modalCrearPedido, setModalCrearPedido] = useState(false);
  const [nuevoPedido, setNuevoPedido] = useState({
    productos: [],
    userId: "",
    userEmail: "",
    metodoPago: "pendiente",
  });
  const [nuevoProducto, setNuevoProducto] = useState({ id: "", cantidad: "" });
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [productosBD, setProductosBD] = useState([]);
  const [productoBuscado, setProductoBuscado] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const snap = await getDocs(collection(db, "productos"));
        const lista = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductosDisponibles(lista);
      } catch (error) {
        console.error("Error al cargar productos disponibles:", error);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const snapProductos = await getDocs(collection(db, "productos"));
      const listaProductos = snapProductos.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductosBD(listaProductos);
      try {
        const snap = await getDocs(collection(db, "usuarios"));
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuariosDisponibles(lista);
      } catch (e) {
        console.error("Error al cargar usuarios:", e);
      }
    };
    fetchUsuarios();
  }, []);

  const agregarProductoAlPedido = () => {
    if (!productoBuscado || !nuevoProducto.cantidad) {
      Swal.fire("Campos incompletos", "Selecciona un producto y cantidad", "warning");
      return;
    }
  
    setNuevoPedido((prev) => ({
      ...prev,
      productos: [
        ...prev.productos,
        {
          id: productoBuscado.id,
          title: productoBuscado.title,
          price: productoBuscado.price,
          cantidad: parseInt(nuevoProducto.cantidad),
        },
      ],
    }));
    setNuevoProducto({ id: "" });
    setProductoBuscado(null);
  };

  const crearPedidoManual = async () => {
    const { userId, productos, metodoPago } = nuevoPedido;
    if (!userId || productos.length === 0) {
      Swal.fire("Faltan datos", "Selecciona un usuario y agrega al menos un producto", "error");
      return;
    }
  
    try {
      const userDoc = await getDoc(doc(db, "usuarios", userId));
      const userEmail = userDoc.exists() ? userDoc.data().email : "-";
      const userNombre = userDoc.exists() ? userDoc.data().nombre : "-";
      const userDireccion = userDoc.exists() ? userDoc.data().direccion || "-" : "-";
  
      const subtotal = productos.reduce((acc, item) => acc + item.price * item.cantidad, 0);
      const descuentoAplicado = isNaN(parseInt(nuevoPedido.descuento)) ? 0 : parseInt(nuevoPedido.descuento);
      const totalConDescuento = subtotal * (1 - descuentoAplicado / 100);

      const pedidoNuevo = {
        items: productos,
        userId,
        userEmail,
        fecha: serverTimestamp(),
        estado: "pendiente",
        metodoPago,
        cuponAplicado: nuevoPedido.cuponAplicado || "",
        descuento: descuentoAplicado,
        total: parseFloat(totalConDescuento.toFixed(2)),
        direccion: userDireccion
      };
  
      await addDoc(collection(db, "pedidos"), pedidoNuevo);
  
      await registrarLog("creacion", "pedido", `Se creó un nuevo pedido manual para ${userNombre} (${userEmail}).`);
      // Si el cupón es de uso único, lo marcamos como usado por este usuario
      if (pedidoNuevo.cuponAplicado && user?.rol !== "admin") {
        const cuponRef = doc(db, "cupones", pedidoNuevo.cuponAplicado);
        const cuponSnap = await getDoc(cuponRef);

        if (cuponSnap.exists()) {
          const cuponData = cuponSnap.data();
          if (cuponData.soloUnUso) {
            const usuarioRef = doc(db, "usuarios", userId);
            await updateDoc(usuarioRef, {
              cuponesUsados: [...(userDoc.data().cuponesUsados || []), pedidoNuevo.cuponAplicado],
            });
          }
        }
      }

  
      Swal.fire("Pedido creado", "El pedido fue generado correctamente", "success");
  
      setModalCrearPedido(false);
      setNuevoPedido({ productos: [], userId: "", userEmail: "", metodoPago: "pendiente" });
  
      // Recargar pedidos
      const snapshot = await getDocs(collection(db, "pedidos"));
      const pedidosActualizados = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const pedido = { id: docSnap.id, ...docSnap.data() };
        if (pedido.userId) {
          const userDoc = await getDoc(doc(db, "usuarios", pedido.userId));
          pedido.usuario = userDoc.exists() ? userDoc.data().nombre || userDoc.data().email : "-";
        } else {
          pedido.usuario = pedido.userEmail || "-";
        }
        return pedido;
      }));
      setPedidos(pedidosActualizados);
    } catch (e) {
      console.error("Error al crear pedido manual:", e);
      Swal.fire("Error", "No se pudo crear el pedido", "error");
    }
  };

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

  useEffect(() => {
    const obtenerNombre = async () => {
      const aplicarCupon = async () => {
        if (!nuevoPedido.cuponAplicado?.trim()) {
          Swal.fire("Código vacío", "Debes ingresar un código de cupón", "warning");
          return;
        }
      
        try {
          const snap = await getDocs(collection(db, "cupones"));
          const cuponEncontrado = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find(c => c.codigo.toLowerCase() === nuevoPedido.cuponAplicado.toLowerCase());
      
          if (!cuponEncontrado) {
            Swal.fire("Cupón inválido", "El código ingresado no existe", "error");
            setNuevoPedido(prev => ({ ...prev, cuponAplicado: "", descuento: 0 }));
            return;
          }
      
          if (!cuponEncontrado.activo) {
            Swal.fire("Cupón inactivo", "Este cupón no está activo actualmente", "error");
            setNuevoPedido(prev => ({ ...prev, cuponAplicado: "", descuento: 0 }));
            return;
          }
      
          setNuevoPedido(prev => ({
            ...prev,
            cuponAplicado: cuponEncontrado.codigo,
            descuento: cuponEncontrado.descuento || 0,
          }));
      
          Swal.fire("Cupón aplicado", `Se aplicó correctamente el cupón "${cuponEncontrado.codigo}"`, "success");
      
        } catch (error) {
          console.error("Error al aplicar cupón:", error);
          Swal.fire("Error", "No se pudo validar el cupón", "error");
        }
      };

      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
          setUserName(snap.data().nombre || "desconocido");
        }
      } catch (e) {
        console.error("Error al obtener nombre del usuario para logs:", e);
      }
    };
    obtenerNombre();
  }, [user]);

  const registrarLog = async (tipo, entidad, descripcion) => {
    try {
      await addDoc(collection(db, "logs"), {
        tipo,
        entidad,
        descripcion,
        userId: user?.uid || "desconocido",
        userEmail: user?.email || "desconocido",
        userName: userName || "desconocido",
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al registrar log:", error);
    }
  };

  const actualizarCampo = async (id, campo, valor) => {
    try {
      const refPedido = doc(db, "pedidos", id);
      await updateDoc(refPedido, { [campo]: valor });

      const docSnap = await getDoc(refPedido);
      const pedidoActualizado = docSnap.exists() ? docSnap.data() : null;

      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
      );

      await registrarLog(
        "actualizacion",
        "pedido",
        `Se actualizó el campo "${campo}" del pedido #${id} a "${valor}".`
      );

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

      if (campo === "estado" && pedidoActualizado?.userEmail?.trim()) {
        try {
          await enviarNotificacionEstado({
            email: pedidoActualizado.userEmail,
            nombre: pedidoActualizado.userEmail || "cliente",
            estado: valor,
          });

          await enviarNotificacion(
            pedidoActualizado.userId,
            `📦 Tu pedido fue actualizado a "${valor}"`
          );
        } catch (err) {
          console.warn("❌ Error al enviar notificación por email:", err.message);
        }
      }
    } catch (error) {
      console.error(`Error al actualizar ${campo} del pedido:`, error);
    }
  };

  const eliminarPedido = async (id) => {
    if (user?.rol === "empleado") {
      alert("❌ No tienes permisos para eliminar pedidos.");
      return;
    }

    try {
      await deleteDoc(doc(db, "pedidos", id));
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      alert("🗑️ Pedido eliminado correctamente");

      await registrarLog("eliminacion", "pedido", `Se eliminó el pedido #${id}.`);
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
  const metodosPago = ["pendiente", "efectivo", "cheque", "echeq", "transferencia", "pagado (MercadoPago)"];

  let pedidosFiltrados = pedidos.filter((p) => {
    const coincideEstado = estadoFiltro
      ? p.estado === estadoFiltro || p.metodoPago === estadoFiltro
      : true;
    const termino = busqueda.toLowerCase();
    const coincideBusqueda =
      p.id.toLowerCase().includes(termino) ||
      p.usuario?.toLowerCase().includes(termino) ||
      p.fecha?.toDate?.().toLocaleString?.().toLowerCase().includes(termino);
    return coincideEstado && coincideBusqueda;
  });

  if (ordenAZ !== null) {
    pedidosFiltrados.sort((a, b) =>
      ordenAZ
        ? a.usuario.localeCompare(b.usuario)
        : b.usuario.localeCompare(a.usuario)
    );
  } else {
    pedidosFiltrados.sort((a, b) =>
      ordenFechaAsc
        ? a.fecha?.toDate?.() - b.fecha?.toDate?.()
        : b.fecha?.toDate?.() - a.fecha?.toDate?.()
    );
  }

  const abrirModalProductos = (items, cupon, descuento) => {
    setDetalleProductos({ items, cupon, descuento });
    setModalVisible(true);
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-400">📦 Gestión de Pedidos</h2>
        <div className="flex gap-2">
          <button onClick={exportarPDF} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded">
            Exportar PDF
          </button>
          <button onClick={exportarExcel} className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded">
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
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por ID, usuario o fecha"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded w-72"
        />

        <button
          onClick={() => setOrdenAZ(ordenAZ === null ? true : !ordenAZ)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Orden A-Z / Z-A
        </button>

        <button
          onClick={() => {
            setOrdenFechaAsc(!ordenFechaAsc);
            setOrdenAZ(null);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          Orden por Fecha
        </button>

        <button
          onClick={() => {
            setEstadoFiltro("");
            setBusqueda("");
          }}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Limpiar Filtros
        </button>
      </div>

      <button
        onClick={() => setModalCrearPedido(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mb-4"
      >
        ➕ Crear Pedido Manual
      </button>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
        <thead className="text-amber-300">
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Método de Pago</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {pedidosFiltrados.map((pedido) => {
            const productos = pedido.items || pedido.productos || [];
            const totalPedido = productos.reduce((acc, item) => {
              const cantidad = item.cantidad || item.qty || 1;
              return acc + (item.price || 0) * cantidad;
            }, 0);
            return (
              <tr key={pedido.id} className="border-b border-gray-700">
                <td>{pedido.id}</td>
                <td>{pedido.usuario || "-"}</td>
                <td>{pedido.userEmail || "-"}</td>
                <td>{pedido.fecha?.toDate?.().toLocaleString?.() || "-"}</td>
                <td>
                  <button
                    onClick={() => abrirModalProductos(productos, pedido.cuponAplicado, pedido.descuento)}
                    className="text-amber-300 underline hover:text-amber-400"
                  >
                    {productos.length} productos
                  </button>
                </td>
                <td className="text-green-400 font-semibold">${totalPedido.toFixed(2)}</td>
                <td>
                  <select
                    value={pedido.estado || ""}
                    onChange={(e) => actualizarCampo(pedido.id, "estado", e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    {estadosEnvio.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={pedido.metodoPago || ""}
                    onChange={(e) => actualizarCampo(pedido.id, "metodoPago", e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>{metodo}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => eliminarPedido(pedido.id)}
                    className={`${
                      user?.rol === "empleado"
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    } text-white px-3 py-1 rounded`}
                    disabled={user?.rol === "empleado"}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>

        </table>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-lg w-full relative">
            <h3 className="text-lg text-amber-400 font-semibold mb-4">🧾 Detalle del Pedido</h3>
            <ul className="list-disc list-inside text-sm mb-4 text-white">
              {detalleProductos.items?.map((item, idx) => (
                <li key={idx}>{item.title} x{item.qty || item.cantidad}</li>
              ))}
            </ul>
            {detalleProductos.cupon && (
              <p className="text-green-400 text-sm">
                Cupón aplicado: <strong>{detalleProductos.cupon}</strong> – {detalleProductos.descuento}% OFF
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
      {modalCrearPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-xl w-full relative">
            <h3 className="text-lg text-amber-400 font-semibold mb-4">📦 Crear Pedido Manual</h3>

            <label className="block mb-2">🧑‍💼 Seleccionar cliente:</label>
            <select
              value={nuevoPedido.userId}
              onChange={(e) => setNuevoPedido({ ...nuevoPedido, userId: e.target.value })}
              className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
            >
              <option value="">Seleccionar usuario</option>
              {usuariosDisponibles.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
              ))}
            </select>

            <label className="block mb-2">🔍 Buscar producto:</label>
            <input
              type="text"
              placeholder="ID o Título"
              value={nuevoProducto.id}
              onChange={(e) => {
                const valor = e.target.value.toLowerCase();
                setNuevoProducto({ ...nuevoProducto, id: valor });

                const palabrasBusqueda = valor.split(" ").filter(Boolean);
                const productoEncontrado = productosBD.find((p) => {
                  const titulo = p.title.toLowerCase();
                  return palabrasBusqueda.every((palabra) => titulo.includes(palabra));
                });

                setProductoBuscado(productoEncontrado || null);
              }}
              className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
            />

              {productoBuscado && (
                <div className="bg-gray-700 p-3 rounded mb-4">
                  <p className="text-white font-bold">{productoBuscado.title}</p>
                  <p className="text-white text-sm">💲 Precio: ${productoBuscado.price}</p>
                  {productoBuscado.imageURLs?.[0] && (
                    <img
                      src={productoBuscado.imageURLs[0]}
                      alt={productoBuscado.title}
                      className="w-24 mt-2 rounded"
                    />
                  )}
                  <input
                    type="number"
                    min="1"
                    placeholder="Cantidad"
                    value={nuevoProducto.cantidad || ""}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value);
                      if (valor >= 1 || e.target.value === "") {
                        setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value });
                      }
                    }}
                    className="mt-2 p-2 w-full rounded bg-gray-800 text-white"
                  />

                  <button
                    onClick={agregarProductoAlPedido}
                    className="mt-2 bg-green-600 px-3 py-2 rounded text-white w-full"
                  >
                    Agregar al pedido
                  </button>
                </div>
              )}

              <label className="block mb-2 mt-4">🎁 Código de cupón:</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ej: PROMO10"
                  value={nuevoPedido.cuponAplicado || ""}
                  onChange={(e) =>
                    setNuevoPedido({ ...nuevoPedido, cuponAplicado: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
                <button
  onClick={async () => {
    const codigo = (nuevoPedido.cuponAplicado || "").toUpperCase().trim();
    if (!codigo) return Swal.fire("Cupón vacío", "Escribe un código de cupón", "warning");

    try {
      const cuponRef = doc(db, "cupones", codigo);
      const cuponSnap = await getDoc(cuponRef);

      if (!cuponSnap.exists()) {
        return Swal.fire("Cupón inválido", "El cupón no existe", "error");
      }

      const cupon = cuponSnap.data();

      if (!cupon.activo) {
        return Swal.fire("Cupón inactivo", "Este cupón ya no está disponible", "warning");
      }

      if (cupon.soloUnUso && nuevoPedido.userId) {
        const usuarioSnap = await getDoc(doc(db, "usuarios", nuevoPedido.userId));
        const yaUsados = usuarioSnap.data()?.cuponesUsados || [];

        if (yaUsados.includes(codigo)) {
          return Swal.fire("Ya utilizado", "Este cupón ya fue usado por este usuario", "info");
        }
      }

      setNuevoPedido((prev) => ({
        ...prev,
        cuponAplicado: codigo,
        descuento: cupon.descuento || 0,
      }));

      Swal.fire("Cupón aplicado", `Descuento de ${cupon.descuento}% aplicado`, "success");

    } catch (err) {
      console.error("Error al validar cupón:", err);
      Swal.fire("Error", "No se pudo validar el cupón", "error");
    }
  }}
  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white"
>
  Aplicar
</button>

              </div>

              {nuevoPedido.cuponAplicado && nuevoPedido.descuento >= 0 && (
                <p className="text-green-400 text-sm mb-2">
                  Cupón aplicado: <strong>{nuevoPedido.cuponAplicado}</strong> – {nuevoPedido.descuento}% OFF
                </p>
              )}

              {user?.rol === "admin" && (
                <>
                  <label className="block mb-2 mt-4">🔢 Descuento % (manual, solo admin):</label>
                  <input
                    type="number"
                    placeholder="Ej: 10"
                    value={nuevoPedido.descuento || ""}
                    onChange={(e) =>
                      setNuevoPedido({ ...nuevoPedido, descuento: parseInt(e.target.value) || 0 })
                    }
                    className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
                  />
                </>
              )}



            <ul className="text-white text-sm mb-4">
              {nuevoPedido.productos.map((p, idx) => (
                <li key={idx}>🔹 {p.title} x{p.cantidad} - ${p.price}</li>
              ))}
            </ul>

            {nuevoPedido.cuponAplicado && (
              <p className="text-green-400 text-sm mt-2">
                Cupón aplicado: <strong>{nuevoPedido.cuponAplicado}</strong> – {nuevoPedido.descuento || 0}% OFF
              </p>
            )}

            <button
              onClick={crearPedidoManual}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Confirmar Pedido
            </button>
            <button
              onClick={() => setModalCrearPedido(false)}
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
