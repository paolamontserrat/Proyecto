function ModalConfirmar({ titulo, mensaje, onConfirmar, onCancelar, cargando }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
        <h3 className="text-lg font-bold text-alianza-azul mb-2">{titulo}</h3>
        <p className="text-gray-600 text-sm mb-6">{mensaje}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 bg-alianza-azul text-white py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {cargando ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmar;