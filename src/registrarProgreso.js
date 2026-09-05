import { supabase } from "./supabaseClient"; // ajusta la ruta según tu proyecto

// Llama a esto desde donde HOY registras un depósito de ahorro (junto a tu
// lógica existente de ahorros_usuario / sellos_digitales). Le pasas el monto
// del depósito nuevo y te regresa qué retos y qué meta se completaron en
// esta llamada, para mostrar <ModalReto /> y/o <ModalMeta /> justo ahí.
export async function registrarProgreso(usuarioId, monto) {
  const { data, error } = await supabase.rpc("registrar_progreso_ahorro", {
    p_usuario_id: usuarioId,
    p_monto: monto,
  });

  if (error || !data?.ok) {
    console.error("registrar_progreso_ahorro:", error || data?.error);
    return { retosCompletados: [], metaCompletada: null };
  }

  return {
    retosCompletados: data.retos_completados || [],
    metaCompletada: data.meta_completada || null,
  };
}