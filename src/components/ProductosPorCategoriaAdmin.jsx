// src/components/ProductosPorCategoriaAdmin.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function ProductosPorCategoriaAdmin() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductos(datos);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };
    fetchProductos();
  }, []);

  const productosPorCategoria = productos.reduce((acc, prod) => {
    const categoria = prod.categoria || "Sin categoría";
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(prod);
    return acc;
  }, {});

  const exportarPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text("Reporte de productos agrupados por categoría", 10, y);
    y += 10;

    Object.entries(productosPorCategoria).forEach(([categoria, items]) => {
      doc.setFontSize(12);
      doc.text(`Categoría: ${categoria}`, 10, y);
      y += 6;
      autoTable(doc, {
        head: [["ID", "Título", "Categoría", "Precio", "Stock"]],
        body: productos.map((p) => [p.id, p.title, p.categoria, p.price, p.stock]),
        startY: 20
      });
      
      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save("productos_por_categoria.pdf");
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-400">📦 Productos por Categoría</h2>
        <button
          onClick={exportarPDF}
          className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded"
        >
          Exportar PDF
        </button>
      </div>

      {Object.entries(productosPorCategoria).map(([categoria, items]) => (
        <div key={categoria} className="mb-6">
          <h3 className="text-lg text-amber-300 font-semibold mb-2">📂 {categoria}</h3>
          <table className="w-full text-sm mb-2">
            <thead className="text-amber-300">
              <tr>
                <th>ID</th><th>Título</th><th>Precio</th><th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-700">
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
