import React from 'react';
import { motion } from 'framer-motion';

const Act05 = ({ data, onComplete, onBack }) => {
  return (
    <div className="min-h-screen relative p-4 md:p-10 flex flex-col justify-between items-center overflow-x-hidden" 
         style={{ backgroundImage: `url('/images/0-5/13.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* CAPA SUPERIOR: Botón Regresar */}
      <div className="w-full flex justify-start z-20">
        <button onClick={onBack} className="bg-alianza-azul/90 text-white px-6 py-2 rounded-full font-black hover:scale-105 transition shadow-lg text-sm md:text-base">
          ← Regresar
        </button>
      </div>

      {/* CONTENEDOR DE CUADROS: 
          En PC: Se pegan a los lados y abajo (justify-between items-end)
          En Móvil: Se apilan al centro (flex-col items-center) */}
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end w-full max-w-[95%] lg:max-w-full lg:px-10 gap-6 mb-4 lg:mb-10 flex-grow">
        
        {/* CUADRO AZUL - Más pequeño y transparente */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xs lg:max-w-[320px] bg-blue-700/30 backdrop-blur-sm p-5 md:p-6 rounded-[2.5rem] border-2 border-blue-400/50 text-white shadow-xl"
        >
          <h2 className="text-yellow-300 font-black text-lg md:text-xl mb-1 uppercase leading-tight">
            {data.contenido.tipFinanciero.titulo}
          </h2>
          <p className="text-xs md:text-sm font-bold opacity-90 mb-3 italic">
            {data.contenido.tipFinanciero.subtitulo}
          </p>
          <ul className="space-y-1.5 text-[11px] md:text-xs font-medium leading-tight">
            {data.contenido.tipFinanciero.cuerpo.map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="text-yellow-300 mr-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CUADRO BLANCO - Más pequeño y transparente */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-xs lg:max-w-[320px] bg-white/30 backdrop-blur-sm p-5 md:p-6 rounded-[2.5rem] border-2 border-white/50 text-blue-950 shadow-xl"
        >
          <h2 className="font-black text-lg md:text-xl mb-3 leading-tight">
            {data.contenido.mensajePadres.titulo}
          </h2>
          <p className="font-bold text-[11px] md:text-xs mb-3 leading-snug">
            {data.contenido.mensajePadres.cuerpo[0]}
          </p>
          
          <div className="bg-pink-400/40 p-3 rounded-2xl mb-2 font-bold text-[10px] md:text-[11px] text-pink-950 border-l-4 border-pink-500/70">
            {data.contenido.mensajePadres.destacadoRosa}
          </div>
          <div className="bg-yellow-400/40 p-3 rounded-2xl font-bold text-[10px] md:text-[11px] text-yellow-950 border-l-4 border-yellow-500/70">
            {data.contenido.mensajePadres.destacadoAmarillo}
          </div>
          
          <p className="mt-3 font-bold text-[11px] md:text-xs opacity-80 leading-tight">
            {data.contenido.mensajePadres.cuerpo[2]}
          </p>
        </motion.div>
      </div>

      {/* BOTÓN FINALIZAR - Flotando al centro abajo */}
      <div className="pb-6 z-20">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete} 
          className="bg-alianza-amarillo text-alianza-azul px-10 py-3 rounded-full font-black text-lg md:text-xl shadow-2xl hover:bg-yellow-400 transition-colors"
        >
          Continuar Reto
        </motion.button>
      </div>
    </div>
  );
};

export default Act05;