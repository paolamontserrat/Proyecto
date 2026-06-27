import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  // =========================
  // STATE
  // =========================
  const [respuestas, setRespuestas] = useState(["", "", "", ""]);
  const [dibujoData, setDibujoData] = useState([]);
  const [tieneDibujo, setTieneDibujo] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  const isValidDibujo = (d) => Array.isArray(d) && d.length > 0;

  const isValid =
    respuestas.every((r) => r.trim().length > 0) &&
    (tieneDibujo || hasData);

  // =========================
  // CARGA SUPABASE
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
        .eq("actividad_id", data.id)
        .maybeSingle();

      if (db?.datos_actividad) {
        const info = db.datos_actividad;

        if (Array.isArray(info.respuestas)) {
          setRespuestas(info.respuestas);
        }

        if (isValidDibujo(info.dibujo)) {
          setDibujoData(info.dibujo);
          setTieneDibujo(true);
          setHasData(true);
        }
      }

      setLoading(false);
    };

    cargar();
  }, [userId, data.id]);

  // =========================
  // GUARDAR SUPABASE
  // =========================
  const saveToSupabase = useCallback(
    async (newRespuestas, newDibujo) => {
      if (userId === "anon") return;

      setSyncStatus("saving");

      const dibujoFinal = isValidDibujo(newDibujo) ? newDibujo : [];

      const completada =
        newRespuestas.every((r) => r.trim().length > 0) &&
        dibujoFinal.length > 0;

      const { error } = await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {
            respuestas: newRespuestas,
            dibujo: dibujoFinal,
          },
          completada,
        },
        { onConflict: "usuario_id,actividad_id" }
      );

      if (error) {
        setSyncStatus("error");
      } else {
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 1200);
      }
    },
    [userId, data.id]
  );

  // =========================
  // DEBOUNCE SAVE
  // =========================
  const scheduleSave = useCallback(
    (r, d) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(r, d);
      }, 600);
    },
    [saveToSupabase]
  );

  // =========================
  // RESPUESTAS
  // =========================
  const manejarCambioPregunta = (index, value) => {
    const nuevas = [...respuestas];
    nuevas[index] = value;

    setRespuestas(nuevas);
    scheduleSave(nuevas, dibujoData);
  };

  // =========================
  // DIBUJO (ARREGLADO como Act02)
  // =========================
  const handleDibujoChange = useCallback(
    ({ tieneDibujo: td, dataDibujo }) => {
      const limpio = isValidDibujo(dataDibujo) ? dataDibujo : [];

      setTieneDibujo(td);
      setDibujoData(limpio);

      if (td) setHasData(true);

      scheduleSave(respuestas, limpio);
    },
    [respuestas, scheduleSave]
  );

  // =========================
  // FINALIZAR
  // =========================
  const guardarYContinuar = () => {
    if (!isValid) return;
    saveToSupabase(respuestas, dibujoData);
    onComplete();
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold animate-pulse">
          Cargando...
        </div>
      </LayoutActividad>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold"
        >
          ← Regresar
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && <span className="text-yellow-500">⏳ Guardando…</span>}
          {syncStatus === "saved" && <span className="text-green-500">✅ Guardado</span>}
          {syncStatus === "error" && <span className="text-red-500">❌ Error</span>}
        </span>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* TIPs */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black text-lg">
                {data.tips.titulo}
              </h3>
            </div>
            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </div>
        </div>

        {/* DIBUJO (IMPORTANTE: igual que Act02) */}
        <TipoDibujar
          userId={userId}
          actividadId={data.id}
          onChange={handleDibujoChange}
        />

        {/* PREGUNTAS */}
        <div className="mt-6 space-y-4">
          {data.preguntas.map((p, i) => (
            <div key={i}>
              <p className="font-black text-alianza-azul">{p}</p>
              <input
                value={respuestas[i]}
                onChange={(e) =>
                  manejarCambioPregunta(i, e.target.value)
                }
                className="w-full p-3 border rounded-xl text-center font-bold"
              />
            </div>
          ))}
        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarYContinuar}
          disabled={!isValid}
          className={`w-full mt-6 py-4 rounded-full font-black text-xl ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isValid ? "¡Continuar!" : "Completa todo para avanzar"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act04;