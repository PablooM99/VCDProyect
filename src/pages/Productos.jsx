// src/pages/Productos.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { useFavoritos } from "../context/FavoritosContext";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [mostrar, setMostrar] = useState(8);
  const [cantidades, setCantidades] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState([]);

  const { addToCart } = useCart();
  const loaderRef = useRef();

  const { toggleFavorito, isFavorito } = useFavoritos();



  const filtrarUnicos = (array) => {
    const vistos = new Set();
    return array.filter((item) => {
      if (vistos.has(item.id)) return false;
      vistos.add(item.id);
      return true;
    });
  };

  useEffect(() => {
    const cargarProductos = async () => {
      NProgress.start();
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const datos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const unicos = filtrarUnicos(datos);
        setProductos(unicos);
        setCategorias([...new Set(unicos.map((p) => p.categoria))]);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        NProgress.done();
      }
    };

    cargarProductos();
  }, []);

  const handleCantidadChange = (id, cantidad) => {
    setCantidades((prev) => ({ ...prev, [id]: Number(cantidad) }));
  };

  const agregarAlCarrito = (producto) => {
    const cantidad = cantidades[producto.id] || 1;
    for (let i = 0; i < cantidad; i++) {
      addToCart(producto);
    }
  };

  const exportarExcel = () => {
    const datosParaExcel = productos.map((p) => ({
      ID: p.id,
      Título: p.title,
      Categoría: p.categoria,
      Precio: p.price,
    }));
    const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Precios");
    XLSX.writeFile(workbook, "lista_precios.xlsx");
  };

  const productosFiltrados = productos
    .filter((prod) =>
      prod.title.toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter((prod) =>
      categoriaFiltro ? prod.categoria === categoriaFiltro : true
    );

  const productosAMostrar = productosFiltrados.slice(0, mostrar);

  const cargarMasProductos = useCallback(() => {
    setMostrar((prev) => prev + 8);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cargarMasProductos();
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [cargarMasProductos]);

  return (
    <motion.div
      className="p-4 md:p-8 text-white bg-gray-950 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-2xl font-bold text-amber-400 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        🛒 Productos Disponibles
      </motion.h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-1/3"
        />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-1/3"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setBusqueda("");
            setCategoriaFiltro("");
          }}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
        >
          Limpiar Filtros
        </button>
        <button
          onClick={exportarExcel}
          className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-black"
        >
          📄 Lista de precios (Excel)
        </button>
      </div>

      <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4">
        {productosAMostrar.map((prod) => (
          <motion.div
            key={prod.id}
            className="relative bg-gray-800 p-4 rounded shadow hover:shadow-lg transition flex flex-col justify-between"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={
                prod.imageURLs?.[0] || prod.imageURL || "https://via.placeholder.com/150"
              }
              alt={prod.title}
              className="w-full h-48 object-cover bg-gray-900 rounded mb-2"
            />
            <button
              onClick={() => toggleFavorito(prod)}
              className={`text-xl absolute top-2 right-2 ${
                  isFavorito(prod.id) ? "text-red-500" : "text-white"
               }`}
                >
                ❤️
              </button>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-300">{prod.title}</h3>
              <p className="text-sm text-gray-300 mb-1">{prod.categoria}</p>
              <p className="text-white font-semibold mb-2">${prod.price}</p>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="number"
                  min={1}
                  value={cantidades[prod.id] || 1}
                  onChange={(e) => handleCantidadChange(prod.id, e.target.value)}
                  className="w-16 text-center bg-gray-700 text-white rounded p-1"
                />
                <button
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded"
                >
                  Agregar
                </button>
              </div>
              <Link
                to={`/producto/${prod.id}`}
                className="inline-block text-sm text-amber-400 hover:underline"
              >
                🔍 Ver detalles
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div ref={loaderRef} className="h-10 mt-10"></div>
    </motion.div>
  );
}
