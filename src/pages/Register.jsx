// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre,
        email,
        direccion: "",
        cuit: "",
        rol: "usuario",
      });

      Swal.fire("✅ Registro exitoso", "¡Bienvenido!", "success");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Error al registrar: " + err.message);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          nombre: user.displayName || "Usuario",
          email: user.email,
          direccion: "",
          cuit: "",
          rol: "usuario",
        });
      }

      Swal.fire("✅ Registro con Google exitoso", "¡Bienvenido!", "success");
      navigate("/");
    } catch (error) {
      console.error(error);
      setError("Error con Google: " + error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleEmailRegister}
        className="bg-gray-800 p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center text-amber-400 mb-4">Crear cuenta</h2>

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="mb-3 w-full p-2 rounded bg-gray-700"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-3 w-full p-2 rounded bg-gray-700"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-3 w-full p-2 rounded bg-gray-700"
        />
        <p className="text-sm text-gray-400 mb-4">
          Al registrarte, aceptas nuestros <a href="/terms" className="text-amber-400">Términos de Servicio</a> y <a href="/privacy" className="text-amber-400">Política de Privacidad</a>.
        </p>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded w-full mb-3"
        >
          Registrarse
        </button>

        <button
          type="button"
          onClick={handleGoogleRegister}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Registrarse con Google
        </button>
      </form>
    </div>
  );
}
