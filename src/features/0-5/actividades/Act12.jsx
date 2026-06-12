import React from 'react';
import { motion } from 'framer-motion';

const Act12 = ({ data, onComplete, onBack }) => {
  if (!data) return null;

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-24"
      style={{
        backgroundImage: `url(${data.fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >

      {/* CAPA OSCURA */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* BOTÓN REGRESAR */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-6 py-3 rounded-full font-black hover:scale-105 transition"
        >
          ← Regresar
        </button>
      </div>

      {/* CUADRO SUPERIOR DERECHA */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-14 right-6 max-w-xs sm:max-w-sm z-40"
      >
        <div className="bg-black/20 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-white/20 text-center shadow-xl">

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            APRENDÍ QUE:
          </h2>

          {(data?.contenido?.aprendi || []).map((item, i) => (
            <p key={i} className="text-lg sm:text-2xl font-extrabold text-white">
              “{item}”
            </p>
          ))}

        </div>
      </motion.div>

      {/* CUADRO AZUL ABAJO IZQUIERDA */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-10 left-6 max-w-xs sm:max-w-md z-20"
      >
        <div className="bg-blue-600/70 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] border-4 border-blue-400 text-white shadow-2xl">

          <p className="text-sm sm:text-lg font-bold mb-2">
            {data?.contenido?.mensajeFinal?.lineas?.[0]}
          </p>

          <p className="text-base sm:text-xl font-black text-yellow-300 mb-2">
            {data?.contenido?.mensajeFinal?.lineas?.[1]}
          </p>

          <p className="text-sm sm:text-lg font-bold">
            {data?.contenido?.mensajeFinal?.lineas?.[2]}
          </p>

          <div className="mt-4">
            <img
              src={data?.contenido?.logo}
              className="w-40 sm:w-40 object-contain"
            />
          </div>

        </div>
      </motion.div>

      {/* BOTÓN FINAL */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={onComplete}
          className="bg-alianza-amarillo px-10 sm:px-12 py-4 sm:py-6 rounded-full font-black text-lg sm:text-2xl shadow-2xl"
        >
          Finalizar
        </motion.button>
      </div>

    </div>
  );
};

export default Act12;