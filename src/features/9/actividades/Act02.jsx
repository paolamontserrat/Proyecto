import React, { useEffect } from "react";
import { motion } from "framer-motion";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  // =========================
  // USUARIO
  // =========================
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };

  const userId = getUser()?.id || "anon";

  const storageKey = `act02-${rango}-${userId}`;

  // =========================
  // GUARDAR
  // =========================
  const guardar = async () => {
    localStorage.setItem(storageKey, JSON.stringify({}));

    if (userId !== "anon") {
      try {
        await supabase.from("progreso_actividades").upsert(
          {
            usuario_id: userId,
            actividad_id: data.id,
            datos_actividad: {},
            completada: true,
          },
          {
            onConflict: "usuario_id,actividad_id",
          },
        );
      } catch {
        console.warn("Modo offline");
      }
    }
  };

  useEffect(() => {
    guardar();
  }, []);

  useEffect(() => {
    const online = () => guardar();

    window.addEventListener("online", online);

    return () => window.removeEventListener("online", online);
  }, []);

  const continuar = async () => {
    await guardar();
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      {/* BOTONES */}

      <div className="flex justify-between mb-6">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
        >
          🏠 Inicio
        </button>
      </div>

      {/* CONTENEDOR */}

      <div
        className="
          bg-white/90
          rounded-[40px]
          border-4
          border-alianza-amarillo
          shadow-2xl
          p-8
          max-w-6xl
          mx-auto
      "
      >
        {/* TÍTULO */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl md:text-5xl font-black text-alianza-azul mb-10"
        >
          {data.titulo}
        </motion.h1>

        {/* =======================
      PRIMERA SECCIÓN
======================= */}

        <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
          {/* IZQUIERDA */}

          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="bg-blue-50 rounded-3xl shadow-xl p-5"
            >
              <img src={data.recursos.comunidad} className="w-56 mx-auto" />

              <p className="text-center mt-4 font-bold text-xl text-alianza-azul">
                Trabaja para la comunidad
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              className="bg-yellow-50 rounded-3xl shadow-xl p-5"
            >
              <img src={data.recursos.benefician} className="w-56 mx-auto" />

              <p className="text-center mt-4 font-bold text-xl text-alianza-azul">
                Todos se benefician
              </p>
            </motion.div>
          </motion.div>

          {/* DERECHA */}

          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src={data.recursos.caja}
              className="w-80 mx-auto mb-6"
              whileHover={{
                scale: 1.05,
                rotate: 2,
              }}
            />

            <div className="bg-white rounded-3xl shadow-xl p-6 border-l-8 border-alianza-amarillo">
              <p className="text-lg leading-8 text-gray-700 whitespace-pre-line">
                {data.informacion}
              </p>
            </div>
          </motion.div>
        </div>

        {/* PERSONAJE */}

        <motion.div
          animate={{y: [0, -15, 0],}}
          transition={{
            duration: 2.5,
            repeat: Infinity,
          }}
          className="flex justify-center mb-5"
        >
          <img src={data.recursos.nino} className="w-30" />
        </motion.div>

        {/* =======================
      SEGUNDA SECCIÓN
======================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-[40px] p-8 shadow-xl"
        >
          <h2 className="text-2xl md:text-3xl font-black text-alianza-azul mb-10 text-center">
            {data.titulo2}
          </h2>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.img
                src={data.recursos.esquema}
                className="w-full"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              />
            </div>

            <div>
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="bg-white rounded-3xl shadow-xl p-8"
              >
                <h3 className="text-2xl font-black text-alianza-azul mb-5">
                  ¿Por qué es importante?
                </h3>

                <p className="text-lg leading-8 whitespace-pre-line">
                  {data.explicacion}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* BOTÓN */}

        <div className="mt-12">
          <button
            onClick={continuar}
            className="w-full bg-alianza-amarillo hover:scale-105 transition font-black text-2xl text-alianza-azul rounded-full py-5 shadow-xl"
          >
            Continuar
          </button>
        </div>
      </div>
    </LayoutActividad>
  );
};

export default Act02;
