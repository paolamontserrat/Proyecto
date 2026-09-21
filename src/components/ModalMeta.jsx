import { useEffect } from 'react';
import Confetti from './Confetti';
// Modal que se muestra cuando el usuario completa una meta personal.
function ModalMeta({ descripcion, onClose, onCrearOtraMeta }) {
  // Reproduce un sonido de felicitación al montar el componente.
  useEffect(() => {
    const audio = new Audio('/sounds/meta_completada.mp3');
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Confetti />
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-5xl mb-2">🎉</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">
          ¡Lo lograste!
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Completaste tu meta: <span className="font-bold">{descripcion}</span>
        </p>

        <button
          onClick={onCrearOtraMeta}
          className="w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
        >
          Crear nueva meta
        </button>
        <button onClick={onClose} className="w-full mt-2 text-gray-400 text-sm font-bold">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default ModalMeta;