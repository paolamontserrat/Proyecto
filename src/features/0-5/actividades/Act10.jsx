import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';


const Act10 = ({ data, onComplete, onBack, rango }) => {
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

  //  USUARIO
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario?.id;

  //  CLAVE MULTIUSUARIO (FIX)
  const storageKey = `act10-lectura-${rango}-${userId || 'anon'}`;

  const partes = data?.texto?.partes || [];

  // ==============================
  //  GUARDADO GLOBAL
  // ==============================
  const guardarTodo = async () => {

    // 1. LOCAL (POR USUARIO)
    localStorage.setItem(storageKey, "visitado");

    // 2. SUPABASE
    if (userId) {
      try {
        await supabase.from('progreso_actividades').upsert({
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {},
          completada: true
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
  }, []);

  // ==============================
  //  CONTINUAR
  // ==============================
  const continuar = () => {
    guardarTodo();
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.fondo}>

      <div className="relative min-h-screen w-full">

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

        {/* TARJETA */}
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

        {/* BOTÓN */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={continuar}
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