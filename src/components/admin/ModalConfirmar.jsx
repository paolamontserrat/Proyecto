import { useEffect } from 'react';

// Modal reutilizable para confirmar acciones importantes.
// Reemplaza al confirm() del navegador ("localhost dice...") por uno con el estilo de la plataforma.
//  - variante="peligro" pinta el botón de rojo (eliminar). Por defecto es azul.
//  - textoConfirmar / textoCancelar permiten cambiar las etiquetas de los botones.
function ModalConfirmar({
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  cargando,
  variante = 'normal',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
}) {
  const peligro = variante === 'peligro';

  // Cerrar con la tecla Escape
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && !cargando && onCancelar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCancelar, cargando]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !cargando && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono, título y explicación de la acción */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 ${
            peligro ? 'bg-red-100' : 'bg-alianza-azul/10'
          }`}
        >
          {peligro ? '🗑️' : '❔'}
        </div>

        <h3 className="text-lg font-black text-alianza-azul mb-2">{titulo}</h3>

        <p className="text-gray-600 text-sm mb-6 whitespace-pre-line">{mensaje}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-semibold text-gray-700 disabled:opacity-60"
          >
            {textoCancelar}
          </button>

          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={`flex-1 text-white py-2 rounded-lg font-semibold disabled:opacity-60 ${
              peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-alianza-azul hover:bg-alianza-azul/90'
            }`}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmar;