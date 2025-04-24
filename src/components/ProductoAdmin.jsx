// src/components/ProductoAdmin.jsx
import { useState, useEffect } from "react";
import { db, storage } from "../firebase/config";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

export default function ProductoAdmin() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [imagenesAdicionales, setImagenesAdicionales] = useState({});
  const [nuevoProducto, setNuevoProducto] = useState({
    id: "",
    title: "",
    price: 0,
    costo: 0,
    categoria: "",
    subcategoria: "",
    marca: "",
    stock: 0,
    imageFiles: [],
    imageUrls: [],
  });
  const { user } = useAuth();

  useEffect(() => {
    cargarProductos();
  }, []);

  const registrarLog = async (tipo, descripcion) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "logs"), {
        tipo,
        entidad: "producto",
        descripcion,
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al registrar log:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const snap = await getDocs(collection(db, "productos"));
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(datos);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleNuevoChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFiles") {
      setNuevoProducto((prev) => ({ ...prev, imageFiles: Array.from(files) }));
    } else if (name === "imageUrls") {
      setNuevoProducto((prev) => ({
        ...prev,
        imageUrls: value.split(",").map((url) => url.trim()),
      }));
    } else {
      setNuevoProducto((prev) => ({
        ...prev,
        [name]: ["price", "stock", "costo"].includes(name) ? Number(value) : value,
      }));
    }
  };

  const agregarProducto = async () => {
    const {
      id,
      title,
      price,
      costo,
      categoria,
      subcategoria,
      marca,
      stock,
      imageFiles,
      imageUrls,
    } = nuevoProducto;

    if (!id || !title) {
      return Swal.fire("❌ Faltan datos obligatorios", "ID y título son requeridos", "warning");
    }

    try {
      let imageArray = [...imageUrls];
      for (const file of imageFiles) {
        const path = `productos/${id}/${file.name}`;
        const refImg = ref(storage, path);
        await uploadBytes(refImg, file);
        const url = await getDownloadURL(refImg);
        imageArray.push(url);
      }

      const nuevo = {
        id,
        title,
        price,
        costo,
        categoria,
        subcategoria,
        marca,
        stock,
        imageURLs: imageArray,
      };

      await setDoc(doc(db, "productos", id), nuevo);
      await registrarLog("creación", `Se creó el producto "${title}" (ID: ${id})`);

      setProductos((prev) => [...prev, nuevo]);
      Swal.fire("✅ Producto agregado con éxito", "", "success");

      setNuevoProducto({
        id: "",
        title: "",
        price: 0,
        costo: 0,
        categoria: "",
        subcategoria: "",
        marca: "",
        stock: 0,
        imageFiles: [],
        imageUrls: [],
      });
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  const eliminarProducto = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará el producto permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "productos", id));
        setProductos((prev) => prev.filter((p) => p.id !== id));
        Swal.fire("✅ Producto eliminado correctamente", "", "success");
        await registrarLog("eliminación", `Se eliminó el producto con ID: ${id}`);
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    }
  };

  const agregarImagenAExistente = async (id, fileOrUrl) => {
    try {
      const refDoc = doc(db, "productos", id);
      const producto = productos.find((p) => p.id === id);
      let nuevas = [];

      if (typeof fileOrUrl === "string") {
        nuevas.push(fileOrUrl);
      } else {
        const path = `productos/${id}/${fileOrUrl.name}`;
        const refImg = ref(storage, path);
        await uploadBytes(refImg, fileOrUrl);
        const url = await getDownloadURL(refImg);
        nuevas.push(url);
      }

      const actualizado = {
        ...producto,
        imageURLs: [...(producto.imageURLs || []), ...nuevas],
      };

      await setDoc(refDoc, actualizado);
      setProductos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      alert("✅ Imagen agregada.");
      await registrarLog("edición", `Se agregó imagen a producto "${producto.title}" (ID: ${producto.id})`);
    } catch (error) {
      console.error("Error al agregar imagen:", error);
    }
  };

  const handleAgregarImagenURL = (id, url) => {
    if (!url.trim()) return;
    agregarImagenAExistente(id, url.trim());
    setImagenesAdicionales((prev) => ({ ...prev, [id]: "" }));
  };

  const handleEditChange = (e, id, campo) => {
    const actualizado = productos.map((p) =>
      p.id === id
        ? {
            ...p,
            [campo]: ["price", "stock", "costo"].includes(campo) ? Number(e.target.value) : e.target.value,
          }
        : p
    );
    setProductos(actualizado);
  };

  const handleSync = async () => {
    try {
      const colRef = collection(db, "productos");
      for (const prod of productos) {
        await setDoc(doc(colRef, prod.id), prod);
      }
      alert("✅ Cambios sincronizados con Firestore");
      await registrarLog("edición", "Se sincronizaron los productos editados");
    } catch (error) {
      console.error("Error al sincronizar:", error);
    }
  };

  const exportarExcel = () => {
    const data = productos.map(p => ({
      ID: p.id,
      Título: p.title,
      Marca: p.marca || "",
      Subcategoría: p.subcategoria || "",
      Categoría: p.categoria,
      "Precio compra": p.costo || 0,
      "Precio venta": p.price,
      Stock: p.stock,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    XLSX.writeFile(workbook, "lista_de_precios.xlsx");
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = p.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.title.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro ? p.categoria === categoriaFiltro : true;
    return coincideTexto && coincideCategoria;
  });

  const categoriasUnicas = [...new Set(productos.map((p) => p.categoria))];

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h2 className="text-2xl font-bold text-amber-400 mb-4">🎛️ Administrar Productos</h2>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6 bg-gray-900 p-4 rounded">
        <input type="text" name="id" value={nuevoProducto.id} onChange={handleNuevoChange} placeholder="ID" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="text" name="title" value={nuevoProducto.title} onChange={handleNuevoChange} placeholder="Título" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="number" name="costo" value={nuevoProducto.costo} onChange={handleNuevoChange} placeholder="Precio de compra" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="number" name="price" value={nuevoProducto.price} onChange={handleNuevoChange} placeholder="Precio de venta" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="number" name="stock" value={nuevoProducto.stock} onChange={handleNuevoChange} placeholder="Stock disponible" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="text" name="categoria" value={nuevoProducto.categoria} onChange={handleNuevoChange} placeholder="Categoría" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="text" name="subcategoria" value={nuevoProducto.subcategoria} onChange={handleNuevoChange} placeholder="Subcategoría" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="text" name="marca" value={nuevoProducto.marca} onChange={handleNuevoChange} placeholder="Marca" className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="text" name="imageUrls" placeholder="URLs (separadas por coma)" onChange={handleNuevoChange} className="bg-gray-700 text-white p-2 rounded w-full" />
        <input type="file" name="imageFiles" multiple accept="image/*" onChange={handleNuevoChange} className="text-sm" />
        <button onClick={agregarProducto} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded font-bold mt-2 md:mt-0">➕ Agregar Producto</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar por título, ID o palabra"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded w-full sm:w-auto"
        />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded w-full sm:w-auto"
        >
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={() => { setBusqueda(""); setCategoriaFiltro(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">Limpiar filtros</button>
        <button onClick={handleSync} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">💾 Subir Cambios</button>
        <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">📥 Exportar Excel</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-amber-300">
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Marca</th>
              <th>Subcategoría</th>
              <th>Categoría</th>
              <th>Precio compra</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Imagen Principal</th>
              <th>Agregar Imagen</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-gray-700">
                <td><input value={p.id} onChange={(e) => handleEditChange(e, p.id, "id")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input value={p.title} onChange={(e) => handleEditChange(e, p.id, "title")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input value={p.marca || ""} onChange={(e) => handleEditChange(e, p.id, "marca")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input value={p.subcategoria || ""} onChange={(e) => handleEditChange(e, p.id, "subcategoria")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input value={p.categoria || ""} onChange={(e) => handleEditChange(e, p.id, "categoria")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input type="number" value={p.costo || 0} onChange={(e) => handleEditChange(e, p.id, "costo")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input type="number" value={p.price || 0} onChange={(e) => handleEditChange(e, p.id, "price")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input type="number" value={p.stock || 0} onChange={(e) => handleEditChange(e, p.id, "stock")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td>
                  <img
                    src={p.imageURLs?.[0] || "https://via.placeholder.com/150"}
                    alt={p.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="URL..."
                    value={imagenesAdicionales[p.id] || ""}
                    onChange={(e) =>
                      setImagenesAdicionales((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="bg-gray-700 rounded px-2 py-1 mb-1 text-sm"
                  />
                  <button
                    onClick={() => handleAgregarImagenURL(p.id, imagenesAdicionales[p.id])}
                    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-sm rounded mt-1 block"
                  >
                    ➕ Agregar
                  </button>
                </td>
                <td>
                  {user?.rol === "admin" ? (
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm rounded"
                    >
                      🗑️ Borrar
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs italic">Sin permisos</span>
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
