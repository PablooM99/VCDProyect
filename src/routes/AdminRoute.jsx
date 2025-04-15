// src/routes/AdminRoute.jsx
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  if (user.rol !== "admin") return <Navigate to="/" />;

  return children;
}
