// Fecha de "hoy" en formato YYYY-MM-DD usando la zona horaria de México.
// Evita el desfase de toISOString(), que devuelve la fecha en UTC
// (después de las 6 pm en México ya marca el día siguiente).
export const hoyMX = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

// Días que abarca un rango de fechas, contando inicio y fin.
export const diasEntre = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  return Math.round((new Date(fin) - new Date(inicio)) / 86400000) + 1;
};