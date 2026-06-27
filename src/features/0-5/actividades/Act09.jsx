import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const imgRef = useRef(null);
  const saveTimer = useRef(null);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  const actividadId = data.id;

  // =========================
  // STATE (ACT02 STYLE)
  // =========================
  const [encontradas, setEncontradas] = useState([]);
  const [completado, setCompletado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [hasData, setHasData] = useState(false);

  const isValid = (arr) => Array.isArray(arr);

  // =========================
  // LOAD SUPABASE (SIN LOCALSTORAGE)
  // =========================
  useEffect(() => {
    if (userId === "anon") {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      const { data: db } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", actividadId)
        .maybeSingle();

      if (db?.datos_actividad) {
        const d = db.datos_actividad;

        if (isValid(d.encontradas)) {
          setEncontradas(d.encontradas);
          setHasData(true);
        }

        if (typeof d.completado === "boolean") {
          setCompletado(d.completado);
        }
      }

      setLoading(false);
    };

    cargar();
  }, [userId, actividadId]);

  // =========================
  // SAVE SUPABASE (DEBOUNCE)
  // =========================
  const saveToSupabase = useCallback(async (nuevas, done) => {
    if (userId === "anon") return;

    const payload = {
      encontradas: nuevas,
      completado: done
    };

    await supabase.from("progreso_actividades").upsert(
      {
        usuario_id: userId,
        actividad_id: actividadId,
        datos_actividad: payload,
        completada: done
      },
      { onConflict: "usuario_id,actividad_id" }
    );
  }, [userId, actividadId]);

  const scheduleSave = useCallback((nuevas, done) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveToSupabase(nuevas, done);
    }, 400);
  }, [saveToSupabase]);

  // =========================
  // ESCALA
  // =========================
  useEffect(() => {
    const updateScale = () => {
      if (!imgRef.current) return;
      const displayedWidth = imgRef.current.clientWidth;
      const originalWidth = 300;
      setScale(displayedWidth / originalWidth);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // =========================
  // CLICK
  // =========================
  const handleClick = (e) => {
    if (completado) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    let foundIndex = -1;

    data.actividad.diferencias.forEach((d, i) => {
      if (encontradas.includes(i)) return;

      const dx = x - d.x;
      const dy = y - d.y;

      if (Math.sqrt(dx * dx + dy * dy) < d.radio) {
        foundIndex = i;
      }
    });

    if (foundIndex !== -1) {
      const nuevas = [...encontradas];

      if (!nuevas.includes(foundIndex)) {
        nuevas.push(foundIndex);

        const done = nuevas.length === data.actividad.totalDiferencias;

        setEncontradas(nuevas);
        setCompletado(done);

        setMensaje(done ? "¡Completaste la actividad!" : "¡Bien hecho!");

        scheduleSave(nuevas, done);

        setTimeout(() => setMensaje(null), 1200);
      }
    } else {
      setMensaje("Sigue intentando");
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
      await supabase.from("progreso_actividades").upsert({
        usuario_id: userId,
        actividad_id: actividadId,
        datos_actividad: { encontradas: [], completado: false },
        completada: false
      }, {
        onConflict: "usuario_id,actividad_id"
      });
    }
  };

  // =========================
  // LOADING
  // =========================
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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-200 mb-10 flex flex-col md:flex-row items-center gap-6"
        >
          <img src={data.tip.imagen} className="w-40 h-40 object-contain" />

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
              <div key={idx} className="relative">
                <img
                  ref={imgRef}
                  src={img}
                  onClick={handleClick}
                  className="w-[300px] md:w-[450px] rounded-xl shadow-xl cursor-pointer"
                />

                {encontradas.map((i) => {
                  const d = data.actividad.diferencias[i];

                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: d.x * scale - d.radio * scale,
                        top: d.y * scale - d.radio * scale,
                        width: d.radio * 2 * scale,
                        height: d.radio * 2 * scale,
                        borderRadius: "50%",
                        border: "3px solid red",
                        pointerEvents: "none"
                      }}
                    />
                  );
                })}
              </div>
            ))}

          </div>

          {completado && (
            <div className="mt-4 bg-green-500 text-white p-3 rounded-xl font-bold">
              ¡Encontraste todas las diferencias!
            </div>
          )}

          <button
            onClick={reiniciar}
            className="mt-4 bg-gray-300 px-6 py-3 rounded-full font-bold"
          >
            Reiniciar
          </button>
        </div>

        <button
          onClick={onComplete}
          disabled={!completado}
          className={`mt-8 w-full py-4 rounded-full font-black text-xl transition
            ${completado
              ? "bg-yellow-400 hover:scale-105"
              : "bg-gray-300 cursor-not-allowed opacity-60"
            }`}
        >
          Finalizar
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act09;