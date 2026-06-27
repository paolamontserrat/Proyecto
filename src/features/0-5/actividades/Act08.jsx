import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';


const Act08 = ({ data, onComplete, onBack, rango }) => {
  const [indice, setIndice] = useState(0);
const navigate = useNavigate();
  // COMPATIBILIDAD TOTAL
  const escenas =
    data?.escenas ||
    data?.contenido ||
    data?.pasos ||
    [];

  if (!data) {
    return (
      <LayoutActividad fondo="">
        <div className="p-10 text-center font-bold text-red-600">
          Cargando actividad...
        </div>
      </LayoutActividad>
    );
  }

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

  //  USUARIO
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario?.id;

  const storageKey = `act08-${rango}`;

  // ==============================
  //  GUARDADO GLOBAL (ESPEJO)
  // ==============================
  const guardarTodo = async () => {
    localStorage.setItem(storageKey, "visitado");

    if (userId) {
      try {
        await supabase.from('progreso_actividades').upsert({
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {
            escena_actual: indice
          },
          completada: indice >= escenas.length - 1
        }, {
          onConflict: 'usuario_id, actividad_id'
        });

      } catch (err) {
        console.warn("Offline, se sincroniza después");
      }
    }
  };

  // ==============================
  //  REINTENTO ONLINE
  // ==============================
  useEffect(() => {
    const handleOnline = () => guardarTodo();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [indice]);

  // ==============================
  // NAVEGACIÓN
  // ==============================
  const siguiente = async () => {
    if (indice < escenas.length - 1) {
      const nuevo = indice + 1;
      setIndice(nuevo);
      await guardarTodo();
    } else {
      await guardarTodo();
      onComplete?.();
    }
  };

  const anterior = async () => {
    if (indice > 0) {
      const nuevo = indice - 1;
      setIndice(nuevo);
      await guardarTodo();
    }
  };

  const regresar = async () => {
    await guardarTodo();
    onBack?.();
  };

  return (
    <LayoutActividad fondo={data?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      {/* CARD */}
      <div className="bg-white/95 p-4 sm:p-6 md:p-8 rounded-[2rem] border-[6px] border-yellow-400 w-full shadow-2xl text-center">

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

            <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
              {(escena?.imagenes || []).map((img, i) => (
                <motion.img
                  key={i}
                  src={img}
                  className="w-40 sm:w-56 md:w-72 h-24 sm:h-32 md:h-40 object-contain drop-shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                />
              ))}
            </div>

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