import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function ProgresoAventura({ rango }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const userId = usuario?.id;

  const [stats, setStats] = useState({
    estrellas: 0,
    racha: 0,
    insignias: 0,
  });

  const [completadas, setCompletadas] = useState(0);
  const [total, setTotal] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!userId) {
        setCargando(false);
        return;
      }

      setCargando(true);

      const [
        { data: gami, error: gamiError },
        { data: progreso, error: progresoError },
        { count: insigniasCount, error: insigniasError },
        jsonRes,
      ] = await Promise.all([
        // Estrellas y racha
        supabase
          .from('gamificacion_usuario')
          .select('estrellas, racha')
          .eq('usuario_id', String(userId))
          .maybeSingle(),

        // Actividades completadas
        supabase
          .from('progreso_actividades')
          .select('actividad_id')
          .eq('usuario_id', userId)
          .eq('completada', true),

        // Insignias ganadas
        supabase
          .from('insignias_ganadas')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', String(userId)),

        // Total de actividades
        fetch(`/data/${rango}.json`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (gamiError) {
        console.error('Error cargando gamificacion_usuario:', gamiError);
      }

      if (progresoError) {
        console.error('Error cargando progreso:', progresoError);
      }

      if (insigniasError) {
        console.error('Error cargando insignias:', insigniasError);
      }

      setStats({
        estrellas: gami?.estrellas || 0,
        racha: gami?.racha || 0,
        insignias: insigniasCount || 0,
      });

      setCompletadas(progreso?.length || 0);

      setTotal(
        Array.isArray(jsonRes?.pasos)
          ? jsonRes.pasos.length
          : null
      );

      setCargando(false);
    };

    cargar();
  }, [userId, rango]);

  if (cargando || !userId) return null;

  const pct = total
    ? Math.min(100, Math.round((completadas / total) * 100))
    : 0;

  return (
    <div className="bg-white/95 rounded-3xl p-5 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="font-black text-alianza-azul text-sm">
          🚀 Tu aventura
        </p>

        <span className="text-xs text-gray-400">
          {completadas}
          {total ? ` / ${total}` : ''} actividades
        </span>
      </div>

      <div className="relative h-6 bg-gray-100 rounded-full mb-4 mt-7">
        <div
          className="h-full bg-gradient-to-r from-alianza-amarillo to-yellow-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />

        <img
          src="/images/gamificacion/nino-patin.png"
          alt="Tu avance"
          className="absolute -top-7 w-12 h-12 object-contain transition-all duration-700"
          style={{ left: `calc(${pct}% - 24px)` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-blue-50 rounded-xl py-2">
          <p className="text-lg font-black text-alianza-azul">
            ⭐ {stats.estrellas}
          </p>
          <p className="text-[10px] text-gray-500">
            Estrellas
          </p>
        </div>

        <div className="bg-orange-50 rounded-xl py-2">
          <p className="text-lg font-black text-orange-500">
            🔥 {stats.racha}
          </p>
          <p className="text-[10px] text-gray-500">
            Racha
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl py-2">
          <p className="text-lg font-black text-purple-600">
            🏅 {stats.insignias}
          </p>
          <p className="text-[10px] text-gray-500">
            Insignias
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProgresoAventura;