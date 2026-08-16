import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const NOMBRES_INSIGNIA = {
  primeros_pasos: { nombre: 'Primeros pasos', emoji: '🥇', descripcion: '5 actividades completadas' },
  explorador: { nombre: 'Explorador', emoji: '🧭', descripcion: '10 actividades completadas' },
  experto: { nombre: 'Experto ahorrador', emoji: '🌟', descripcion: '20 actividades completadas' },
};

export function useGamificacion(userId) {
  const [celebracion, setCelebracion] = useState(null);

  const registrarActividad = useCallback(async (actividadId) => {
    if (!userId || userId === 'anon') return { nuevo: false };

    const { data, error } = await supabase.rpc('registrar_actividad_completada', {
      p_usuario_id: String(userId),
      p_actividad_id: actividadId,
    });

    if (error || !data?.ok || !data.nuevo) {
      return { nuevo: false };
    }

    if (data.insignia_nueva) {
      const info = NOMBRES_INSIGNIA[data.insignia_nueva] || {
        nombre: data.insignia_nueva,
        emoji: '🏅',
        descripcion: '',
      };
      setCelebracion({ tipo: 'insignia', ...info, estrellas: data.estrellas });
    } else {
      setCelebracion({ tipo: 'estrella', estrellas: data.estrellas, racha: data.racha });
    }

    return { nuevo: true };
  }, [userId]);

  const cerrarCelebracion = () => setCelebracion(null);

  return { celebracion, registrarActividad, cerrarCelebracion };
}