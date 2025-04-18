// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritosProvider } from './context/FavoritosContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <FavoritosProvider>
            <CartProvider>
              <App />
              <ToastContainer
                position="top-center"         // ✅ centrado arriba
                autoClose={3000}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                limit={3}
              />
            </CartProvider>
          </FavoritosProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
);
