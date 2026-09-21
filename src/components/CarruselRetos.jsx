import { useRef } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import ImagenReto from "./ImagenReto";
import { datosProgreso, estadoReto, ETIQUETAS_ESTADO } from "../utils/retos";

// Carrusel horizontal con los retos más recientes. Al tocar uno se avisa con onAbrir(id).
const CarruselRetos = ({ retos, onAbrir }) => {
  const pista = useRef(null);

  const mover = (dir) =>
    pista.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  if (retos.length === 0) return null;

  return (
    <section id="retos-carrusel" className="col-span-2" aria-label="Retos del momento">
      <h3 className="inline-block font-black text-alianza-azul text-lg mb-3 bg-white/85 rounded-full px-4 py-1 shadow">
        🏆 Retos del momento
      </h3>

      <div className="relative">
        <div
          ref={pista}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {retos.map((ru) => {
            const estado = ETIQUETAS_ESTADO[estadoReto(ru.reto)];
            const prog = datosProgreso(ru);
            return (
              <button
                key={ru.id}
                onClick={() => onAbrir(ru.id)}
                className="snap-start shrink-0 w-64 text-left bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-alianza-azul"
              >
                <div className="relative">
                  <ImagenReto reto={ru.reto} className="w-full h-32" />
                  <span
                    className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      ru.completado ? "bg-green-500 text-white" : estado.chip
                    }`}
                  >
                    {ru.completado ? "✅ Cumplido" : estado.texto}
                  </span>
                  <span className="absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded-full bg-white/90 text-alianza-azul">
                    🪙 {ru.reto.recompensa_monedas}
                  </span>
                </div>

                <div className="p-3">
                  <div className="flex items-start gap-1">
                    <h4 className="font-bold text-alianza-azul leading-snug line-clamp-2 flex-1">
                      {ru.reto.titulo}
                    </h4>
                    {ru.completado && (
                      <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-alianza-amarillo h-2 rounded-full"
                      style={{ width: `${prog.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{prog.texto}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Flechas solo en pantallas grandes; en el celular se desliza con el dedo */}
        {retos.length > 1 && (
          <>
            <button
              onClick={() => mover(-1)}
              aria-label="Anterior"
              className="hidden md:flex absolute -left-4 top-1/3 w-9 h-9 items-center justify-center rounded-full bg-white shadow-lg text-alianza-azul hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => mover(1)}
              aria-label="Siguiente"
              className="hidden md:flex absolute -right-4 top-1/3 w-9 h-9 items-center justify-center rounded-full bg-white shadow-lg text-alianza-azul hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default CarruselRetos;