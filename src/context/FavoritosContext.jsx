// src/context/FavoritosContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

const FavoritosContext = createContext();

export const useFavoritos = () => useContext(FavoritosContext);

export function FavoritosProvider({ children }) {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavoritos([]);
      return;
    }

    const ref = collection(db, "usuarios", user.uid, "favoritos");
    const unsub = onSnapshot(ref, (snap) => {
      const datos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFavoritos(datos);
    });

    return () => unsub();
  }, [user]);

  const toggleFavorito = async (producto) => {
    if (!user) return;

    const refDoc = doc(db, "usuarios", user.uid, "favoritos", producto.id);
    const existe = favoritos.some((p) => p.id === producto.id);

    if (existe) {
      await deleteDoc(refDoc);
    } else {
      const favorito = {
        id: producto.id,
        title: producto.title,
        price: producto.price,
        categoria: producto.categoria || "",
        imageURL: producto.imageURL || producto.imageURLs?.[0] || "", // Usamos imageURL prioritariamente
      };
      await setDoc(refDoc, favorito);
    }
  };

  const isFavorito = (id) => favoritos.some((p) => p.id === id);

  const eliminarFavorito = async (id) => {
    if (!user) return;
    const refDoc = doc(db, "usuarios", user.uid, "favoritos", id);
    await deleteDoc(refDoc);
  };

  return (
    <FavoritosContext.Provider
      value={{ favoritos, toggleFavorito, isFavorito, eliminarFavorito }}
    >
      {children}
    </FavoritosContext.Provider>
  );
}
