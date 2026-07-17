import { useState } from 'react';
import { supabase } from '../../supabaseClient';

function ModalRegistrarDeposito({ usuario, onClose, onRegistrado }) {
  const [fecha, setFecha] = useState('');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleRegistrar = async () => {
    setError('');
    if (!fecha) return setError('Selecciona la fecha del depósito');
    if (!monto || Number(monto) <= 0) return setError('Escribe un monto válido');

    setCargando(true);
    const { data, error: rpcError } = await supabase.rpc('admin_agregar_deposito', {
      p_usuario_id: String(usuario.id),
      p_rango: usuario.nivel,
      p_fecha: fecha,
      p_monto: Number(monto),
    });
    setCargando(false);

    if (rpcError) {
      setError(`Error de conexión: ${rpcError.message}`);
      return;
    }
    if (!data?.ok) {
      setError(`No se pudo registrar: ${data?.error || 'error desconocido'}`);
      return;
    }

    setResultado(data);
    onRegistrado();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
        {!resultado ? (
          <>
            <h3 className="text-lg font-bold text-alianza-azul mb-2">Registrar depósito de sucursal</h3>
            <p className="text-sm text-gray-600 mb-4">{usuario.nombre}</p>

            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm mb-3"
            />
            <input
              type="number"
              placeholder="Monto depositado"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm mb-3"
            />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold">
                Cancelar
              </button>
              <button
                onClick={handleRegistrar}
                disabled={cargando}
                className="flex-1 bg-alianza-azul text-white py-2 rounded-lg font-semibold disabled:opacity-60"
              >
                {cargando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-4xl mb-2">{resultado.sello_otorgado ? '🏅' : '✅'}</p>
            <h3 className="text-lg font-bold text-alianza-azul mb-1">
              {resultado.sello_otorgado ? '¡Se otorgó un sello!' : 'Depósito registrado'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Total del mes: ${resultado.total_mes}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalRegistrarDeposito;