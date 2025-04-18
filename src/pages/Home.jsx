// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";

export default function Home() {
  const [destacados, setDestacados] = useState([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchDestacados = async () => {
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const productos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDestacados(productos.slice(0, 6));
      } catch (error) {
        console.error("Error al cargar productos destacados:", error);
      }
    };
    fetchDestacados();
  }, []);

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-amber-400 mb-4">
          Bienvenido al E-commerce
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Explora nuestros productos destacados, agregalos al carrito y realizá tus pedidos de forma fácil, rápida y segura. ¡Disfrutá de una experiencia de compra moderna con tonos oscuros y elegantes!
        </p>
      </div>

      {/* 🛒 Carrusel Productos Destacados */}
      <div className="mb-12">
        <h2 className="text-2xl text-amber-300 font-semibold mb-4">
          🎯 Productos Destacados
        </h2>
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <motion.div
            className="flex gap-4"
            animate={{ x: ["0%", "-100%"] }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: "linear",
              pause: isHovering,
            }}
          >
            {[...destacados, ...destacados].map((prod, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-900 rounded shadow p-4 min-w-[240px]"
              >
                <img
                  src={
                    prod.imageURLs?.[0] ||
                    prod.imageURL ||
                    "https://via.placeholder.com/300"
                  }
                  alt={prod.title}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                <h3 className="text-lg font-semibold">{prod.title}</h3>
                <p className="text-amber-400 mb-2">${prod.price}</p>
                <Link
                  to={`/producto/${prod.id}`}
                  className="bg-amber-600 hover:bg-amber-700 px-4 py-1 rounded text-sm"
                >
                  Ver más
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 🏷 Carrusel Marcas Destacadas */}
      <div className="mb-12">
        <h2 className="text-2xl text-amber-300 font-semibold mb-4">
          🏷 Marcas destacadas
        </h2>
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-10 items-center"
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          >
            {[
              "../brand1.png",
              "../brand2.png",
              "../brand3.png",
              "../brand4.png",
              "../brand1.png",
              "../brand2.png",
              "../brand3.png",
              "../brand4.png",
            ].map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Marca ${idx}`}
                className="object-contain h-20 w-auto"
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
