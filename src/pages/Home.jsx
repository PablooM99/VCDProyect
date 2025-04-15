// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Home() {
  const [destacados, setDestacados] = useState([]);

  useEffect(() => {
    const fetchDestacados = async () => {
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const productos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
        <h1 className="text-3xl md:text-5xl font-bold text-amber-400 mb-4">Bienvenido al E-commerce</h1>
        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Explora nuestros productos destacados, agregalos al carrito y realizá tus pedidos de forma fácil, rápida y segura. ¡Disfrutá de una experiencia de compra moderna con tonos oscuros y elegantes!
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl text-amber-300 font-semibold mb-4">🎯 Productos Destacados</h2>
        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-4">
            {destacados.map(prod => (
              <div key={prod.id} className="inline-block bg-gray-900 rounded shadow p-4 min-w-[240px]">
                <img src={prod.imageURL} alt={prod.title} className="w-full h-40 object-cover rounded mb-2" />
                <h3 className="text-lg font-semibold">{prod.title}</h3>
                <p className="text-amber-400 mb-2">${prod.price}</p>
                <Link
                  to="/Productos"
                  className="bg-amber-600 hover:bg-amber-700 px-4 py-1 rounded text-sm"
                >
                  Ver más
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl text-amber-300 font-semibold mb-4">🏷 Marcas destacadas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <img src="../brand1.png" alt="Marca 1" className="object-contain h-20 mx-auto" />
          <img src="../brand2.png" alt="Marca 2" className="object-contain h-20 mx-auto" />
          <img src="../brand3.png" alt="Marca 3" className="object-contain h-20 mx-auto" />
          <img src="../brand4.png" alt="Marca 4" className="object-contain h-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}
