// src/components/Footer.jsx
import { motion } from "framer-motion";
import { FaWhatsapp, FaInstagram, FaEnvelope, FaExternalLinkAlt } from "react-icons/fa";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="bg-gray-900 text-white mt-10 pt-10 border-t border-gray-700"
    >
      <div className="max-w-6xl mx-auto px-6 pb-6 grid md:grid-cols-3 gap-8 text-base">
        {/* Sección Información */}
        <div>
          <h3 className="text-amber-400 text-lg font-bold mb-3">Información</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="/productos" className="hover:text-amber-400">Productos</a></li>
            <li><a href="/favoritos" className="hover:text-amber-400">Favoritos</a></li>
            <li><a href="/soporte" className="hover:text-amber-400">Soporte</a></li>
          </ul>
        </div>

        {/* Sección Contacto */}
        <div>
          <h3 className="text-amber-400 text-lg font-bold mb-3">Contacto</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <FaWhatsapp className="text-green-400" />
              <a href="https://wa.me/5492233016060" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-blue-300" />
              <a href="mailto:montenegrop681@gmail.com" className="hover:text-amber-400">Email</a>
            </li>
            <li className="flex items-center gap-2">
              <FaInstagram className="text-pink-400" />
              <a href="https://instagram.com/pabloom99" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                Instagram
              </a>
            </li>
          </ul>
        </div>

        {/* Sección Otros */}
        <div>
          <h3 className="text-amber-400 text-lg font-bold mb-3">Otros</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="/panel" className="hover:text-amber-400">Mi Cuenta</a></li>
            <li><a href="/carrito" className="hover:text-amber-400">Carrito de Compras</a></li>
          </ul>
        </div>
      </div>

      {/* Subfooter */}
      <div className="bg-gray-800 py-4 mt-8">
        <div className="text-center text-gray-400 text-sm">
          Copyright © Todos los derechos reservados | Sitio desarrollado por{" "}
          <a
            href="https://www.tuportafolio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-white inline-flex items-center gap-1"
          >
            Pablo Montenegro <FaExternalLinkAlt className="text-xs" />
          </a> |{" "}
          <a
            href="https://wa.me/5492233016060"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-white inline-flex items-center gap-1"
          >
            Contactar por WhatsApp <FaWhatsapp className="text-sm" />
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
