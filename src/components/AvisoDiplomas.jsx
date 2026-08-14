import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ModalDiploma from './ModalDiploma';

function AvisoDiplomas() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const userId = usuario?.id;

  const [pendientes, setPendientes] = useState([]);
  const [diplomaAbierto, setDiplomaAbierto] = useState(null);

  const cargar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('diplomas')
      .select('numero, fecha_generado')
      .eq('usuario_id', String(userId))
      .eq('descargado', false)
      .order('numero');
    setPendientes(data || []);
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarDescargado = async (numero) => {
    await supabase.rpc('marcar_diploma_descargado', {
      p_usuario_id: String(userId),
      p_numero: numero,
    });
    cargar();
  };

  if (pendientes.length === 0) return null;

  return (
    <>
      <div className="max-w-sm mx-auto bg-red-500 text-white rounded-2xl p-4 mb-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="font-black text-sm">
            🎖️ ¡Tienes {pendientes.length} diploma{pendientes.length > 1 ? 's' : ''} nuevo{pendientes.length > 1 ? 's' : ''}!
          </p>
          <p className="text-xs text-white/80">Toca para descargar</p>
        </div>
        <button
          onClick={() => setDiplomaAbierto(pendientes[0])}
          className="bg-white text-red-600 px-3 py-2 rounded-lg text-sm font-bold shrink-0"
        >
          Ver
        </button>
      </div>

      {diplomaAbierto && (
        <ModalDiploma
          diploma={diplomaAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setDiplomaAbierto(null)}
          onDescargado={() => {
            marcarDescargado(diplomaAbierto.numero);
            setDiplomaAbierto(null);
          }}
        />
      )}
    </>
  );
}

export default AvisoDiplomas;