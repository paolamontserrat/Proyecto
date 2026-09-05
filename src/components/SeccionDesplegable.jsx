import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Uso: <SeccionDesplegable titulo="Sellos" icono="🏅" resumen={3}>...</SeccionDesplegable>
const SeccionDesplegable = ({ titulo, icono, resumen, defaultOpen = false, children }) => {
  const [abierto, setAbierto] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          {icono && <span className="text-xl">{icono}</span>}
          <span className="font-black text-alianza-azul uppercase text-sm">{titulo}</span>
          {resumen !== undefined && resumen !== null && (
            <span className="text-xs font-bold bg-alianza-amarillo/30 text-alianza-azul px-2 py-0.5 rounded-full">
              {resumen}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>
      {abierto && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
};

export default SeccionDesplegable;