import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
// Hook personalizado para manejar la gamificación del usuario.
export function useGamificacion(userId) {
  const [celebracion, setCelebracion] = useState(null);

  // Función para registrar la actividad completada por el usuario.
  const registrarActividad = useCallback(async (actividadId) => {
    if (!userId || userId === 'anon') return { nuevo: false };

    // Llama a la función remota en Supabase para registrar la actividad completada.
    const { data, error } = await supabase.rpc('registrar_actividad_completada', {
      p_usuario_id: String(userId),
      p_actividad_id: actividadId,
    });

    if (error || !data?.ok || !data.nuevo) return { nuevo: false };

    // Si se completó una insignia nueva, se guarda en el estado de celebración.
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