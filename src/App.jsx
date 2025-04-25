import { Routes, Route, useLocation } from "react-router-dom";
import { BrowserRouter as Router} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Carrito from "./pages/Carrito";
import AdminPanel from "./pages/AdminPanel";
import UserPanel from "./pages/UserPanel";
import AdminRoute from "./routes/AdminRoute";
import NavBar from "./components/NavBar";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import Favoritos from "./pages/Favoritos";
import Soporte from "./pages/Soporte";
import CuponesAdmin from "./components/CuponesAdmin";
import PedidosPendientesAdmin from "./components/PedidosPendientesAdmin";
import PedidoDetalle from "./pages/PedidoDetalle";
import SoporteAdmin from "./pages/SoporteAdmin";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import LogsAdmin from "./components/LogsAdmin";

export default function App() {
  const location = useLocation();
  const esAdmin = location.pathname.startsWith("/admin");
  const { user } = useAuth();

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
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/cupones" element={<CuponesAdmin />} />
        <Route path="/PedidosPendientes" element={<PedidosPendientesAdmin />} />
        <Route path="/pedido/:id" element={<PedidoDetalle />} />
        <Route path="/admin/soporte" element={<SoporteAdmin />} />
        <Route path="/login" element={<Login />} />
        {user?.rol === "admin" && (
          <Route path="/admin/logs" element={<LogsAdmin />} />
        )}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Routes>
      {!esAdmin && <Footer />}
    </>
  );
}
