// src/services/mercadoPago.js

// IMPORTANTE:
// Este archivo está listo para conectarse a la API de MercadoPago
// Requiere tu ACCESS_TOKEN real para generar preferencias

const API_URL = "https://api.mercadopago.com/checkout/preferences";
const ACCESS_TOKEN = "REEMPLAZAR_CON_TU_ACCESS_TOKEN_PRIVADO";

export async function crearPreferencia(productos, usuario) {
  const items = productos.map(p => ({
    title: p.title,
    quantity: p.quantity,
    unit_price: p.price,
    currency_id: "ARS"
  }));

  const body = {
    items,
    payer: {
      name: usuario?.displayName || "Usuario",
      email: usuario?.email || ""
    },
    back_urls: {
      success: "http://localhost:5173/success",
      failure: "http://localhost:5173/failure"
    },
    auto_return: "approved"
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data.init_point; // URL para redirigir al usuario
}
