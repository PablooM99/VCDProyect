// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [homeTitle, setHomeTitle] = useState("Bienvenido al E-commerce");
  const [homeDescription, setHomeDescription] = useState(
    "Explora nuestros productos destacados, agrégalos al carrito y realizá tus pedidos de forma fácil, rápida y segura. ¡Disfrutá de una experiencia de compra moderna con tonos oscuros y elegantes!"
  );
  const [bannerURL, setBannerURL] = useState("");

  useEffect(() => {
    const fetchContenido = async () => {
      try {
        const contenidoDoc = await getDoc(doc(db, "contenidoSitio", "general"));
        if (contenidoDoc.exists()) {
          const data = contenidoDoc.data();

          if (data.homeTitle) setHomeTitle(data.homeTitle);
          if (data.homeDescription) setHomeDescription(data.homeDescription);
          if (data.bannerURL) setBannerURL(data.bannerURL);
          if (data.marcasURLs?.length) setMarcas(data.marcasURLs);

          const idsDestacados = data.destacados || [];
          if (idsDestacados.length > 0) {
            const snap = await getDocs(collection(db, "productos"));
            const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const filtrados = todos.filter((p) => idsDestacados.includes(p.id));
            setProductosDestacados(filtrados);
          }
        }
      } catch (err) {
        console.error("Error cargando contenido del Home:", err);
      }
    };

    fetchContenido();
  }, []);

  const esURLValida = (url) =>
    typeof url === "string" &&
    (url.startsWith("https://") || url.startsWith("http://")) &&
    !url.startsWith("data:image/jpeg");

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      {/* 🖼 Banner superior si es válido */}
      {esURLValida(bannerURL) && (
        <div className="mb-10">
          <img
            src={bannerURL}
            alt="Banner principal"
            className="w-full h-64 object-cover rounded shadow"
          />
        </div>
      )}

      {/* 🏠 Título y descripción */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-amber-400 mb-4">
          {homeTitle}
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {homeDescription}
        </p>
      </div>

      {/* 🎯 Carrusel Productos Destacados */}
      {productosDestacados.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl text-amber-300 font-semibold mb-4">
            🎯 Productos Destacados
          </h2>
          <div className="overflow-hidden w-full">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                duration: 30,
                ease: "linear",
              }}
            >
              {[...productosDestacados, ...productosDestacados].map(
                (prod, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 rounded shadow p-4 min-w-[240px] max-w-[240px] flex-shrink-0"
                  >
                    <img
                      src={
                        prod.imageURLs?.[0] ||
                        prod.imageURL ||
                        "https://via.placeholder.com/300"
                      }
                      alt={prod.title}
                      className="w-full h-40 object-contain bg-white rounded mb-2"
                    />
                    <h3 className="text-sm font-semibold">{prod.title}</h3>
                    <p className="text-amber-400 mb-2">${prod.price}</p>
                    <Link
                      to={`/producto/${prod.id}`}
                      className="bg-amber-600 hover:bg-amber-700 px-4 py-1 rounded text-sm"
                    >
                      Ver más
                    </Link>
                  </div>
                )
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* 🏷 Carrusel Marcas */}
      {marcas.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl text-amber-300 font-semibold mb-4">
            🏷 Marcas destacadas
          </h2>
          <div className="overflow-hidden w-full">
            <motion.div
              className="flex gap-10 items-center w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                duration: 40,
                ease: "linear",
              }}
            >
              {[...marcas, ...marcas].map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Marca ${idx}`}
                  className="object-contain h-20 w-auto max-w-[160px] bg-white p-2 rounded"
                />
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
