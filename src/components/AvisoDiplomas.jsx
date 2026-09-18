import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ModalDiploma from './ModalDiploma';

function AvisoDiplomas() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const userId = usuario?.id;

  const [pendientes, setPendientes] = useState([]);       // diplomas sin descargar
  const [diplomaAbierto, setDiplomaAbierto] = useState(null); // diploma que se está mostrando en el modal

  const cargar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('diplomas')
      .select('numero, fecha_generado')
      .eq('usuario_id', String(userId))
      .eq('descargado', false) // solo los que faltan por descargar
      .order('numero');
    setPendientes(data || []);
  }, [userId]);

  // Carga los diplomas pendientes
  useEffect(() => { cargar(); }, [cargar]);

  // Marca un diploma como descargado en la base de datos y refresca la lista.
  const marcarDescargado = async (numero) => {
    await supabase.rpc('marcar_diploma_descargado', {
      p_usuario_id: String(userId),
      p_numero: numero,
    });
    cargar();
  };

  // Si no hay diplomas pendientes, el aviso no se muestra.
  if (pendientes.length === 0) return null;

  return (
    <>
      {/* Banner rojo con el conteo de diplomas nuevos */}
      <div className="w-full bg-red-500 text-white rounded-2xl p-4 mb-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="font-black text-sm">
            🎖️ ¡Tienes {pendientes.length} diploma{pendientes.length > 1 ? 's' : ''} nuevo{pendientes.length > 1 ? 's' : ''}!
          </p>
          <p className="text-xs text-white/80">Toca para descargar</p>
        </div>
        {/* Abre el modal con el primer diploma pendiente de la lista */}
        <button
          onClick={() => setDiplomaAbierto(pendientes[0])}
          className="bg-white text-red-600 px-3 py-2 rounded-lg text-sm font-bold shrink-0"
        >
          Ver
        </button>
      </div>

      {/* Modal para ver/descargar el diploma seleccionado */}
      {diplomaAbierto && (
        <ModalDiploma
          diploma={diplomaAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setDiplomaAbierto(null)}
          onDescargado={() => {
            marcarDescargado(diplomaAbierto.numero); // avisa a la BD que ya se descargó
            setDiplomaAbierto(null);                  // cierra el modal
          }}
        />
      )}
    </>
  );
}

export default AvisoDiplomas;