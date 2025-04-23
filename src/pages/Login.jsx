// src/pages/Login.jsx
import { useState } from "react";
import Swal from "sweetalert2";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const auth = getAuth();
  const db = getFirestore();
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!email || !password || (modoRegistro && !nombre)) {
      Swal.fire("⚠️ Completá todos los campos", "", "warning");
      return;
    }

    try {
      if (modoRegistro) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: nombre });

        // Guardar en Firestore
        await setDoc(doc(db, "usuarios", userCred.user.uid), {
          nombre,
          email,
          direccion: "",
          cuit: "",
          rol: "usuario",
        });

        Swal.fire("✅ Registro exitoso", "Ya podés iniciar sesión", "success");
        setModoRegistro(false);
        setNombre("");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire("✅ Bienvenido", "Inicio de sesión exitoso", "success");
        navigate("/");
      }
    } catch (error) {
      Swal.fire("❌ Error", error.message, "error");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificamos si el usuario ya está en Firestore
      const userRef = doc(db, "usuarios", user.uid);
      const userDoc = await userRef.get?.();
      if (!userDoc?.exists?.()) {
        await setDoc(userRef, {
          nombre: user.displayName || "Usuario",
          email: user.email,
          direccion: "",
          cuit: "",
          rol: "usuario",
        });
      }
      
      Swal.fire("✅ Bienvenido", "Sesión iniciada con Google", "success");
      navigate("/");
    } catch (error) {
      Swal.fire("❌ Error con Google", error.message, "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
    <div className="p-4 sm:p-6 md:p-8 text-white max-w-lg mx-auto w-full bg-gray-900 rounded-xl">
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setModoRegistro(false)}
          className={`px-4 py-2 rounded-t font-semibold ${!modoRegistro ? "bg-gray-800 text-white" : "bg-gray-600 text-gray-300"}`}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setModoRegistro(true)}
          className={`px-4 py-2 rounded-t font-semibold ${modoRegistro ? "bg-gray-800 text-white" : "bg-gray-600 text-gray-300"}`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {modoRegistro && (
          <input
            type="text"
            placeholder="Nombre completo"
            className="w-full p-2 text-black rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 text-black rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 text-black rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 px-4 py-2 w-full rounded font-bold text-black"
        >
          {modoRegistro ? "Registrarse" : "Ingresar"}
        </button>
      </form>

      <hr className="my-6 border-gray-700" />

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
      >
        {modoRegistro ? "Registrarse con Google" : "Iniciar sesión con Google"}
      </button>
    </div>
  </div>
  );
}
