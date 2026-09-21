// Progreso de un hábito: circulitos con estrella si son pocos días, barra si son muchos.
// Lo usan tanto los retos como las metas personales para que se vean igual.
const ProgresoDias = ({ actual, meta, porcentaje }) => {
  const pct =
    porcentaje ?? (meta > 0 ? Math.min(100, Math.round((actual / meta) * 100)) : 0);

  if (meta <= 14) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: meta }, (_, i) => (
          <span
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              i < actual ? "bg-alianza-amarillo text-alianza-azul" : "bg-gray-100 text-gray-300"
            }`}
          >
            {i < actual ? "★" : i + 1}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div className="bg-alianza-amarillo h-3 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
};

export default ProgresoDias;