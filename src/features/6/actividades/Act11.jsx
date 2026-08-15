import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act11 = ({ data, onBack, onComplete, rango }) => {

  const navigate = useNavigate();

  // =========================
  //  USER SEGURO
  // =========================
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  };

  const userId = getUser()?.id || "anon";

  // =========================
  //  KEY MULTIUSUARIO (FIX REAL)
  // =========================
  const storageKey = `act11-${rango}-${userId}`;

  // =========================
  //  GUARDADO GLOBAL (VACÍO {})
  // =========================
  const guardar = async () => {

    //  LOCAL POR USUARIO
    localStorage.setItem(storageKey, JSON.stringify({}));

    //  SUPABASE
    if (userId !== "anon") {
      try {
        await supabase.from('progreso_actividades').upsert({
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {}, //  SIEMPRE VACÍO
          completada: true
        }, {
          onConflict: 'usuario_id, actividad_id'
        });
      } catch (err) {
        console.warn("Offline, se sincroniza después");
      }
    }
  };

  // =========================
  //  AUTO-GUARDAR AL ENTRAR
  // =========================
  useEffect(() => {
    guardar();
  }, [userId]);

  // =========================
  //  REINTENTO ONLINE
  // =========================
  useEffect(() => {
    const handleOnline = () => guardar();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [userId]);

  // =========================
  //  CONTINUAR
  // =========================
  const handleContinue = async () => {
    await guardar();
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

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

      {/* CONTENEDOR */}
      <div className="
        bg-white/90
        p-6 md:p-10
        rounded-[2rem]
        shadow-2xl
        border-4 border-alianza-amarillo
        max-w-5xl
        mx-auto
      ">

        {/* TÍTULO */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-6"
        >
          {data.titulo}
        </motion.h2>

        {/* BLOQUES */}
        <div className="space-y-10">

          {data.bloques.map((b, i) => (

            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className="flex flex-col md:flex-row items-center gap-6"
            >

              {/* TARJETA */}
              <div className={`
                flex-1
                rounded-[2rem]
                overflow-hidden
                shadow-xl
                ${b.color === 'azul' ? 'bg-blue-900' : 'bg-purple-900'}
              `}>

                <div className="bg-white py-3 text-center font-black text-lg md:text-2xl text-blue-800 rounded-b-[2rem] shadow">
                  {b.titulo}
                </div>

                <div className="p-5 text-white space-y-3 text-sm md:text-base">

                  {b.descripcion.map((d, idx) => (
                    <p key={idx}>{d}</p>
                  ))}

                  <div className="border-t border-dashed border-white my-3"></div>

                  <p className="font-bold">{b.listaTitulo}</p>

                  <ul className="space-y-1">
                    {b.lista.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>

                  <div className="border-t border-dashed border-white my-3"></div>

                  {b.frase.map((f, idx) => (
                    <p key={idx}>{f}</p>
                  ))}

                  <p className="bg-white text-blue-700 font-black text-center py-2 rounded-xl mt-3">
                    {b.final}
                  </p>

                </div>
              </div>

              {/* IMAGEN */}
              <motion.img
                src={b.imagen}
                alt=""
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-52 md:w-68 object-contain"
              />

            </motion.div>

          ))}

        </div>

        {/* PERSONAJE FINAL */}
        <motion.img
          src={data.recursos.personaje}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-32 md:w-40 mx-auto mt-8"
        />

        {/* BOTÓN */}
        <button
          onClick={handleContinue}
          className="w-full mt-8 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-[1.02] transition"
        >
          Continuar
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act11;