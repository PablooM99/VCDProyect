// src/components/ProductoAdmin.jsx
import { useState, useEffect } from "react";
import { db, storage } from "../firebase/config";
import {
  collection,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import * as XLSX from "xlsx";

export default function ProductoAdmin() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [imagenesAdicionales, setImagenesAdicionales] = useState({});
  const [nuevoProducto, setNuevoProducto] = useState({
    id: "",
    title: "",
    price: 0,
    categoria: "",
    stock: 0,
    imageFiles: [],
    imageUrls: [],
  });
  const [metricas, setMetricas] = useState({
    totalProductos: 0,
    totalStock: 0,
    promedioPrecio: 0,
    productosSinStock: 0,
    categoriaTop: "",
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const snap = await getDocs(collection(db, "productos"));
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(datos);
      calcularMetricas(datos);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const calcularMetricas = (productos) => {
    const totalProductos = productos.length;
    const totalStock = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
    const promedioPrecio =
      totalProductos > 0
        ? productos.reduce((acc, p) => acc + (p.price || 0), 0) / totalProductos
        : 0;
    const productosSinStock = productos.filter((p) => !p.stock || p.stock === 0).length;
    const categoriaCount = productos.reduce((acc, p) => {
      if (!p.categoria) return acc;
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {});
    const categoriaTop = Object.entries(categoriaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    setMetricas({
      totalProductos,
      totalStock,
      promedioPrecio,
      productosSinStock,
      categoriaTop,
    });
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
        [name]: name === "price" || name === "stock" ? Number(value) : value,
      }));
    }
  };

  const agregarProducto = async () => {
    const {
      id,
      title,
      price,
      categoria,
      stock,
      imageFiles,
      imageUrls,
    } = nuevoProducto;

    if (!id || !title) return alert("Faltan datos obligatorios");

    try {
      let imageArray = [...imageUrls];
      for (const file of imageFiles) {
        const path = `productos/${id}/${file.name}`;
        const refImg = ref(storage, path);
        await uploadBytes(refImg, file);
        const url = await getDownloadURL(refImg);
        imageArray.push(url);
      }

      const nuevo = { id, title, price, categoria, stock, imageURLs: imageArray };
      await setDoc(doc(db, "productos", id), nuevo);

      const nuevos = [...productos, nuevo];
      setProductos(nuevos);
      calcularMetricas(nuevos);
      alert("✅ Producto agregado con éxito.");

      setNuevoProducto({
        id: "",
        title: "",
        price: 0,
        categoria: "",
        stock: 0,
        imageFiles: [],
        imageUrls: [],
      });
    } catch (error) {
      console.error("Error al guardar producto:", error);
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
            [campo]: campo === "price" || campo === "stock" ? Number(e.target.value) : e.target.value,
          }
        : p
    );
    setProductos(actualizado);
    calcularMetricas(actualizado);
  };

  const handleSync = async () => {
    try {
      const colRef = collection(db, "productos");
      for (const prod of productos) {
        await setDoc(doc(colRef, prod.id), prod);
      }
      alert("✅ Cambios sincronizados con Firestore");
    } catch (error) {
      console.error("Error al sincronizar:", error);
    }
  };

  const exportarExcel = () => {
    const data = productos.map(p => ({
      ID: p.id,
      Título: p.title,
      Categoría: p.categoria,
      Precio: p.price,
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-center">
        <div className="bg-gray-900 p-4 rounded"><h4>Total</h4><p className="text-xl font-bold">{metricas.totalProductos}</p></div>
        <div className="bg-gray-900 p-4 rounded"><h4>Stock</h4><p className="text-xl font-bold">{metricas.totalStock}</p></div>
        <div className="bg-gray-900 p-4 rounded"><h4>Promedio</h4><p className="text-xl font-bold">${metricas.promedioPrecio.toFixed(2)}</p></div>
        <div className="bg-gray-900 p-4 rounded"><h4>Sin Stock</h4><p className="text-xl font-bold">{metricas.productosSinStock}</p></div>
        <div className="bg-gray-900 p-4 rounded"><h4>Top Categoría</h4><p className="text-xl font-bold">{metricas.categoriaTop}</p></div>
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
        <button
          onClick={() => {
            setBusqueda("");
            setCategoriaFiltro("");
          }}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
        >
          Limpiar filtros
        </button>
        <button
          onClick={handleSync}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          💾 Subir Cambios
        </button>
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          📥 Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-amber-300">
              <th>ID</th><th>Título</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Imagen Principal</th><th>Agregar Imagen (URL)</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-gray-700">
                <td>{p.id}</td>
                <td><input value={p.title} onChange={(e) => handleEditChange(e, p.id, "title")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input type="number" value={p.price} onChange={(e) => handleEditChange(e, p.id, "price")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input type="number" value={p.stock} onChange={(e) => handleEditChange(e, p.id, "stock")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
                <td><input value={p.categoria} onChange={(e) => handleEditChange(e, p.id, "categoria")} className="bg-gray-800 text-white px-2 w-full rounded" /></td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
