import { useEffect } from "react";
import { X } from "lucide-react";
import ImagenReto from "./ImagenReto";
import ProgresoDias from "./ProgresoDias";
import { hoyMX } from "../utils/fecha";
import {
  datosProgreso,
  estadoReto,
  ETIQUETAS_ESTADO,
  formatearFecha,
  tipoDe,
} from "../utils/retos";

// Modal con toda la información de un reto y, si es de hábito, el botón "Hoy lo cumplí".
const ModalDetalleReto = ({ ru, marcando, error, onMarcar, onVerReconocimiento, onClose }) => {
  const { reto } = ru;
  const estado = estadoReto(reto);
  const etiqueta = ETIQUETAS_ESTADO[estado];
  const tipo = tipoDe(reto);
  const prog = datosProgreso(ru);
  const hechoHoy = ru.ultimo_checkin === hoyMX();

  // Cerrar con la tecla Escape
  useEffect(() => {
    const alPresionar = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onClose]);

  // Zona de acción según el tipo y el estado del reto
  const renderAccion = () => {
    if (ru.completado) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="font-black text-green-700">🎉 ¡Reto cumplido!</p>
          {ru.reflexion && (
            <p className="text-sm text-green-800 mt-2">
              <span className="font-bold">Lo que aprendiste: </span>
              {ru.reflexion}
            </p>
          )}
          {onVerReconocimiento && (
            <button
              onClick={() => onVerReconocimiento(ru)}
              className="mt-3 w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
            >
              🎖️ Ver mi reconocimiento
            </button>
          )}
        </div>
      );
    }
    if (!prog.esHabito) {
      return (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl p-4">
          Este reto avanza cuando registras un ahorro en tu pasaporte 🐷
        </p>
      );
    }
    if (estado === "proximo") {
      return (
        <p className="text-sm text-blue-700 bg-blue-50 rounded-2xl p-4 text-center font-bold">
          Empieza el {formatearFecha(reto.fecha_inicio)}
        </p>
      );
    }
    if (estado === "vencido") {
      return (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl p-4 text-center font-bold">
          Este reto ya terminó
        </p>
      );
    }
    if (hechoHoy) {
      return (
        <p className="text-sm text-green-700 bg-green-50 rounded-2xl p-4 text-center font-bold">
          ¡Hoy ya lo cumpliste! Vuelve mañana 🌙
        </p>
      );
    }
    return (
      <div>
        <button
          onClick={() => onMarcar(ru)}
          disabled={marcando}
          className="w-full bg-alianza-azul text-white py-3 rounded-full font-black text-base shadow disabled:opacity-60 active:scale-95 transition-transform"
        >
          {marcando ? "Guardando..." : "✅ Hoy lo cumplí"}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Márcalo solo si de verdad lo hiciste 😉
        </p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={reto.titulo}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <ImagenReto reto={reto} className="w-full h-48 rounded-t-3xl" emojiClass="text-8xl" />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-gray-600 shadow"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-alianza-azul/10 text-alianza-azul">
              {tipo.emoji} {tipo.nombre}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${etiqueta.chip}`}>
              {etiqueta.texto}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              🪙 {reto.recompensa_monedas} moneda{reto.recompensa_monedas > 1 ? "s" : ""}
            </span>
          </div>

          <h3 className="text-xl font-black text-alianza-azul">{reto.titulo}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Del {formatearFecha(reto.fecha_inicio)} al {formatearFecha(reto.fecha_fin)}
          </p>

          {reto.descripcion && (
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{reto.descripcion}</p>
          )}

          {/* Progreso: circulitos si son pocos días, barra en los demás casos */}
          <div className="mt-4">
            {prog.esHabito && prog.meta <= 14 ? (
              <ProgresoDias actual={prog.actual} meta={prog.meta} />
            ) : (
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-alianza-amarillo h-3 rounded-full"
                  style={{ width: `${prog.porcentaje}%` }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {prog.texto} · {prog.porcentaje}%
            </p>
          </div>

          <div className="mt-4">{renderAccion()}</div>

          {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleReto;