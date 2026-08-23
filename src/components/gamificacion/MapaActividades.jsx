import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

function MapaActividades({ totalPasos, pasoActual, pasoVisible, onSeleccionar, variante = 'horizontal' }) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (variante !== 'horizontal' || !contenedorRef.current) return;
    const el = contenedorRef.current.querySelector(`[data-nodo="${pasoVisible}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [pasoVisible, variante]);

  if (!totalPasos) return null;
  const nodos = Array.from({ length: totalPasos }, (_, i) => i + 1);

  const renderNodo = (n) => {
    const completado = n < pasoActual;
    const esFrontera = n === pasoActual;
    const bloqueado = n > pasoActual;
    const seleccionado = n === pasoVisible;
    const clicable = completado || esFrontera;

    // Variante horizontal (texto arriba, sin línea intermedia)
    if (variante === 'horizontal') {
      return (
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-white/90 border border-slate-300 text-slate-700 font-extrabold text-[10px] shadow-sm">
            Nivel {n}
          </span>
          <button
            key={n}
            data-nodo={n}
            onClick={() => clicable && onSeleccionar(n)}
            disabled={!clicable}
            title={bloqueado ? 'Actividad bloqueada' : `Actividad ${n}`}
            className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs border-[4px] shadow-lg transition-all ${
              completado
                ? 'bg-alianza-amarillo border-white text-alianza-azul shadow-yellow-500/40'
                : esFrontera
                  ? 'bg-white border-alianza-azul text-alianza-azul shadow-blue-500/40 animate-bounce'
                  : 'bg-slate-200 border-white text-slate-400 shadow-slate-400/20'
            } ${seleccionado ? 'ring-4 ring-blue-400 scale-110' : ''} ${clicable ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}`}
          >
            {completado ? '⭐' : bloqueado ? <Lock size={14} /> : n}
          </button>
        </div>
      );
    }

    // Variante vertical (se mantiene al lado con su respectiva línea)
    return (
      <div className="flex items-center gap-2">
        <button
          key={n}
          data-nodo={n}
          onClick={() => clicable && onSeleccionar(n)}
          disabled={!clicable}
          title={bloqueado ? 'Actividad bloqueada' : `Actividad ${n}`}
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-[4px] shadow-xl transition-all ${
            completado
              ? 'bg-alianza-amarillo border-white text-alianza-azul shadow-yellow-500/50'
              : esFrontera
                ? 'bg-white border-alianza-azul text-alianza-azul shadow-blue-500/50 animate-bounce'
                : 'bg-slate-200 border-white text-slate-400 shadow-slate-400/30'
          } ${seleccionado ? 'ring-4 ring-blue-400 scale-110' : ''} ${clicable ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}`}
        >
          {completado ? '⭐' : bloqueado ? <Lock size={16} /> : n}
        </button>

        <span className="px-2 py-0.5 rounded-lg bg-white/90 border border-slate-300 text-slate-700 font-extrabold text-xs shadow-md">
          Nivel {n}
        </span>
      </div>
    );
  };

  if (variante === 'horizontal') {
    return (
      <div ref={contenedorRef} className="bg-transparent rounded-2xl p-3 mb-4 overflow-x-auto">
        {/* w-full y justify-between distribuyen los elementos a lo largo de todo el espacio */}
        <div className="flex items-center justify-between min-w-full gap-4 px-4 pt-1">
          {nodos.map((n) => (
            <div key={n} className="flex items-center justify-center flex-1">
              {renderNodo(n)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const offsetX = (i) => {
    const ciclo = i % 4;
    if (ciclo === 1) return 60;
    if (ciclo === 3) return -60;
    return 0;
  };

  return (
    <div className="bg-transparent rounded-3xl p-4 max-h-[700px] overflow-y-auto">
      <div className="flex flex-col items-center gap-6 py-2">
        {nodos.map((n, i) => (
          <div key={n} className="relative" style={{ transform: `translateX(${offsetX(i)}px)` }}>
            {i > 0 && (
              <div className="absolute w-1.5 h-6 bg-alianza-azul/50 rounded-full left-1/2 -translate-x-1/2 shadow-sm" style={{ top: '-24px' }} />
            )}
            {renderNodo(n)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapaActividades;