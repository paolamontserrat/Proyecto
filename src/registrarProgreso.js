import { supabase } from "./supabaseClient"; // ajusta la ruta según tu proyecto

// Función para registrar el progreso de ahorro de un usuario y obtener información sobre retos completados y meta completada.
export async function registrarProgreso(usuarioId, monto) {
  // Llama a la función remota en Supabase para registrar el progreso de ahorro.
  const { data, error } = await supabase.rpc("registrar_progreso_ahorro", {
    p_usuario_id: usuarioId,
    p_monto: monto,
  });

  if (error || !data?.ok) {
    console.error("registrar_progreso_ahorro:", error || data?.error);
    return { retosCompletados: [], metaCompletada: null };
  }

  // Devuelve los retos completados y la meta completada (si existe) después de registrar el progreso.
  return {
    retosCompletados: data.retos_completados || [],
    metaCompletada: data.meta_completada || null,
  };
}