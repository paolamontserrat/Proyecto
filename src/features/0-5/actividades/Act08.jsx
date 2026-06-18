import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act08 = ({ data, onComplete, onBack }) => {
  const [indice, setIndice] = useState(0);

  // COMPATIBILIDAD TOTAL (escenas o fallback)
  const escenas =
    data?.escenas ||
    data?.contenido ||
    data?.pasos ||
    [];

  // SI NO HAY DATA
  if (!data) {
    return (
      <LayoutActividad fondo="">
        <div className="p-10 text-center font-bold text-red-600">
          Cargando actividad...
        </div>
      </LayoutActividad>
    );
  }

  // SI NO HAY ESCENAS
  if (!Array.isArray(escenas) || escenas.length === 0) {
    return (
      <LayoutActividad fondo={data?.fondo}>
        <div className="p-10 text-center font-bold text-red-600">
          Esta actividad no tiene contenido disponible
        </div>
      </LayoutActividad>
    );
  }

  const escena = escenas[indice] || {};

  const siguiente = () => {
    if (indice < escenas.length - 1) {
      setIndice(indice + 1);
    } else {
      onComplete?.();
    }
  };

  const anterior = () => {
    if (indice > 0) setIndice(indice - 1);
  };

  return (
    <LayoutActividad fondo={data?.fondo}>

      {/* BACK */}
      <div className="w-full mb-4">
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-5 py-3 rounded-full font-bold text-sm sm:text-base"
        >
          ← Regresar
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white/95 p-4 sm:p-6 md:p-8 rounded-[2rem] border-[6px] border-yellow-400 w-full shadow-2xl text-center">

        {/* TITULOS */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-700">
          {data?.titulo}
        </h2>

        <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-600 mb-2 sm:mb-4">
          {data?.subtitulo}
        </p>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-pink-500 mb-4 sm:mb-6">
          {data?.cuentoTitulo}
        </h1>

        {/* ESCENA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={indice}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -30 }}
            transition={{ duration: 0.4 }}
          >

            {/* IMÁGENES */}
            <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
              {(escena?.imagenes || []).map((img, i) => (
                <motion.img
                  key={i}
                  src={img}
                  className="
                    w-40 sm:w-56 md:w-72
                    h-24 sm:h-32 md:h-40
                    object-contain
                    drop-shadow-lg
                  "
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                />
              ))}
            </div>

            {/* TEXTO */}
            <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-800 leading-relaxed px-2 sm:px-4">
              {escena?.texto || "Sin texto disponible"}
            </p>

          </motion.div>
        </AnimatePresence>

        {/* CONTROLES */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">

          <button
            onClick={anterior}
            disabled={indice === 0}
            className="bg-gray-300 px-4 py-4 rounded-full font-bold w-full disabled:opacity-50 text-sm sm:text-base"
          >
            Anterior
          </button>

          <button
            onClick={siguiente}
            className="bg-yellow-400 px-4 py-4 rounded-full font-black w-full text-sm sm:text-base"
          >
            {indice === escenas.length - 1 ? "Finalizar" : "Siguiente"}
          </button>

        </div>

        

      </div>
    </LayoutActividad>
  );
};

export default Act08;