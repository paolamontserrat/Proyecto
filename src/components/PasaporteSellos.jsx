import TarjetaVistosa from "./TarjetaVistosa";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function PasaporteSellos({ ahorros, mesActual, sellosReales = [] }) {
  const totalGanados = sellosReales.length;

  return (
    <TarjetaVistosa emoji="🏅" titulo="Sellos" resumen={`${totalGanados}/12`} color="amarillo">
      <div className="grid grid-cols-4 gap-3">
        {MESES.map((mes, i) => {
          const total = (ahorros[mes] || []).reduce((s, a) => s + Number(a.monto), 0);
          const conseguido = sellosReales.some((s) => s.mes === mes);
          const esActual = mes === mesActual;
          const progreso = Math.min(100, Math.round((total / 100) * 100));

          return (
            <div key={mes} className="flex flex-col items-center">
              <div
                title={`${mes}: $${total}`}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 transition-transform ${
                  conseguido
                    ? 'bg-alianza-amarillo border-yellow-300 shadow-md scale-105'
                    : esActual
                      ? 'border-alianza-azul bg-blue-50 animate-pulse'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                {conseguido ? '🏅' : esActual ? '⏳' : ''}
              </div>
              <span
                className={`text-xs mt-1.5 font-bold ${
                  conseguido ? 'text-alianza-azul' : esActual ? 'text-alianza-azul' : 'text-gray-400'
                }`}
              >
                {ABREV[i]}
              </span>
              {esActual && !conseguido && (
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-alianza-azul transition-all"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TarjetaVistosa>
  );
}

export default PasaporteSellos;