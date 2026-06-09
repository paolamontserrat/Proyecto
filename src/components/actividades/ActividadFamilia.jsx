import React from 'react';

const ActividadFamilia = ({ data, onComplete, onBack }) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Botón de Regreso */}
      <button 
        onClick={onBack}
        className="mb-6 bg-alianza-azul text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-800 transition shadow-md"
      >
        <span>←</span> Regresar
      </button>

      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-alianza-amarillo shadow-xl text-center">
        <h2 className="text-2xl font-black text-alianza-azul mb-4 uppercase">
          {data.titulo}
        </h2>
        
        <p className="text-lg text-gray-700 mb-6 italic">
          {data.contenido}
        </p>

        <div className="my-6 p-6 border-4 border-dashed border-alianza-azul rounded-2xl bg-gray-50">
          <p className="font-bold text-alianza-azul">
            "Dibuja a tu familia ahorrando juntos"
          </p>
        </div>

        <button 
          onClick={onComplete} 
          className="w-full bg-alianza-amarillo py-4 rounded-full font-black text-alianza-azul shadow-lg hover:scale-105 transition-transform"
        >
          ¡Terminé mi dibujo!
        </button>
      </div>
    </div>
  );
};

export default ActividadFamilia;