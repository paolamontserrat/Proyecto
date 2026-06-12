import React from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act10 = ({ data, onComplete, onBack }) => {
  if (!data) {
    return (
      <LayoutActividad fondo="">
        <div className="p-10 text-center font-bold text-red-600">
          Cargando actividad...
        </div>
      </LayoutActividad>
    );
  }

  const partes = data?.texto?.partes || [];

  return (
    <LayoutActividad fondo={data.fondo}>

      {/* CONTENEDOR BASE (IMPORTANTE PARA ABSOLUTE) */}
      <div className="relative min-h-screen w-full">

        {/* BOTÓN REGRESAR */}
        <div className="w-full max-w-5xl mb-6">
          <button
            onClick={onBack}
            className="bg-alianza-azul text-white px-8 py-3 rounded-full font-black shadow-lg hover:scale-105 transition"
          >
            ← Regresar
          </button>
        </div>

        {/* 🔥 CUADRO ARRIBA DERECHA (MISMA POSICIÓN EXACTA) */}
        <motion.div
          initial={{ opacity: 0, x: 100, y: -50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8 }}
          className="
            absolute top-10 right-10
            max-w-md
            bg-blue-600/60 backdrop-blur-lg
            p-8 rounded-[2rem]
            border border-blue-300/40
            shadow-2xl text-white
            z-20
          "
        >

          {/* TEXTO SEGURO */}
          <p className="text-2xl md:text-3xl font-bold leading-relaxed">
            {partes.length > 0 ? (
              partes.map((parte, i) =>
                parte?.destacar ? (
                  <span key={i} className="text-yellow-300 font-extrabold">
                    {parte.texto}{' '}
                  </span>
                ) : (
                  <span key={i}>
                    {parte.texto}{' '}
                  </span>
                )
              )
            ) : (
              <span>Sin contenido disponible</span>
            )}
          </p>

        </motion.div>

        {/* BOTÓN FINAL */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="
              bg-alianza-amarillo
              px-12 py-4
              rounded-full
              font-black text-xl
              shadow-xl
            "
          >
            Continuar
          </motion.button>
        </div>

      </div>

    </LayoutActividad>
  );
};

export default Act10;