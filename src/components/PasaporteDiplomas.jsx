import { useState } from 'react';
import TarjetaVistosa from './TarjetaVistosa';
import ModalDiploma from './ModalDiploma';
// Componente que muestra los diplomas obtenidos por el usuario en un formato vistoso.
function PasaporteDiplomas({ diplomas }) {
  const [diplomaAbierto, setDiplomaAbierto] = useState(null);// Estado para controlar qué diploma está abierto en el modal.
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const total = diplomas?.length || 0;

  return (
    <TarjetaVistosa emoji="🏆" titulo="Diplomas" resumen={total} color="azul">
      {total === 0 ? (
        <p className="text-sm text-gray-400">Aún no tienes diplomas.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {diplomas.map((d) => (
            // Botón que representa cada diploma, al tocarlo se abre un modal con más detalles.
            <button
              key={d.numero}
              onClick={() => setDiplomaAbierto(d)}
              className="flex flex-col items-center bg-alianza-azul/5 hover:bg-alianza-azul/10 transition rounded-2xl px-4 py-3 border-2 border-alianza-azul/20"
            >
              <span className="text-3xl">🏆</span>
              <span className="text-xs mt-1 font-bold text-alianza-azul">Diploma {d.numero}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Toca para ver</span>
            </button>
          ))}
        </div>
      )}
       {/* Modal que se muestra cuando el usuario toca un diploma para ver más detalles. */}
      {diplomaAbierto && (
        <ModalDiploma
          diploma={diplomaAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setDiplomaAbierto(null)}
          onDescargado={() => setDiplomaAbierto(null)}
        />
      )}
    </TarjetaVistosa>
  );
}

export default PasaporteDiplomas;