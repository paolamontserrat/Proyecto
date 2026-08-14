import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import DiplomaTemplate from './DiplomaTemplate';

function ModalDiploma({ diploma, nombreUsuario, onClose, onDescargado }) {
  const ref = useRef(null);
  const [generando, setGenerando] = useState(false);

  const descargar = async () => {
    if (!ref.current) return;
    setGenerando(true);

    const canvas = await html2canvas(ref.current, { scale: 2 });
    const url = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = url;
    a.download = `diploma-${diploma.numero}.png`;
    a.click();

    setGenerando(false);
    onDescargado();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-5xl mb-2">🏆</p>
        <h3 className="text-xl font-black text-alianza-azul mb-1">
          ¡Tu Diploma #{diploma.numero} está listo!
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Descárgalo y guárdalo, o imprímelo si quieres.
        </p>

        <button
          onClick={descargar}
          disabled={generando}
          className="w-full bg-alianza-azul text-white py-3 rounded-lg font-bold disabled:opacity-60"
        >
          {generando ? 'Generando...' : '⬇️ Descargar diploma'}
        </button>
        <button onClick={onClose} className="w-full mt-2 text-gray-400 text-sm">
          Cerrar
        </button>
      </div>

      <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
        <DiplomaTemplate
          ref={ref}
          nombre={nombreUsuario}
          numero={diploma.numero}
          fecha={new Date(diploma.fecha_generado).toLocaleDateString()}
        />
      </div>
    </div>
  );
}

export default ModalDiploma;