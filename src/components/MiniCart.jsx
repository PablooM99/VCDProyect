// src/components/MiniCart.jsx
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function MiniCart({ onClose }) {
  const { cart, removeFromCart, updateQuantity, totalPrice, lastThree } = useCart();

  return (
    <div className="absolute right-4 top-16 bg-gray-900 border border-gray-700 rounded shadow-lg w-80 z-50">
      <div className="p-4">
        <h4 className="text-lg text-amber-400 font-semibold mb-2">🛒 Últimos productos</h4>

        {lastThree.length === 0 ? (
          <p className="text-gray-400 text-sm">Tu carrito está vacío.</p>
        ) : (
          <ul className="space-y-2">
            {lastThree.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 border-b border-gray-700 pb-2"
              >
                <div className="flex-1 overflow-hidden">
                  <p
                    className="text-sm font-semibold text-white truncate"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      className="w-12 p-1 text-center bg-gray-800 text-white rounded"
                    />
                    <span className="text-sm text-gray-300">${item.price}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:underline text-sm flex-shrink-0"
                  title="Eliminar"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between items-center mt-4">
          <span className="font-semibold text-white">Total:</span>
          <span className="text-amber-400 font-bold">${totalPrice.toFixed(2)}</span>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            to="/carrito"
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 text-black font-semibold px-4 py-1 rounded"
          >
            Ir al carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
