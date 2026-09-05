import { useState } from "react";

const COLORES = {
  amarillo: "from-yellow-300 to-amber-400",
  azul: "from-sky-400 to-alianza-azul",
  naranja: "from-orange-300 to-red-400",
  morado: "from-fuchsia-400 to-purple-500",
};

// Tarjeta cuadrada, emoji grande, se abre en modal al tocarla.
const TarjetaVistosa = ({
  emoji,
  titulo,
  resumen,
  color = "amarillo",
  children,
}) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className={`flex flex-col items-center justify-center gap-0.5 aspect-square rounded-3xl p-3 bg-gradient-to-br ${COLORES[color]} shadow-lg hover:scale-105 active:scale-95 transition-transform`}
      >
        <span className="text-[150px] leading-none drop-shadow-sm">
          {emoji}
        </span>
        <span className="font-black text-white text-base uppercase text-center drop-shadow-sm mt-2">
          {titulo}
        </span>
        {resumen !== undefined && resumen !== null && resumen !== "" && (
          <span className="text-sm font-bold bg-white/40 text-white px-2 py-0.5 rounded-full mt-1">
            {resumen}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 relative">
            <button
              onClick={() => setAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-black text-lg"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{emoji}</span>
              <h3 className="font-black text-alianza-azul uppercase">
                {titulo}
              </h3>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default TarjetaVistosa;
