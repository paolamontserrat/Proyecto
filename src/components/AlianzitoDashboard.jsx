import React from 'react';
import alianzitoImg from '../assets/Alianzito.jpeg'; // Asegúrate de tener esta imagen en tu carpeta de assets

const AlianzitoDashboard = () => {
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 text-center">
      
      <h1 className="text-alianza-amarillo text-3xl font-black italic mb-6 tracking-tight">
        ¿YA CONOCES A ALIANZITO?
      </h1>

      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-[0_8px_0_0_#FFD700]">
        <img 
          src={alianzitoImg} 
          alt="Alianzito" 
          className="w-full h-auto mb-6 rounded-2xl" 
        />
        
        <button className="bg-alianza-amarillo text-alianza-azul w-full py-4 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-lg">
          ¡EMPEZAR A JUGAR!
        </button>
      </div>
    </div>
  );
};

export default AlianzitoDashboard;