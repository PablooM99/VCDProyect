// src/pages/Login.jsx
import { useState } from "react";
import Swal from "sweetalert2";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire("Campos vacíos", "Por favor completá todos los campos.", "warning");
      return;
    }
    if (!email.includes("@")) {
      Swal.fire("Email inválido", "Ingresá un correo válido.", "error");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Swal.fire("Bienvenido", "Inicio de sesión exitoso", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      Swal.fire("Bienvenido", "Sesión iniciada con Google", "success");
    } catch (error) {
      Swal.fire("Error con Google", error.message, "error");
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone) {
      Swal.fire("Falta número", "Ingresá un número de teléfono válido.", "warning");
      return;
    }
    try {
      window.recaptchaVerifier = new RecaptchaVerifier("recaptcha-container", { size: "invisible" }, auth);
      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(confirmationResult);
      Swal.fire("Código enviado", "Revisá tu SMS para confirmar.", "info");
    } catch (error) {
      Swal.fire("Error al enviar SMS", error.message, "error");
    }
  };

  const handleVerifyCode = async () => {
    try {
      await confirmation.confirm(code);
      Swal.fire("Verificado", "Sesión iniciada con tu número.", "success");
    } catch (error) {
      Swal.fire("Código inválido", error.message, "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 text-white max-w-lg mx-auto w-full">
      <form onSubmit={handleLogin} className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold">Iniciar Sesión</h2>
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
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 w-full rounded">
          Ingresar
        </button>
      </form>

      <hr className="my-6 border-gray-700" />

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded mb-4"
      >
        Iniciar sesión con Google
      </button>

      <div id="recaptcha-container"></div>

      <div className="space-y-2">
        <input
          type="tel"
          placeholder="Teléfono (ej: +5491123456789)"
          className="w-full p-2 text-black rounded"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          type="button"
          onClick={handlePhoneLogin}
          className="w-full bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded"
        >
          Enviar código SMS
        </button>
        {confirmation && (
          <>
            <input
              type="text"
              placeholder="Código de verificación"
              className="w-full p-2 text-black rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Verificar código
            </button>
          </>
        )}
      </div>
    </div>
  );
}
