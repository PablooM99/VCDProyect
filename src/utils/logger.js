// src/utils/logger.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const registrarLog = async ({ tipo, entidad, descripcion, user }) => {
  if (!user) return;

  try {
    await addDoc(collection(db, "logs"), {
      tipo,
      entidad,
      descripcion,
      userId: user.uid,
      userEmail: user.email,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
};
