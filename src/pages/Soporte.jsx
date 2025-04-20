import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";
import { toast } from "react-toastify";

export default function Soporte() {
  const { user } = useAuth();
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const chatEndRef = useRef();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "soporte", user.uid, "mensajes"),
      orderBy("timestamp")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMensajes(msgs);

      const nuevoUltimo = msgs[msgs.length - 1];
      if (
        nuevoUltimo &&
        nuevoUltimo.remitente === "admin" &&
        nuevoUltimo.timestamp?.seconds !== ultimoMensaje?.timestamp?.seconds
      ) {
        toast.info("📬 Nuevo mensaje del soporte");
        marcarMensajesComoLeidos(msgs);
        setUltimoMensaje(nuevoUltimo);
      }
    });

    return () => unsub();
  }, [user]);

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
  
    try {
      await addDoc(collection(db, "soporte", user.uid, "mensajes"), {
        mensaje,
        remitente: "usuario",
        email: user.email,
        leido: false,
        timestamp: serverTimestamp()
      });
  
      // 🔔 Notificar a los admins
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const admins = usuariosSnap.docs.filter(d => d.data().rol === "admin");
  
      const noti = {
        titulo: "📨 Nuevo mensaje de soporte",
        descripcion: `${user.displayName || user.email} te envió un mensaje de soporte`,
        leido: false,
        timestamp: serverTimestamp(),
        tipo: "soporte",
        redireccion: "/admin/soporte"
      };
  
      for (const admin of admins) {
        const adminId = admin.id;
        await addDoc(collection(db, "usuarios", adminId, "notificaciones"), noti);
      }
  
      setMensaje("");
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const marcarMensajesComoLeidos = async (lista) => {
    for (const msg of lista) {
      if (msg.remitente === "admin" && !msg.leido) {
        const msgRef = doc(db, "soporte", user.uid, "mensajes", msg.id);
        await updateDoc(msgRef, { leido: true });
      }
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-950 text-white min-h-screen">
      <div className="max-w-xl mx-auto bg-gray-800 rounded p-6 shadow-md">
        <h1 className="text-2xl font-bold text-amber-400 mb-4">💬 Chat de Soporte</h1>
        <div className="h-96 overflow-y-auto space-y-2 mb-4 bg-gray-900 p-3 rounded">
          {mensajes.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-md max-w-xs ${
                msg.remitente === "usuario"
                  ? "bg-amber-500 text-black self-end ml-auto"
                  : "bg-gray-600 text-white mr-auto"
              }`}
            >
              <p className="text-sm">{msg.mensaje}</p>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí tu mensaje..."
            className="flex-1 p-2 bg-gray-700 rounded text-white"
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
          />
          <button
            onClick={enviarMensaje}
            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded font-semibold"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
