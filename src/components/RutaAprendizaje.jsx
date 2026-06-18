import React, { useState } from 'react';
import Footer from './Footer';

const RutaAprendizaje = ({ pasos, onSelectPaso }) => {
  const [progreso, setProgreso] = useState(() => parseInt(localStorage.getItem('progreso-0-5')) || 1);

  return (
    <div className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-alianza-azul text-center mb-6">¡TU CAMINO AL AHORRO!</h2>
      
      {pasos.map((paso) => {
        const estaBloqueado = paso.id > progreso;
        const estaCompletado = paso.id < progreso;

        return (
          <div 
            key={paso.id} 
            onClick={() => !estaBloqueado && onSelectPaso(paso)} // Navega si no está bloqueado
            className={`p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${
              estaBloqueado 
                ? 'bg-gray-200 opacity-60 border-gray-300' 
                : 'bg-white border-alianza-amarillo shadow-xl hover:scale-[1.02]'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-black text-alianza-azul">PASO {paso.id}</span>
              {estaCompletado && <span className="text-green-600 font-black">✓ Completado</span>}
            </div>
            
            <h3 className="text-xl font-black text-alianza-azul">{paso.titulo}</h3>
            {estaBloqueado && <p className="text-center font-bold text-gray-500 mt-2">🔒 Actividad Bloqueada</p>}
          </div>
        );
      })}
      <Footer />
    </div>
  );
};

export default RutaAprendizaje;