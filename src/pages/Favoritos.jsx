// src/pages/Favoritos.jsx
import { useFavoritos } from "../context/FavoritosContext";
import { useCart } from "../context/CartContext";

export default function Favoritos() {
  const { favoritos, eliminarFavorito } = useFavoritos();
  const { addToCart } = useCart();

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">💖 Mis Favoritos</h1>

      {favoritos.length === 0 ? (
        <p className="text-gray-400">Aún no tienes productos guardados.</p>
      ) : (
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4">
          {favoritos.map((prod) => (
            <div key={prod.id} className="bg-gray-800 p-4 rounded relative">
              <button
                onClick={() => eliminarFavorito(prod.id)}
                className="absolute top-2 right-2 text-red-500 text-xl"
                title="Eliminar de favoritos"
              >
                ❌
              </button>

              <img
                src={prod.imageURL || "https://via.placeholder.com/150"}
                alt={prod.title}
                className="w-full h-40 object-cover rounded mb-2"
              />

              <h3 className="text-lg font-bold text-amber-300">{prod.title}</h3>
              <p className="text-sm text-gray-400">{prod.categoria}</p>
              <p className="text-white font-semibold mb-2">${prod.price}</p>

              <button
                onClick={() => addToCart(prod)}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-1 rounded"
              >
                Agregar al carrito
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
