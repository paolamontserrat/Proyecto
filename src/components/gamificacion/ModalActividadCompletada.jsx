import { useEffect } from 'react';
import Confetti from '../Confetti';

function ModalActividadCompletada({ celebracion, onContinuar }) {
  useEffect(() => {
    if (celebracion) {
      const audio = new Audio('/sounds/completada.mp3');
      audio.play().catch(() => {});
    }
  }, [celebracion]);

  if (!celebracion) return null;

  const esInsignia = celebracion.tipo === 'insignia';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Confetti />
      <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center">
        {esInsignia ? (
          <>
            <p className="text-6xl mb-2">{celebracion.emoji}</p>
            <h3 className="text-xl font-black text-alianza-azul">¡Nueva insignia!</h3>
            <p className="text-gray-700 mt-1 font-bold">{celebracion.nombre}</p>
            <p className="text-xs text-gray-400 mt-1">{celebracion.descripcion}</p>
          </>
        ) : (
          <>
            <p className="text-6xl mb-2">⭐</p>
            <h3 className="text-xl font-black text-alianza-azul">¡Actividad completada!</h3>
            <p className="text-gray-600 mt-2">Llevas {celebracion.estrellas} estrellas</p>
            {celebracion.racha > 1 && (
              <p className="text-sm text-orange-500 font-bold mt-1">
                🔥 Racha de {celebracion.racha} días
              </p>
            )}
          </>
        )}
        <button
          onClick={onContinuar}
          className="w-full mt-4 bg-alianza-azul text-white py-2 rounded-lg font-semibold"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

export default ModalActividadCompletada;