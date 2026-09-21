import { useEffect, useState } from 'react';
import Confetti from './Confetti';

// Modal que se muestra cuando el usuario completa un reto.
// Si el reto pide reflexión, incluye un cuadro opcional para escribir qué aprendió.
function ModalReto({ titulo, monedas, onClose, pideReflexion = false, onGuardarReflexion, onVerReconocimiento }) {
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Reproduce un sonido de felicitación al montar el componente.
  useEffect(() => {
    const audio = new Audio('/sounds/moneda.mp3');
    audio.play().catch(() => {});
  }, []);

  const hayTexto = texto.trim().length > 0;

  // Guarda la reflexión (si escribió una) antes de salir, para que quede en el reconocimiento.
  const guardarSiHayTexto = async () => {
    if (pideReflexion && hayTexto && onGuardarReflexion) {
      setGuardando(true);
      await onGuardarReflexion(texto.trim());
    }
  };

  const cerrar = async () => {
    await guardarSiHayTexto();
    onClose();
  };

  const verReconocimiento = async () => {
    await guardarSiHayTexto();
    onVerReconocimiento();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Confetti />
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-5xl mb-2">🪙</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">
          ¡Reto cumplido!
        </h3>
        <p className="text-gray-500 text-sm mb-1">{titulo}</p>
        {/* Muestra la cantidad de monedas obtenidas */}
        <p className="text-alianza-amarillo font-black text-lg mb-4">
          +{monedas} moneda{monedas > 1 ? 's' : ''} 🪙
        </p>

        {pideReflexion && (
          <div className="text-left mb-4">
            <label className="text-sm font-bold text-alianza-azul">
              ¿Qué aprendiste con este reto? <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
              placeholder="Escribe con tus palabras..."
            />
          </div>
        )}

        <button
          onClick={cerrar}
          disabled={guardando}
          className="w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow disabled:opacity-60 active:scale-95 transition-transform"
        >
          {guardando ? 'Guardando...' : pideReflexion && hayTexto ? 'Guardar y cerrar' : '¡Genial!'}
        </button>

        {onVerReconocimiento && (
          <button
            onClick={verReconocimiento}
            disabled={guardando}
            className="w-full mt-2 border-2 border-alianza-azul text-alianza-azul py-3 rounded-full font-black disabled:opacity-60 active:scale-95 transition-transform"
          >
            🎖️ Ver mi reconocimiento
          </button>
        )}
      </div>
    </div>
  );
}

export default ModalReto;