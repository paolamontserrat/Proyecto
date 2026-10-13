import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import DiplomaTemplate from './DiplomaTemplate';

const ANCHO_PLANTILLA = 1200;

// Modal que muestra el diploma de ahorro (vista previa) y permite descargarlo como imagen PNG.
function ModalDiploma({ diploma, nombreUsuario, onClose, onDescargado }) {
  const ref = useRef(null);              // copia a tamaño real (fuera de pantalla) que se convierte en PNG
  const contenedor = useRef(null);       // caja donde se ve la vista previa reducida
  const [escala, setEscala] = useState(0.28);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  // Fecha larga del diploma (si no viene la fecha, usa la de hoy)
  const fecha = new Date(diploma.fecha_generado || Date.now()).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });

  // Ajusta la vista previa al ancho disponible.
  useEffect(() => {
    const el = contenedor.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => setEscala(el.clientWidth / ANCHO_PLANTILLA));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Convierte el DiplomaTemplate en una imagen PNG y dispara la descarga automática en el navegador
  const descargar = async () => {
    if (!ref.current) return;
    setGenerando(true);
    setError('');
    try {
      await document.fonts?.ready; // espera a que cargue la tipografía del diploma
      const canvas = await html2canvas(ref.current, { scale: 2 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `diploma-${diploma.numero}.png`;
      a.click();
      onDescargado?.(); // avisa al componente padre que ya se descargó
    } catch {
      setError('No se pudo generar la imagen. Inténtalo de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  const plantilla = (refPlantilla) => (
    <DiplomaTemplate ref={refPlantilla} nombre={nombreUsuario} numero={diploma.numero} fecha={fecha} />
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Diploma"
        className="bg-white rounded-3xl p-6 max-w-sm w-full text-center max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl mb-2">🏆</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">¡Tu Diploma #{diploma.numero} está listo!</h3>
        <p className="text-gray-500 text-sm mb-4">Descárgalo y guárdalo, o imprímelo si quieres.</p>

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
          {generando ? 'Generando...' : '⬇️ Descargar diploma'}
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

export default ModalDiploma;