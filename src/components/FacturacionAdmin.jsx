// src/components/FacturacionAdmin.jsx
import { useState } from "react";
import RemitosAdmin from "./RemitosAdmin";
import FacturasAdmin from "./FacturasAdmin";
import NotasCreditoAdmin from "./NotasCreditoAdmin";
import AfipAdmin from "./AfipAdmin";

export default function FacturacionAdmin() {
  const [pestañaActiva, setPestañaActiva] = useState("remitos");

  const renderContenido = () => {
    switch (pestañaActiva) {
      case "remitos":
        return <RemitosAdmin />;
      case "facturas":
        return <FacturasAdmin />;
      case "notas":
        return <NotasCreditoAdmin />;
      case "afip":
        return <AfipAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white rounded shadow">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">🧾 Panel de Facturación</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setPestañaActiva("remitos")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "remitos"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          📦 Remitos
        </button>
        <button
          onClick={() => setPestañaActiva("facturas")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "facturas"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🧾 Facturas
        </button>
        <button
          onClick={() => setPestañaActiva("notas")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "notas"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🔄 Notas de Crédito
        </button>
        <button
          onClick={() => setPestañaActiva("afip")}
          className={`px-4 py-2 rounded ${
            pestañaActiva === "afip"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          🛰️ AFIP
        </button>
      </div>

      {renderContenido()}
    </div>
  );
}
