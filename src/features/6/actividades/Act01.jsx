import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
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
      .channel(`act01-${userId}-${data.id}`)
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

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
         🏠 Inicio
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && (
            <span className="text-yellow-500">
              ⏳ Guardando…
            </span>
          )}

          {syncStatus === "saved" && (
            <span className="text-green-500">
              ✅ Guardado
            </span>
          )}

          {syncStatus === "error" && (
            <span className="text-red-500">
              ❌ Error al guardar
            </span>
          )}
        </span>

      </div>

      {/* INFORMACIÓN */}
      <div className="bg-white/95 p-5 rounded-3xl border-4 border-alianza-amarillo mb-6">

        <h2 className="text-xl md:text-3xl font-black text-alianza-azul mb-4 uppercase text-center">
          {data.titulo}
        </h2>

        <p className="text-sm md:text-lg text-gray-700 mb-6 whitespace-pre-line text-center">
          {data.contenido}
        </p>

        <img
          src={data.recursos.imagen1}
          alt=""
          className="w-full max-w-md mx-auto mb-4"
        />

        <img
          src={data.recursos.imagen2}
          alt=""
          className="w-full max-w-md mx-auto"
        />

      </div>

      {/* ACTIVIDAD */}
      <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl">

        <h3 className="text-lg md:text-xl font-black text-center text-alianza-azul mb-4">
          {data.actividad}
        </h3>

        <TipoDibujar
          userId={userId}
          actividadId={data.id}
          onChange={handleDibujoChange}
        />

        <button
          onClick={guardarYTerminar}
          disabled={!isValid}
          className={`w-full mt-6 py-4 rounded-full font-black text-xl transition ${
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

export default Act01;