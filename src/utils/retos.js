import { hoyMX } from "./fecha";

// Datos visuales por tipo de reto.
export const TIPOS_RETO = {
  ahorro: { emoji: "💰", nombre: "Ahorro", gradiente: "from-yellow-300 to-amber-400" },
  habito: { emoji: "🌱", nombre: "Hábito", gradiente: "from-emerald-300 to-teal-400" },
};

export const tipoDe = (reto) => TIPOS_RETO[reto?.tipo] || TIPOS_RETO.ahorro;

// "vigente" | "proximo" | "vencido" según la fecha de México.
export const estadoReto = (reto) => {
  const hoy = hoyMX();
  if (hoy < reto.fecha_inicio) return "proximo";
  if (hoy > reto.fecha_fin) return "vencido";
  return "vigente";
};

export const ETIQUETAS_ESTADO = {
  vigente: { texto: "🟢 Vigente", chip: "bg-green-100 text-green-700", color: "text-green-600" },
  proximo: { texto: "🔵 Próximo", chip: "bg-blue-100 text-blue-700", color: "text-blue-500" },
  vencido: { texto: "⚪ Vencido", chip: "bg-gray-100 text-gray-500", color: "text-gray-400" },
};

// Avance de un reto del usuario, sea de ahorro (pesos) o de hábito (días).
export const datosProgreso = (ru) => {
  const esHabito = ru.reto.tipo === "habito";
  const meta = Number(esHabito ? ru.reto.meta_dias : ru.reto.meta_monto) || 0;
  const actual = Number(ru.progreso) || 0;
  const porcentaje = ru.completado
    ? 100
    : meta > 0
      ? Math.min(100, Math.round((actual / meta) * 100))
      : 0;
  const texto = esHabito ? `${actual} / ${meta} días` : `$${actual} / $${meta}`;
  return { esHabito, actual, meta, porcentaje, texto };
};

// "2026-09-21" -> "21 sep". Se fija el mediodía para que la zona horaria no cambie el día.
export const formatearFecha = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

// Los más recientes primero (por fecha de creación del reto).
export const porMasReciente = (a, b) =>
  new Date(b.reto.creado_en) - new Date(a.reto.creado_en);