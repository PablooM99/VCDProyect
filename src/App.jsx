// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Carrito from "./pages/Carrito";
import AdminPanel from "./pages/AdminPanel";
import UserPanel from "./pages/UserPanel";
import AdminRoute from "./routes/AdminRoute";
import NavBar from "./components/NavBar";
import ProductosPorCategoria from "./components/ProductosPorCategoriaAdmin";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/panel" element={<UserPanel />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
            <ProductosPorCategoria />
          </AdminRoute>
        } />
      </Routes>
    </>
  );
}