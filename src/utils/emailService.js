// src/utils/emailService.js
import emailjs from "emailjs-com";

export function enviarNotificacionEstado({ email, nombre, estado }) {
  return emailjs.send(
    "service_r8ypie2", // Reemplazar
    "template_iohiac9", // Reemplazar
    {
      to_name: nombre,
      to_email: email,
      estado_pedido: estado,
    },
    "-fjRhYC8mZbpa7Zkh" // Reemplazar
  );
}
