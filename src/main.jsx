// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritosProvider } from './context/FavoritosContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <FavoritosProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </FavoritosProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
);
