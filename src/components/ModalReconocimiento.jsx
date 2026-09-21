import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ReconocimientoTemplate from './ReconocimientoTemplate';

const ANCHO_PLANTILLA = 1200;

// "Cuida el agua 💧" -> "cuida-el-agua" (para el nombre del archivo)
const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'reto';

// Modal que muestra el reconocimiento de un reto cumplido y permite descargarlo como imagen.
function ModalReconocimiento({ ru, nombreUsuario, onClose }) {
  const ref = useRef(null);         // copia a tamaño real (fuera de pantalla) que se convierte en PNG
  const contenedor = useRef(null);  // caja donde se ve la vista previa reducida
  const [escala, setEscala] = useState(0.28);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  // Ajusta la vista previa al ancho disponible.
  useEffect(() => {
    const el = contenedor.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => setEscala(el.clientWidth / ANCHO_PLANTILLA));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  const descargar = async () => {
    if (!ref.current) return;
    setGenerando(true);
    setError('');
    try {
      const canvas = await html2canvas(ref.current, { scale: 2 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `reconocimiento-${slug(ru.reto.titulo)}.png`;
      a.click();
    } catch {
      setError('No se pudo generar la imagen. Inténtalo de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  const plantilla = (refPlantilla) => (
    <ReconocimientoTemplate
      ref={refPlantilla}
      nombre={nombreUsuario}
      reto={ru.reto}
      fecha={ru.completado_en}
      reflexion={ru.reflexion}
    />
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reconocimiento"
        className="bg-white rounded-3xl p-6 max-w-sm w-full text-center max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl mb-2">🎖️</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">
          ¡Tu reconocimiento está listo!
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Descárgalo y guárdalo, o imprímelo si quieres.
        </p>

        {/* Vista previa reducida */}
        <div
          ref={contenedor}
          className="relative w-full overflow-hidden rounded-xl shadow-lg border border-gray-100 mb-4"
          style={{ aspectRatio: '1200 / 850' }}
        >
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: ANCHO_PLANTILLA, transform: `scale(${escala})`, transformOrigin: 'top left' }}
          >
            {plantilla(undefined)}
          </div>
        </div>

        <button
          onClick={descargar}
          disabled={generando}
          className="w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow disabled:opacity-60 active:scale-95 transition-transform"
        >
          {generando ? 'Generando...' : '⬇️ Descargar reconocimiento'}
        </button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <button onClick={onClose} className="w-full mt-2 text-gray-400 text-sm font-bold">
          Cerrar
        </button>
      </div>

      {/* Copia a tamaño real, fuera de pantalla, que es la que se convierte en imagen */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>{plantilla(ref)}</div>
    </div>
  );
}

export default ModalReconocimiento;