import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  // ─────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────
  const [dibujoData, setDibujoData] = useState([]);
  const [tieneDibujo, setTieneDibujo] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  const isValidDibujo = (d) =>
    Array.isArray(d) && d.length > 0;

  const isValid = tieneDibujo || hasData;

  // ─────────────────────────────────────────
  // CARGA INICIAL
  // ─────────────────────────────────────────
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
        const dibujo = db.datos_actividad.dibujo;

        if (isValidDibujo(dibujo)) {
          setDibujoData(dibujo);
          setTieneDibujo(true);
          setHasData(true);
        }
      }

      setLoading(false);
    };

    cargar();
  }, [userId, data.id]);

  // ─────────────────────────────────────────
  // REALTIME
  // ─────────────────────────────────────────
  useEffect(() => {
    if (userId === "anon") return;

    const channel = supabase
      .channel(`act02-${userId}-${data.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "progreso_actividades",
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          const dibujo =
            payload.new?.datos_actividad?.dibujo || [];

          setDibujoData(dibujo);
          setTieneDibujo(dibujo.length > 0);
          setHasData(dibujo.length > 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, data.id]);

  // ─────────────────────────────────────────
  // GUARDAR
  // ─────────────────────────────────────────
  const saveToSupabase = useCallback(
    async (dibujo) => {
      if (userId === "anon") return;

      setSyncStatus("saving");

      const { error } = await supabase
        .from("progreso_actividades")
        .upsert(
          {
            usuario_id: userId,
            actividad_id: data.id,
            datos_actividad: {
              dibujo: isValidDibujo(dibujo)
                ? dibujo
                : [],
            },
            completada: isValidDibujo(dibujo),
          },
          {
            onConflict:
              "usuario_id,actividad_id",
          }
        );

      if (error) {
        setSyncStatus("error");
      } else {
        setSyncStatus("saved");

        setTimeout(() => {
          setSyncStatus("idle");
        }, 1500);
      }
    },
    [userId, data.id]
  );

  const scheduleSave = useCallback(
    (dibujo) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        saveToSupabase(dibujo);
      }, 600);
    },
    [saveToSupabase]
  );

  // ─────────────────────────────────────────
  // CAMBIO DIBUJO
  // ─────────────────────────────────────────
  const handleDibujoChange = useCallback(
    ({ tieneDibujo: td, dataDibujo }) => {
      const normalizado = isValidDibujo(dataDibujo)
        ? dataDibujo
        : [];

      setTieneDibujo(td);
      setDibujoData(normalizado);

      if (td) {
        setHasData(true);
      }

      scheduleSave(normalizado);
    },
    [scheduleSave]
  );

  // ─────────────────────────────────────────
  // FINALIZAR
  // ─────────────────────────────────────────
  const guardarYTerminar = () => {
    if (!isValid) return;

    saveToSupabase(dibujoData);
    onComplete();
  };

  // ─────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold text-xl animate-pulse">
          Cargando tu progreso…
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && (
            <span className="text-yellow-500">⏳ Guardando…</span>
          )}

          {syncStatus === "saved" && (
            <span className="text-green-500">✅ Guardado</span>
          )}

          {syncStatus === "error" && (
            <span className="text-red-500">❌ Error al guardar</span>
          )}
        </span>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow"
        >
          🏠 Inicio
        </button>

      </div>      
      
      <div className="bg-white/85 backdrop-blur-sm p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* TÍTULO */}
        <h2 className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-6">
          {data.titulo}
        </h2>

        {/* SECCIÓN SUPERIOR */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">

          {/* IMAGEN IZQUIERDA */}
          <img 
            src={data.recursos.imagenIzquierda}
            className="w-40 md:w-52 object-contain"
          />

          {/* TEXTO */}
          <div className="text-center md:text-left">
            {data.contenido.map((linea, i) => (
              <p key={i} className="text-lg md:text-xl font-bold text-gray-800">
                {linea}
              </p>
            ))}
          </div>

        </div>

        {/* TIPS + IMAGEN */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">

          {/* CUADROS */}
          <div className="flex-1">

            {/* AZUL FUERTE */}
            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black text-lg">
                {data.tips.titulo}
              </h3>
            </div>

            {/* AZUL CLARO */}
            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold text-sm md:text-base space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>

          </div>

          {/* IMAGEN DERECHA */}
          <img 
            src={data.recursos.imagenDerecha}
            className="w-32 md:w-40 object-contain "
          />

        </div>
      </div>

      {/* Todo tu contenido visual permanece igual */}

      <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl">

        <p className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-4">
          {data.instruccionDibujo}
        </p>

        <TipoDibujar
          userId={userId}
          actividadId={data.id}
          onChange={handleDibujoChange}
        />

        <button
          onClick={guardarYTerminar}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isValid
            ? "¡Terminé!"
            : "Dibuja algo para continuar"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act02;