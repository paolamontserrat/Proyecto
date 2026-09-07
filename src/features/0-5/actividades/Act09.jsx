import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";
  const actividadId = data.id;

  // =========================
  // ESTADOS
  // =========================
  const [encontradas, setEncontradas] = useState([]);
  const [completado, setCompletado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  const isValid = (arr) => Array.isArray(arr);

  // =========================
  // CARGAR PROGRESO DE SUPABASE
  // =========================
  useEffect(() => {
    if (userId === "anon") {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      try {
        const { data: db } = await supabase
          .from("progreso_actividades")
          .select("datos_actividad, completada")
          .eq("usuario_id", userId)
          .eq("actividad_id", actividadId)
          .maybeSingle();

        if (db?.datos_actividad) {
          const d = db.datos_actividad;

          if (isValid(d.encontradas)) {
            setEncontradas(d.encontradas);
            if (d.encontradas.length === data.actividad.diferencias.length) {
              setCompletado(true);
            }
          }
        }
      } catch (err) {
        console.warn("Error cargando de Supabase...", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [userId, actividadId, data.actividad.diferencias.length]);

  // =========================
  // GUARDAR PROGRESO PASO A PASO (SIN MARCAR COMPLETADA)
  // =========================
  const guardarProgresoParcial = async (nuevas) => {
    if (userId === "anon") return;

    try {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: { encontradas: nuevas, completado: false },
          completada: false,
        },
        { onConflict: "usuario_id,actividad_id" }
      );
    } catch (err) {
      console.warn("Error guardando progreso parcial...", err);
    }
  };

  // =========================
  // DETECCIÓN DE CLIC EN PORCENTAJES (ESTILO ACT11)
  // =========================
  const handleImageClick = (e) => {
    if (completado) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let foundIndex = -1;

    data.actividad.diferencias.forEach((dif, i) => {
      if (encontradas.includes(i)) return;

      const dx = clickX - dif.x;
      const dy = clickY - dif.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);

      if (distancia <= (dif.radio || 7)) {
        foundIndex = i;
      }
    });

    if (foundIndex !== -1) {
      const nuevas = [...encontradas, foundIndex];
      const done = nuevas.length === data.actividad.diferencias.length;

      setEncontradas(nuevas);
      setCompletado(done);

      // Guarda paso a paso
      guardarProgresoParcial(nuevas);

      setTimeout(() => setMensaje(null), 1200);
    } else {
      setTimeout(() => setMensaje(null), 1000);
    }
  };

  // =========================
  // REINICIAR
  // =========================
  const reiniciar = async () => {
    setEncontradas([]);
    setCompletado(false);

    if (userId !== "anon") {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: { encontradas: [], completado: false },
          completada: false,
        },
        { onConflict: "usuario_id,actividad_id" }
      );
    }
  };

  // =========================
  // BOTÓN CONTINUAR (MARCA COMPLETADA = TRUE EN SUPABASE)
  // =========================
  const handleContinue = async () => {
    if (!completado) return;

    if (userId !== "anon") {
      try {
        await supabase.from("progreso_actividades").upsert(
          {
            usuario_id: userId,
            actividad_id: actividadId,
            datos_actividad: { encontradas, completado: true },
            completada: true,
          },
          { onConflict: "usuario_id,actividad_id" }
        );
      } catch (err) {
        console.warn("Error guardando en Supabase...", err);
      }
    }

    if (onComplete) onComplete();
  };

  if (loading) {
    return (
      <LayoutActividad fondo={data.fondo}>
        <div className="p-10 text-center font-bold animate-pulse">
          Cargando...
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.fondo}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold">
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/95 p-8 rounded-[3rem] border-[8px] border-yellow-400 max-w-5xl mx-auto shadow-2xl">
        {/* TIP */}
        {data.tip && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-200 mb-10 flex flex-col md:flex-row items-center gap-6"
          >
            <img src={data.tip.imagen} className="w-40 h-40 object-contain" alt="Tip" />
            <div>
              <h2 className="text-3xl font-black text-blue-700 mb-3">
                {data.tip.titulo}
              </h2>
              {data.tip.descripcion.map((t, i) => (
                <p key={i} className="text-xl font-bold text-gray-700">
                  {t}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* JUEGO */}
        <div className="bg-yellow-50 p-6 rounded-3xl border-4 border-yellow-300 text-center">
          <h2 className="text-3xl font-black text-yellow-700 mb-6">
            {data.actividad.titulo}
          </h2>

          {mensaje && (
            <div className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold">
              {mensaje}
            </div>
          )}

          <div className="flex gap-6 justify-center flex-wrap">
            {[data.actividad.imagenA, data.actividad.imagenB].map((img, idx) => (
              <div
                key={idx}
                onClick={handleImageClick}
                className="relative rounded-xl overflow-hidden cursor-pointer select-none"
              >
                <img
                  src={img}
                  alt="Diferencias"
                  className="w-[300px] md:w-[450px] rounded-xl shadow-xl pointer-events-none"
                />

                {/* DIBUJO DE CÍRCULOS USANDO PORCENTAJES (ESTILO ACT11) */}
                {encontradas.map((i) => {
                  const dif = data.actividad.diferencias[i];
                  const radio = dif.radio || 7;

                  return (
                    <div
                      key={i}
                      style={{
                        left: `${dif.x}%`,
                        top: `${dif.y}%`,
                        width: `${radio * 2}%`,
                        height: `${radio * 2}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 rounded-full bg-red-500/30 pointer-events-none"
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <button
            onClick={reiniciar}
            className="mt-4 bg-gray-300 px-6 py-3 rounded-full font-bold hover:bg-gray-400 transition"
          >
            Reiniciar
          </button>
        </div>

        {/* BOTÓN CONTINUAR */}
        <button
          onClick={handleContinue}
          disabled={!completado}
          className={`mt-8 w-full py-4 rounded-full font-black text-xl transition ${
            completado
              ? "bg-yellow-400 hover:scale-105 shadow-lg cursor-pointer"
              : "bg-gray-300 cursor-not-allowed opacity-60"
          }`}
        >
          Finalizar 🎉
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act09;