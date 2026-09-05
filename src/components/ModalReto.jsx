import { useEffect } from 'react';
import Confetti from './Confetti';

function ModalReto({ titulo, monedas, onClose }) {
  useEffect(() => {
    const audio = new Audio('/sounds/moneda.mp3');
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Confetti />
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-5xl mb-2">🪙</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">
          ¡Reto cumplido!
        </h3>
        <p className="text-gray-500 text-sm mb-1">{titulo}</p>
        <p className="text-alianza-amarillo font-black text-lg mb-4">
          +{monedas} moneda{monedas > 1 ? 's' : ''} 🪙
        </p>

        <button
          onClick={onClose}
          className="w-full bg-alianza-azul text-white py-3 rounded-lg font-bold"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}

export default ModalReto;