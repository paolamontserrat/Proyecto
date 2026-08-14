import { useState } from 'react';
import ModalDiploma from './ModalDiploma';

function PasaporteDiplomas({ diplomas }) {
  const [diplomaAbierto, setDiplomaAbierto] = useState(null);
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  if (!diplomas || diplomas.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-br from-alianza-azul to-blue-800 rounded-3xl p-4 shadow-lg">
      <p className="text-sm font-black text-alianza-amarillo mb-3 text-center">
        🏆 Tus diplomas ganados
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {diplomas.map((d) => (
          <button
            key={d.numero}
            onClick={() => setDiplomaAbierto(d)}
            className="flex flex-col items-center bg-white/10 hover:bg-white/20 transition rounded-2xl px-4 py-3 border-2 border-alianza-amarillo/60"
          >
            <span className="text-4xl drop-shadow">🏆</span>
            <span className="text-xs mt-1 font-bold text-white">Diploma {d.numero}</span>
            <span className="text-[10px] text-alianza-amarillo mt-0.5">Toca para ver</span>
          </button>
        ))}
      </div>

      {diplomaAbierto && (
        <ModalDiploma
          diploma={diplomaAbierto}
          nombreUsuario={usuario?.nombre}
          onClose={() => setDiplomaAbierto(null)}
          onDescargado={() => setDiplomaAbierto(null)}
        />
      )}
    </div>
  );
}

export default PasaporteDiplomas;