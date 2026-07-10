import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const imgRef = useRef(null);
  const saveTimer = useRef(null);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  const actividadId = data.id;

  const [encontradas, setEncontradas] = useState([]);
  const [completado, setCompletado] = useState(false);
  const [mostrarFinal, setMostrarFinal] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  const isValid = (arr) => Array.isArray(arr);

  // =========================
  // LOAD SUPABASE (igual que Act09, sin localStorage)
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

        if (isValid(d.encontradas)) setEncontradas(d.encontradas);

        if (d.completado) {
          setCompletado(true);
          setMostrarFinal(true);
        }
      }

      setLoading(false);
    };

    cargar();
  }, [actividadId, userId]);

  // =========================
  // SAVE SUPABASE (DEBOUNCE) - igual que Act09
  // =========================
  const saveToSupabase = useCallback(
    async (nuevas, done) => {
      if (userId === "anon") return;

      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: {
            encontradas: nuevas,
            completado: done,
          },
          completada: done,
        },
        {
          onConflict: "usuario_id,actividad_id",
        },
      );
    },
    [actividadId, userId],
  );

  const scheduleSave = useCallback(
    (nuevas, done) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(nuevas, done);
      }, 400);
    },
    [saveToSupabase],
  );

  // =========================
  // ESCALA
  // =========================
  // IMPORTANTE: las coordenadas de "diferencias" se capturaron sobre una
  // imagen de referencia de 300px de ancho, exactamente igual que en
  // Act09. Por eso "original" debe ser 300, no 1024 — si no, el scale
  // calculado queda mal y los círculos/clics no coinciden con la imagen.
  // Igual que en Act09: ambas imágenes (A y B) comparten el mismo ref,
  // así que basta con medir una de las dos (siempre queda apuntando a
  // la última imagen montada en el map, algo consistente en cualquier
  // tamaño de pantalla).
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
  // CLICK EN LA IMAGEN
  // =========================
  const handleClick = (e) => {
    if (completado) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    let encontrada = -1;

    data.actividad.diferencias.forEach((d, i) => {
      if (encontradas.includes(i)) return;

      const dx = x - d.x;
      const dy = y - d.y;

      if (Math.sqrt(dx * dx + dy * dy) < d.radio) {
        encontrada = i;
      }
    });

    if (encontrada !== -1) {
      const nuevas = [...encontradas, encontrada];

      const terminado = nuevas.length === data.actividad.totalDiferencias;

      setEncontradas(nuevas);
      setCompletado(terminado);

      // Antes llamaba a "guardar(...)", una función que no existía en
      // ningún lado del archivo y hacía que esto truene en silencio.
      scheduleSave(nuevas, terminado);

      if (terminado) {
        // Al completar dentro de la misma sesión, se muestra la pantalla
        // de despedida de inmediato (antes solo aparecía si recargabas
        // la página después de haber terminado).
        setMostrarFinal(true);
      }

      setMensaje(
        terminado ? "¡Encontraste todas las diferencias!" : "¡Muy bien!",
      );

      setTimeout(() => setMensaje(null), 1200);
    } else {
      setMensaje("Sigue buscando...");
      setTimeout(() => setMensaje(null), 900);
    }
  };

  // =========================
  // REINICIAR
  // =========================
  const reiniciar = async () => {
    setEncontradas([]);
    setCompletado(false);
    setMostrarFinal(false);
    setMensaje(null);

    if (userId !== "anon") {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: {
            encontradas: [],
            completado: false,
          },
          completada: false,
        },
        {
          onConflict: "usuario_id,actividad_id",
        },
      );
    }
  };

  if (loading) {
    return (
      <LayoutActividad fondo={data.fondo}>
        <div className="p-12 text-center text-2xl font-black animate-pulse">
          Cargando...
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.fondo}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow"
        >
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/95 rounded-[3rem] border-[8px] border-yellow-400 shadow-2xl p-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center text-alianza-azul mb-3">
          {data.actividad.titulo}
        </h2>

        <p className="text-center text-lg font-bold mb-6">
          Encuentra las cinco diferencias.
        </p>

        {mensaje && (
          <div className="mb-5">
            <div className="bg-blue-500 text-white font-black rounded-xl py-3 text-center">
              {mensaje}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-10">
          {[data.actividad.imagenA, data.actividad.imagenB].map(
            (img, index) => (
              <div key={index} className="relative">
                <img
                  ref={imgRef}
                  src={img}
                  onClick={handleClick}
                  className="w-[300px] md:w-[450px] rounded-2xl shadow-xl cursor-pointer select-none"
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
                        border: "4px solid red",
                        borderRadius: "50%",
                        pointerEvents: "none",
                      }}
                    />
                  );
                })}
              </div>
            ),
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={reiniciar}
            className="bg-gray-300 px-8 py-3 rounded-full font-black hover:bg-gray-400"
          >
            Reiniciar
          </button>
        </div>

        {/* DESPEDIDA: aparece debajo del juego dentro de la misma tarjeta,
            en vez de reemplazar la pantalla completa. */}
        {mostrarFinal && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-10 pt-10 border-t-4 border-yellow-200"
          >
            <h2 className="text-4xl font-black text-alianza-azul mb-8">
              🎉 {data.despedida.titulo || "¡Felicidades!"}
            </h2>

            <div className="space-y-3 mb-8">
              {data.despedida.mensaje.map((linea, i) => (
                <p key={i} className="text-xl font-bold text-gray-700">
                  {linea}
                </p>
              ))}
            </div>

            <img
              src={data.despedida.imagen1}
              className="mx-auto w-72 mb-10"
            />

            <button
              onClick={onComplete}
              className="bg-yellow-400 hover:scale-105 transition px-10 py-4 rounded-full font-black text-xl"
            >
              Finalizar Pasaporte
            </button>
          </motion.div>
        )}
      </div>
    </LayoutActividad>
  );
};

export default Act11;