import { useState, useEffect } from "react";
import { db, storage } from "../firebase/config";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function ProductoAdmin() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState({
    id: "", title: "", price: 0, categoria: "", stock: 0, imageFile: null, imageUrl: ""
  });
  const [imagenesEditadas, setImagenesEditadas] = useState({});
  const [metricas, setMetricas] = useState({
    totalProductos: 0, totalStock: 0, promedioPrecio: 0, productosSinStock: 0, categoriaTop: ""
  });

  const calcularMetricas = (productos) => {
    const totalProductos = productos.length;
    const totalStock = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
    const promedioPrecio = totalProductos > 0
      ? productos.reduce((acc, p) => acc + (p.price || 0), 0) / totalProductos
      : 0;
    const productosSinStock = productos.filter((p) => !p.stock || p.stock === 0).length;

    const categoriaCount = productos.reduce((acc, p) => {
      if (!p.categoria) return acc;
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {});
    const categoriaTop = Object.entries(categoriaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    setMetricas({ totalProductos, totalStock, promedioPrecio, productosSinStock, categoriaTop });
  };

  const cargarProductosDesdeFirestore = async () => {
    try {
      const snapshot = await getDocs(collection(db, "productos"));
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(datos);
      calcularMetricas(datos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  useEffect(() => {
    cargarProductosDesdeFirestore();
  }, []);

  const handleDelete = async (id) => {
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar este producto?");
    if (!confirmacion) return;

    try {
      const producto = productos.find(p => p.id === id);

      if (producto?.storagePath) {
        const imgRef = ref(storage, producto.storagePath);
        await deleteObject(imgRef);
      }

      await deleteDoc(doc(db, "productos", id));

      const filtrados = productos.filter((p) => p.id !== id);
      setProductos(filtrados);
      calcularMetricas(filtrados);

      alert("✅ Producto eliminado correctamente.");
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      alert("❌ No se pudo eliminar el producto.");
    }
  };

  const handleChange = (e, id, campo) => {
    const actualizados = productos.map((p) =>
      p.id === id
        ? {
            ...p,
            [campo]: campo === "price" || campo === "stock" ? Number(e.target.value) : e.target.value
          }
        : p
    );
    setProductos(actualizados);
    calcularMetricas(actualizados);
  };

  const handleImageEdit = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      setImagenesEditadas((prev) => ({ ...prev, [id]: file }));
    }
  };

  const handleNuevoChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      setNuevoProducto((prev) => ({ ...prev, imageFile: files[0] }));
    } else {
      setNuevoProducto((prev) => ({
        ...prev,
        [name]: name === "price" || name === "stock" ? Number(value) : value
      }));
    }
  };

  const agregarProducto = async () => {
    const { id, title, price, categoria, stock, imageFile, imageUrl } = nuevoProducto;
    if (!id || !title) return alert("Los campos ID y título son obligatorios");

    try {
      let imageURL = imageUrl || "";
      let storagePath = "";

      if (imageFile) {
        const extension = imageFile.name.split(".").pop();
        storagePath = `productos/${id}.${extension}`;
        const imgRef = ref(storage, storagePath);
        await uploadBytes(imgRef, imageFile);
        imageURL = await getDownloadURL(imgRef);
      }

      const nuevo = { id, title, price, categoria, stock, imageURL, storagePath };
      const refDoc = doc(collection(db, "productos"), id);
      await setDoc(refDoc, nuevo);
      const nuevos = [...productos, nuevo];
      setProductos(nuevos);
      calcularMetricas(nuevos);
      setNuevoProducto({ id: "", title: "", price: 0, categoria: "", stock: 0, imageFile: null, imageUrl: "" });
      alert("✅ Producto agregado correctamente.");
    } catch (error) {
      console.error("Error al agregar producto:", error);
      alert("❌ Error al agregar el producto");
    }
  };

  const handleSync = async () => {
    const colRef = collection(db, "productos");
    for (const p of productos) {
      try {
        const refDoc = doc(colRef, p.id);
        await setDoc(refDoc, p);
      } catch (error) {
        console.error(`Error al subir el producto ${p.id}:`, error);
      }
    }
    alert("✅ Productos subidos a Firestore correctamente.");
  };

  const subirImagenesEditadas = async () => {
    try {
      const colRef = collection(db, "productos");
      const actualizados = await Promise.all(productos.map(async (prod) => {
        if (imagenesEditadas[prod.id]) {
          const extension = imagenesEditadas[prod.id].name.split(".").pop();
          const storagePath = `productos/${prod.id}.${extension}`;
          const imgRef = ref(storage, storagePath);
          await uploadBytes(imgRef, imagenesEditadas[prod.id]);
          const imageURL = await getDownloadURL(imgRef);
          const actualizado = { ...prod, imageURL, storagePath };
          await setDoc(doc(colRef, prod.id), actualizado);
          return actualizado;
        }
        return prod;
      }));
      setProductos(actualizados);
      setImagenesEditadas({});
      calcularMetricas(actualizados);
      alert("✅ Imágenes actualizadas correctamente.");
    } catch (error) {
      console.error("❌ Error al subir imágenes:", error);
      alert("❌ Error al subir una o más imágenes.");
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideTitulo = p.title.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro ? p.categoria === categoriaFiltro : true;
    return coincideTitulo && coincideCategoria;
  });

  const categoriasUnicas = [...new Set(productos.map((p) => p.categoria))];

  return (
    <div className="mb-6 bg-gray-800 p-4 rounded">
      <h2 className="text-xl text-white font-bold mb-4">📊 Dashboard de Métricas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded text-center">
          <h4 className="text-amber-300 font-bold">Total Productos</h4>
          <p className="text-2xl font-bold">{metricas.totalProductos}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center">
          <h4 className="text-amber-300 font-bold">Stock Total</h4>
          <p className="text-2xl font-bold">{metricas.totalStock}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center">
          <h4 className="text-amber-300 font-bold">Precio Promedio</h4>
          <p className="text-2xl font-bold">${metricas.promedioPrecio.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center">
          <h4 className="text-amber-300 font-bold">Sin Stock</h4>
          <p className="text-2xl font-bold">{metricas.productosSinStock}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center">
          <h4 className="text-amber-300 font-bold">Top Categoría</h4>
          <p className="text-2xl font-bold">{metricas.categoriaTop}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar por título..."
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
        <button onClick={() => { setBusqueda(""); setCategoriaFiltro(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
          Limpiar Filtros
        </button>
        <button onClick={subirImagenesEditadas} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Subir Imágenes Editadas
        </button>
        <button onClick={handleSync} className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">
          Subir al Firestore
        </button>
      </div>

      <div className="mb-6 bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold text-amber-300 mb-2">➕ Nuevo Producto</h3>
        <div className="grid md:grid-cols-7 gap-2">
          <input name="id" placeholder="ID" value={nuevoProducto.id} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="title" placeholder="Título" value={nuevoProducto.title} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="price" type="number" placeholder="Precio" value={nuevoProducto.price} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="categoria" placeholder="Categoría" value={nuevoProducto.categoria} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="stock" type="number" placeholder="Stock" value={nuevoProducto.stock} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="imageUrl" type="text" placeholder="URL de imagen (opcional)" value={nuevoProducto.imageUrl} onChange={handleNuevoChange} className="p-2 rounded bg-gray-700 text-white" />
          <input name="imageFile" type="file" accept="image/*" onChange={handleNuevoChange} className="text-white" />
        </div>
        <button onClick={agregarProducto} className="mt-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">
          Agregar Producto
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-amber-300">
            <tr>
              <th>ID</th><th>Título</th><th>Precio</th><th>Categoría</th><th>Stock</th><th>Imagen</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-gray-700">
                <td>{p.id}</td>
                <td><input value={p.title} onChange={(e) => handleChange(e, p.id, "title")} className="bg-gray-800 px-2 w-full" /></td>
                <td><input type="number" value={p.price} onChange={(e) => handleChange(e, p.id, "price")} className="bg-gray-800 px-2 w-full" /></td>
                <td><input value={p.categoria} onChange={(e) => handleChange(e, p.id, "categoria")} className="bg-gray-800 px-2 w-full" /></td>
                <td><input type="number" value={p.stock} onChange={(e) => handleChange(e, p.id, "stock")} className="bg-gray-800 px-2 w-full" /></td>
                <td><input type="file" accept="image/*" onChange={(e) => handleImageEdit(e, p.id)} className="text-white" /></td>
                <td>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">
                    Eliminar
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
