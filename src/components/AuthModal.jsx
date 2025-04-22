// src/components/AuthModal.jsx
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function AuthModal({ visible, onClose }) {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  if (!visible) return null;

  const cerrar = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (modo === "register" && !nombre)) {
      alert("⚠️ Todos los campos son obligatorios.");
      return;
    }

    try {
      if (modo === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        cerrar();
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "usuarios", cred.user.uid), {
          email,
          nombre,
          rol: "usuario"
        });
        cerrar();
      }
    } catch (error) {
      console.error("Error:", error.message);
      alert("❌ " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Verificar si el documento de usuario ya existe
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email || "",
          nombre: user.displayName || "Sin nombre",
          rol: "usuario"
        });
      }

      cerrar();
    } catch (error) {
      console.error("Error con Google:", error.message);
      alert("❌ " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-lg relative text-white">
        <button
          onClick={cerrar}
          className="absolute top-2 right-2 text-white text-lg"
        >
          ✖
        </button>

        <div className="flex justify-center mb-4">
          <button
            className={`px-4 py-2 rounded-l ${modo === "login" ? "bg-amber-500 text-black font-bold" : "bg-gray-800 text-white"}`}
            onClick={() => setModo("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={`px-4 py-2 rounded-r ${modo === "register" ? "bg-amber-500 text-black font-bold" : "bg-gray-800 text-white"}`}
            onClick={() => setModo("register")}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "register" && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded text-white"
            />
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded"
          >
            {modo === "login" ? "Iniciar sesión" : "Registrarse"}
          </button>
        </form>

        {/* Google Login */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400 mb-2">O continuar con:</p>
          <button
            onClick={handleGoogleLogin}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded w-full"
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    </div>
  );
}
