// src/components/Cart.jsx
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  return (
    <div className="p-6 text-white max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">🛒 Carrito de Compras</h1>

      {cart.length === 0 ? (
        <p className="text-gray-300">Tu carrito está vacío.</p>
      ) : (
        <>
          <table className="w-full mb-6 text-sm">
            <thead className="text-left text-amber-300">
              <tr>
                <th>Producto</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Precio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={item.imageURL} alt={item.title} className="w-12 h-12 rounded object-cover" />
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      className="w-16 text-center bg-gray-800 text-white rounded p-1"
                    />
                  </td>
                  <td className="text-right font-semibold">${(item.price * item.cantidad).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:underline ml-4">
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={clearCart}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            >
              Vaciar carrito
            </button>
            <div className="flex gap-4">
              <button className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded">
                Guardar pedido
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Pagar (MercadoPago)
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <Link to="/productos" className="text-amber-400 hover:underline">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}
