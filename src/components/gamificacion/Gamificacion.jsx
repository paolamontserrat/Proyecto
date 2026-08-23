import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export function useGamificacion(userId) {
  const [celebracion, setCelebracion] = useState(null);

  const registrarActividad = useCallback(async (actividadId) => {
    if (!userId || userId === 'anon') return { nuevo: false };

    const { data, error } = await supabase.rpc('registrar_actividad_completada', {
      p_usuario_id: String(userId),
      p_actividad_id: actividadId,
    });

    if (error || !data?.ok || !data.nuevo) return { nuevo: false };

    if (data.insignia_nueva) {
      setCelebracion({ tipo: 'insignia', ...data.insignia_nueva, estrellas: data.estrellas });
    } else {
      setCelebracion({ tipo: 'estrella', estrellas: data.estrellas, racha: data.racha });
    }

    return { nuevo: true };
  }, [userId]);

  const cerrarCelebracion = () => setCelebracion(null);

  return { celebracion, registrarActividad, cerrarCelebracion };
}