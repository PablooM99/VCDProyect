// src/utils/notificacionesService.js
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const enviarNotificacion = async ({ userId, estado }) => {
    if (!userId || !estado) return;
  
    await addDoc(collection(db, "usuarios", userId, "notificaciones"), {
      titulo: "📦 Actualización de tu pedido",
      descripcion: `Tu pedido cambió de estado a: ${estado}`,
      leido: false,
      timestamp: serverTimestamp(),
      tipo: "estado",
    });
  };