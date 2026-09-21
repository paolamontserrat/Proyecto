import { useState } from "react";
import { tipoDe } from "../utils/retos";

// Imagen del reto. Si no tiene imagen (o no carga), muestra un fondo de color con el emoji del tipo.
const ImagenReto = ({ reto, className = "", emojiClass = "text-6xl" }) => {
  const [fallo, setFallo] = useState(false);
  const tipo = tipoDe(reto);

  if (reto.imagen_url && !fallo) {
    return (
      <img
        src={reto.imagen_url}
        alt=""
        loading="lazy"
        onError={() => setFallo(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${tipo.gradiente} ${className}`}>
      <span className={`${emojiClass} drop-shadow-sm`}>{tipo.emoji}</span>
    </div>
  );
};

export default ImagenReto;