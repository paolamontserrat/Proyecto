import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import TarjetaVistosa from './TarjetaVistosa';
import ModalDiploma from './ModalDiploma';
import ModalReconocimiento from './ModalReconocimiento';

const acortar = (texto, max = 18) =>
  !texto ? '' : texto.length > max ? texto.slice(0, max - 1) + '…' : texto;

// Muestra los diplomas de ahorro y los reconocimientos de retos cumplidos, ambos descargables.
function PasaporteDiplomas({ diplomas, usuarioId }) {
  const [diplomaAbierto, setDiplomaAbierto] = useState(null);                 // diploma abierto en el modal
  const [reconocimientos, setReconocimientos] = useState([]);                 // retos completados del usuario
  const [reconocimientoAbierto, setReconocimientoAbierto] = useState(null);   // reconocimiento abierto en el modal
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  // Trae los retos que el usuario ya completó para poder volver a descargar su reconocimiento.
  useEffect(() => {
    if (!usuarioId || usuarioId === 'anon') return;
    let cancelado = false;

    supabase
      .from('retos_usuario')
      .select('id, completado_en, reflexion, reto:retos(id, titulo, tipo, meta_monto, meta_dias)')
      .eq('usuario_id', usuarioId)
      .eq('completado', true)
      .order('completado_en', { ascending: false })
      .then(({ data }) => {
        if (!cancelado) setReconocimientos((data || []).filter((r) => r.reto));
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  const totalDiplomas = diplomas?.length || 0;
  const total = totalDiplomas + reconocimientos.length;

  return (
    <TarjetaVistosa emoji="🏆" titulo="Diplomas" resumen={total} color="azul">
      {total === 0 ? (
        <p className="text-sm text-gray-400">Aún no tienes diplomas ni reconocimientos.</p>
      ) : (
        <div className="grid gap-5">
          {/* Diplomas de ahorro (3 sellos = 1 diploma) */}
          {totalDiplomas > 0 && (
            <div>
              <p className="text-xs font-black text-alianza-azul uppercase tracking-wide mb-2">Diplomas de ahorro</p>
              <div className="flex flex-wrap gap-3">
                {diplomas.map((d) => (
                  <button
                    key={d.numero}
                    onClick={() => setDiplomaAbierto(d)}
                    className="flex flex-col items-center bg-alianza-azul/5 hover:bg-alianza-azul/10 transition rounded-2xl px-4 py-3 border-2 border-alianza-azul/20"
                  >
                    <span className="text-3xl">🏆</span>
                    <span className="text-xs mt-1 font-bold text-alianza-azul">Diploma {d.numero}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Toca para ver</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reconocimientos por retos cumplidos */}
          {reconocimientos.length > 0 && (
            <div>
              <p className="text-xs font-black text-alianza-azul uppercase tracking-wide mb-2">Reconocimientos de retos</p>
              <div className="flex flex-wrap gap-3">
                {reconocimientos.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReconocimientoAbierto(r)}
                    className="flex flex-col items-center bg-fuchsia-50 hover:bg-fuchsia-100 transition rounded-2xl px-4 py-3 border-2 border-fuchsia-200 max-w-[130px]"
                  >
                    <span className="text-3xl">🎖️</span>
                    <span className="text-xs mt-1 font-bold text-alianza-azul text-center">{acortar(r.reto.titulo)}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Toca para ver</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal del diploma de ahorro */}
      {diplomaAbierto && (
        <ModalDiploma
          diploma={diplomaAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setDiplomaAbierto(null)}
          onDescargado={() => setDiplomaAbierto(null)}
        />
      )}

      {/* Modal del reconocimiento de un reto */}
      {reconocimientoAbierto && (
        <ModalReconocimiento
          ru={reconocimientoAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setReconocimientoAbierto(null)}
        />
      )}
    </TarjetaVistosa>
  );
}

export default PasaporteDiplomas;