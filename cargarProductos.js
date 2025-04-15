import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Inicializar Firebase Admin con tu archivo de clave
const serviceAccount = JSON.parse(
  readFileSync("./vcdproyect-firebase-adminsdk-fbsvc-8edc653b32.json", "utf8")
);

initializeApp({
  credential: {
    getAccessToken: () => Promise.resolve({ access_token: serviceAccount.private_key, expires_in: 1000 }),
  },
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

const productos = Array.from({ length: 30 }, (_, i) => ({
  title: `Producto ${i + 1}`,
  price: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
  imageURL: `https://picsum.photos/seed/${i + 1}/400/300`,
  categoria: ["herramientas", "pintura", "ferretería", "electricidad"][i % 4],
  stock: Math.floor(Math.random() * 50) + 1,
}));

async function subirProductos() {
  const batch = db.batch();
  productos.forEach((prod) => {
    const ref = db.collection("productos").doc();
    batch.set(ref, prod);
  });
  await batch.commit();
  console.log("✅ Productos cargados exitosamente en Firestore.");
}

subirProductos();
