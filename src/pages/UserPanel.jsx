// src/pages/UserPanel.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase/config";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";


export default function UserPanel() {
  const { user } = useAuth();
  const [nombre, setNombre] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [cuit, setCuit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nuevaPass, setNuevaPass] = useState("");
  const [passActual, setPassActual] = useState("");
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!user) return;

    const cargarPedidos = async () => {
      try {
        const q = query(collection(db, "pedidos"), where("userEmail", "==", user.email));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPedidos(data);
      } catch (error) {
        console.error("Error al cargar pedidos del usuario:", error);
      }
    };

    const cargarInfoUsuario = async () => {
      try {
        const q = query(collection(db, "usuarios"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const datos = snapshot.docs[0].data();
          setCuit(datos.cuit || "");
          setDireccion(datos.direccion || "");
        }
      } catch (error) {
        console.error("Error al cargar datos de usuario:", error);
      }
    };

    cargarPedidos();
    cargarInfoUsuario();
  }, [user]);

  const guardarCambios = async () => {
    if (!nombre || !cuit || !direccion) {
      return Swal.fire("❌ Todos los campos deben estar completos", "", "warning");
    }

    try {
      const q = query(collection(db, "usuarios"), where("email", "==", user.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const ref = doc(db, "usuarios", snapshot.docs[0].id);
        await updateDoc(ref, { nombre, cuit, direccion });
        Swal.fire("✅ Cambios guardados correctamente", "", "success");
      }

      if (nuevaPass) {
        if (!passActual) {
          return Swal.fire("❌ Debes ingresar la contraseña actual para confirmar el cambio", "", "error");
        }

        if (nuevaPass.length < 6) {
          return Swal.fire("❌ La nueva contraseña debe tener al menos 6 caracteres", "", "error");
        }

        const cred = EmailAuthProvider.credential(user.email, passActual);

        try {
          await reauthenticateWithCredential(auth.currentUser, cred);
          await updatePassword(auth.currentUser, nuevaPass);
          Swal.fire("🔐 Contraseña actualizada correctamente", "", "success");
          setNuevaPass("");
          setPassActual("");
        } catch (err) {
          return Swal.fire("❌ Error al verificar contraseña actual", err.message, "error");
        }
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      Swal.fire("❌ Error al guardar cambios", error.message, "error");
    }
  };

  const cancelarPedido = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará tu pedido",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No"
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "pedidos", id));
      setPedidos(prev => prev.filter(p => p.id !== id));
      Swal.fire("✅ Pedido cancelado", "", "success");
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      Swal.fire("❌ Error al cancelar pedido", error.message, "error");
    }
  };

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-amber-400 mb-8 text-center">👤 Panel de Usuario</h1>

        <form className="space-y-6 bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Nombre completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-2 bg-gray-700 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-sm">CUIT</label>
              <input type="text" value={cuit} onChange={(e) => setCuit(e.target.value)} className="w-full p-2 bg-gray-700 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Dirección</label>
              <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full p-2 bg-gray-700 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Email</label>
              <input type="email" value={email} disabled className="w-full p-2 bg-gray-600 rounded text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Contraseña actual</label>
              <input type="password" value={passActual} onChange={(e) => setPassActual(e.target.value)} className="w-full p-2 bg-gray-700 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Nueva contraseña</label>
              <input type="password" value={nuevaPass} onChange={(e) => setNuevaPass(e.target.value)} className="w-full p-2 bg-gray-700 rounded" />
            </div>
          </div>
          <button type="button" onClick={guardarCambios} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded">
            Guardar cambios
          </button>
          <Link
            to="/soporte"
            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
          >
            💬 Soporte
          </Link>
        </form>

        <div className="mt-12">
          <h2 className="text-2xl text-amber-300 font-semibold mb-4">📦 Mis pedidos</h2>
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-gray-800 p-4 rounded shadow">
                <p className="text-sm text-gray-300 mb-1">🆔 {pedido.id}</p>
                <p className="text-sm text-gray-300 mb-1">📅 {pedido.fecha?.toDate().toLocaleString()}</p>
                <p className="text-sm text-gray-300 mb-2">🔖 Estado: <span className="text-white font-semibold">{pedido.estado}</span></p>
                <ul className="list-disc pl-5 mb-2">
                  {pedido.productos?.map((item, i) => (
                    <li key={i}>{item.title} x{item.cantidad}</li>
                  ))}
                </ul>
                <button
                  onClick={() => cancelarPedido(pedido.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                >
                  Cancelar pedido
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
