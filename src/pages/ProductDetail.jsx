// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/config";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [producto, setProducto] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [puedeComentar, setPuedeComentar] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [imagenActiva, setImagenActiva] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const cargarProducto = async () => {
      const ref = doc(db, "productos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProducto(data);
        setImagenActiva(data.imageURL || "https://via.placeholder.com/300");
      }
    };

    const cargarComentarios = async () => {
      const q = query(collection(db, "comentarios"), where("productoId", "==", id));
      const snap = await getDocs(q);
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComentarios(datos);
    };

    const verificarCompra = async () => {
      if (!user) return;
      const q = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const haComprado = snap.docs.some((d) => {
        const items = d.data().productos || [];
        return items.some((item) => item.id === id);
      });
      setPuedeComentar(haComprado);
    };

    cargarProducto();
    cargarComentarios();
    verificarCompra();
  }, [id, user]);

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    try {
      const ref = collection(db, "comentarios");
      await addDoc(ref, {
        productoId: id,
        userId: user.uid,
        userEmail: user.email,
        comentario: nuevoComentario,
        fecha: Timestamp.now(),
      });
      setNuevoComentario("");
      setComentarios((prev) => [
        ...prev,
        {
          productoId: id,
          userId: user.uid,
          userEmail: user.email,
          comentario: nuevoComentario,
          fecha: Timestamp.now(),
        },
      ]);
    } catch (error) {
      console.error("Error al comentar:", error);
    }
  };

  const handleAgregarAlCarrito = () => {
    if (producto && cantidad > 0) {
      for (let i = 0; i < cantidad; i++) {
        addToCart(producto);
      }
    }
  };

  if (!producto) return <p className="text-white">Cargando producto...</p>;

  const imagenes = [producto.imageURL, ...(producto.imageURLs || [])];

  return (
    <motion.div
      className="p-4 text-white bg-gray-950 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-gray-800 p-6 rounded mb-6 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-amber-400 mb-4 text-center">{producto.title}</h2>
  
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Galería lateral */}
          {imagenes.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
              {imagenes.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  loading="lazy"
                  onClick={() => setImagenActiva(img)}
                  className={`w-20 h-20 object-cover rounded border-2 cursor-pointer ${
                    img === imagenActiva ? "border-amber-500" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          )}
  
          {/* Imagen principal */}
          <div className="flex justify-center">
            <img
              src={imagenActiva}
              alt={producto.title}
              loading="lazy"
              onClick={() => setMostrarModal(true)}
              className="w-full max-w-md h-96 object-contain rounded bg-gray-900 cursor-zoom-in transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
  
        {/* Info producto */}
        <div className="mt-6 text-center">
          <p><strong>Categoría:</strong> {producto.categoria}</p>
          <p><strong>Precio:</strong> ${producto.price}</p>
          <p><strong>Stock:</strong> {producto.stock}</p>
  
          <div className="flex justify-center gap-4 mt-4">
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-16 text-center bg-gray-700 text-white rounded p-1"
            />
            <button
              onClick={handleAgregarAlCarrito}
              className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </motion.div>
  
      {/* Comentarios */}
      <motion.div
        className="bg-gray-800 p-6 rounded mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-amber-300 mb-3">💬 Comentarios</h3>
  
        {comentarios.length === 0 ? (
          <p className="text-gray-400">Aún no hay comentarios para este producto.</p>
        ) : (
          <ul className="space-y-2">
            {comentarios.map((c) => (
              <li key={c.id} className="bg-gray-900 p-3 rounded">
                <p className="text-sm text-gray-400">{c.userEmail}</p>
                <p className="text-white">{c.comentario}</p>
              </li>
            ))}
          </ul>
        )}
  
        {user ? (
          puedeComentar ? (
            <div className="mt-4">
              <textarea
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full bg-gray-900 text-white p-2 rounded"
              />
              <button
                onClick={enviarComentario}
                className="mt-2 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-black"
              >
                Enviar
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              Solo los usuarios que hayan comprado este producto pueden comentar.
            </p>
          )
        ) : (
          <p className="text-sm text-gray-500 mt-4">
            Debes iniciar sesión para dejar un comentario.
          </p>
        )}
      </motion.div>
  
      {/* Modal de imagen ampliada */}
      {mostrarModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setMostrarModal(false)}
        >
          <img
            src={imagenActiva}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain p-4"
          />
        </div>
      )}
    </motion.div>
  );
  
}
