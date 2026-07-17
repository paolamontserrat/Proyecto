const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function PasaporteSellos({ ahorros, mesActual, sellosReales = [] }) {
  return (
    <div className="max-w-sm mx-auto bg-white/90 rounded-2xl p-3 mb-4">
      <p className="text-xs font-bold text-alianza-azul mb-2 text-center">Tus sellos del año</p>

      <div className="grid grid-cols-6 gap-2">
        {MESES.map((mes, i) => {
          const total = (ahorros[mes] || []).reduce((s, a) => s + Number(a.monto), 0);
          const conseguido = sellosReales.some((s) => s.mes === mes);
          const esActual = mes === mesActual;
          const progreso = Math.min(100, Math.round((total / 100) * 100));

          return (
            <div key={mes} className="flex flex-col items-center">
              <div
                title={`${mes}: $${total}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                  conseguido
                    ? 'bg-alianza-amarillo border-alianza-amarillo'
                    : esActual
                      ? 'border-alianza-azul bg-white'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                {conseguido && '🏅'}
              </div>
              <span className="text-[9px] text-gray-500 mt-1">{ABREV[i]}</span>
              {esActual && !conseguido && (
                <div className="w-7 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-alianza-azul" style={{ width: `${progreso}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PasaporteSellos;