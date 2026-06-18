import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act11 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  if (!data) {
    return (
      <LayoutActividad fondo="">
        <div className="p-10 text-center font-bold text-red-600">
          Cargando actividad...
        </div>
      </LayoutActividad>
    );
  }

  const tip = data?.tip || {};
  const mensajes = data?.mensajesAnimados || [];
  const actividadFinal = data?.actividadFinal || {};

  return (
    <LayoutActividad fondo={data.fondo}>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full flex flex-col items-center">

        {/* 🔙 BOTÓN REGRESAR */}
        <div className="w-full max-w-5xl mb-4">
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm sm:text-base"
          >
            ← Regresar
          </button>
        </div>

        {/* 💡 TIP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            bg-white/90 backdrop-blur-md
            p-5 sm:p-8
            rounded-[2rem] sm:rounded-[3rem]
            border-4 border-yellow-400
            shadow-2xl
            flex flex-col md:flex-row
            items-center gap-6 sm:gap-8
            max-w-5xl mb-10
          "
        >
          <img
            src={tip.imagen}
            className="w-40 sm:w-60 h-auto object-contain"
          />

          <div>
            <h2 className="text-xl sm:text-3xl font-black text-yellow-600 mb-3">
              {tip.titulo}
            </h2>

            {(tip.descripcion || []).map((t, i) => (
              <p key={i} className="text-base sm:text-xl font-bold text-gray-700">
                {t}
              </p>
            ))}
          </div>
        </motion.div>

        {/* MENSAJES */}
        <div className="space-y-10 w-full max-w-5xl">

          {mensajes.map((item, i) => (
            <motion.div
              key={i}
              initial={{
                x: item.direccion === 'izquierda' ? -200 : 200,
                opacity: 0
              }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.4 }}
              className={`flex items-center gap-6 sm:gap-8 ${
                item.direccion === 'izquierda'
                  ? 'flex-row'
                  : 'flex-row-reverse'
              }`}
            >

              {/* CUADRO */}
              <div className="
                bg-yellow-300
                px-4 sm:px-8
                py-6 sm:py-10
                rounded-3xl
                font-black
                text-sm sm:text-xl
                shadow-xl
                max-w-xs sm:max-w-md
              ">
                {item.texto}
              </div>

              {/* IMAGEN */}
              <img
                src={item.imagen}
                className="
                  w-28 sm:w-56
                  h-auto object-contain
                "
              />

            </motion.div>
          ))}
        </div>

        {/* ACTIVIDAD FINAL */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="
            mt-16
            bg-white/90
            p-6 sm:p-8
            rounded-[2rem] sm:rounded-[3rem]
            border-4 border-blue-400
            text-center
            shadow-2xl
            max-w-3xl
          "
        >
          <p className="text-base sm:text-xl font-black text-gray-700 mb-6">
            {actividadFinal.texto}
          </p>

          {/* PASSPORT */}
          <button
            onClick={() => navigate(`/pasaporte/${rango}`)}
            className="
              bg-alianza-azul
              text-white
              px-8 sm:px-10
              py-3 sm:py-4
              rounded-full
              font-black
              text-base sm:text-xl
              hover:scale-110 transition
              mb-4
              w-full sm:w-auto
            "
          >
            {actividadFinal.boton}
          </button>

          {/* CONTINUAR */}
          <button
            onClick={onComplete}
            className="
              w-full
              bg-yellow-400
              py-3 sm:py-4
              rounded-full
              font-black
              text-base sm:text-xl
              hover:scale-105 transition
            "
          >
            Continuar
          </button>
        </motion.div>

      </div>

    </LayoutActividad>
  );
};

export default Act11;