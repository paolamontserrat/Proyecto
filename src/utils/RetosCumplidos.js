// Arma las filas de la tabla "Retos cumplidos por niño" (pantalla y Excel).
//  - usuarios:    [{ id, nombre, numero_socio, rango }]
//  - retos:       [{ id, titulo, tipo, recompensa_monedas }]
//  - completados: [{ usuario_id, reto_id, completado_en }]  (solo retos ya cumplidos)
// Devuelve un arreglo de niños con sus retos cumplidos y el porcentaje, ordenado de más a menos retos.
export const resumirRetosCumplidos = (usuarios, retos, completados) => {
  const retoPorId = new Map(retos.map((r) => [r.id, r]));
  const porUsuario = new Map();

  completados.forEach((c) => {
    const reto = retoPorId.get(c.reto_id);
    if (!reto) return; // el reto ya no existe
    if (!porUsuario.has(c.usuario_id)) porUsuario.set(c.usuario_id, []);
    porUsuario.get(c.usuario_id).push({ ...reto, completado_en: c.completado_en });
  });

  const total = retos.length;

  return usuarios
    .map((u) => {
      const cumplidos = (porUsuario.get(u.id) || []).sort(
        (a, b) => new Date(b.completado_en) - new Date(a.completado_en)
      );
      return {
        ...u,
        cumplidos,
        total,
        porcentaje: total > 0 ? Math.min(100, Math.round((cumplidos.length / total) * 100)) : 0,
      };
    })
    .sort((a, b) => b.cumplidos.length - a.cumplidos.length || a.nombre.localeCompare(b.nombre));
};

// Número de socio con puntos en medio (igual que en el resto del panel).
export const enmascararSocio = (numero) => {
  if (!numero) return "";
  return `${numero.slice(0, 2)}${"•".repeat(Math.max(0, numero.length - 4))}${numero.slice(-2)}`;
};

export const fechaCorta = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "America/Mexico_City",
      })
    : "";

// Genera y descarga el Excel con dos hojas: "Resumen" (una fila por niño) y "Detalle" (una fila por reto cumplido).
// exceljs se carga solo al pulsar el botón para no hacer más pesada la aplicación.
export const descargarExcelRetos = async (filas) => {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = "Finanzas Alianzito";

  const estiloEncabezado = (hoja) => {
    const fila = hoja.getRow(1);
    fila.font = { bold: true, color: { argb: "FFFFFFFF" } };
    fila.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004A99" } };
    fila.alignment = { vertical: "middle" };
    hoja.views = [{ state: "frozen", ySplit: 1 }];
  };

  // Hoja 1: resumen por niño
  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Edad", key: "rango", width: 8 },
    { header: "Nombre", key: "nombre", width: 34 },
    { header: "Número de socio", key: "socio", width: 18 },
    { header: "Retos cumplidos", key: "cumplidos", width: 16 },
    { header: "Total de retos", key: "total", width: 14 },
    { header: "Avance (%)", key: "porcentaje", width: 12 },
  ];
  filas.forEach((f) =>
    resumen.addRow({
      rango: f.rango,
      nombre: f.nombre,
      socio: f.numero_socio,
      cumplidos: f.cumplidos.length,
      total: f.total,
      porcentaje: f.porcentaje,
    })
  );
  estiloEncabezado(resumen);

  // Hoja 2: detalle de cada reto cumplido
  const detalle = libro.addWorksheet("Detalle");
  detalle.columns = [
    { header: "Edad", key: "rango", width: 8 },
    { header: "Nombre", key: "nombre", width: 34 },
    { header: "Número de socio", key: "socio", width: 18 },
    { header: "Reto", key: "reto", width: 40 },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Fecha en que lo cumplió", key: "fecha", width: 24 },
    { header: "Monedas", key: "monedas", width: 10 },
  ];
  filas.forEach((f) =>
    f.cumplidos.forEach((r) =>
      detalle.addRow({
        rango: f.rango,
        nombre: f.nombre,
        socio: f.numero_socio,
        reto: r.titulo,
        tipo: r.tipo === "habito" ? "Hábito" : "Ahorro",
        fecha: fechaCorta(r.completado_en),
        monedas: r.recompensa_monedas,
      })
    )
  );
  estiloEncabezado(detalle);

  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `retos-cumplidos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};