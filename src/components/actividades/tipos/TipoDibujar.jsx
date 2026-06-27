import React, { useEffect, useRef, useState, useCallback } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { supabase } from "../../../supabaseClient";

const VIRTUAL_W = 1000;
const VIRTUAL_H = 700;
const SAVE_DEBOUNCE = 400;

const pathsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const TipoDibujar = ({
  userId,
  actividadId,
  onChange,
  gestionarPropio = true,
  valorInicial = [],
  canalId = "",
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const channelRef = useRef(null); // 🔥 FIX REALTIME
  const isHydrating = useRef(false);
  const isSaving = useRef(false);
  const localPaths = useRef([]);
  const yaHidrato = useRef(false);

  const [scale, setScale] = useState(1);
  const [color, setColor] = useState("#2D3748");

  const colores = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F333FF",
    "#FFD700",
    "#ffffff",
    "#2D3748",
  ];

  // =========================
  // RESIZE
  // =========================
  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / VIRTUAL_W);
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // =========================
  // APLICAR PATHS
  // =========================
  const applyPaths = useCallback(async (newPaths) => {
    if (!canvasRef.current) return;

    isHydrating.current = true;

    await canvasRef.current.clearCanvas();
    await canvasRef.current.resetCanvas();

    setTimeout(async () => {
      if (newPaths.length > 0) {
        await canvasRef.current.loadPaths(newPaths);
      }

      setTimeout(() => {
        isHydrating.current = false;
      }, 200);
    }, 100);
  }, []);

  // =========================
  // NOTIFICAR PADRE
  // =========================
  const notify = useCallback(
    (paths) => {
      onChange?.({
        tieneDibujo: paths.length > 0,
        dataDibujo: paths,
      });
    },
    [onChange]
  );

  // =========================
  // GUARDAR SUPABASE
  // =========================
  const saveToSupabase = useCallback(
    async (paths) => {
      if (!gestionarPropio) return;
      if (userId === "anon" || !actividadId) return;

      isSaving.current = true;

      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: { dibujo: paths },
          completada: paths.length > 0,
        },
        {
          onConflict: "usuario_id,actividad_id",
        }
      );

      setTimeout(() => {
        isSaving.current = false;
      }, 500);
    },
    [userId, actividadId, gestionarPropio]
  );

  // =========================
  // CARGA INICIAL
  // =========================
  useEffect(() => {
    if (yaHidrato.current) return;

    // 🔹 MODO CONTROLADO POR PADRE (Act09)
    if (!gestionarPropio) {
      const saved = Array.isArray(valorInicial) ? valorInicial : [];

      localPaths.current = saved;

      if (saved.length > 0) {
        yaHidrato.current = true;
        setTimeout(() => applyPaths(saved), 200);
      }

      return;
    }

    // 🔹 MODO PROPIO (Act02, Act10)
    if (userId === "anon" || !actividadId) return;

    const load = async () => {
      const { data } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", actividadId)
        .maybeSingle();

      const saved = Array.isArray(data?.datos_actividad?.dibujo)
        ? data.datos_actividad.dibujo
        : [];

      localPaths.current = saved;
      notify(saved);

      yaHidrato.current = true;

      setTimeout(() => applyPaths(saved), 200);
    };

    load();
  }, [userId, actividadId, gestionarPropio, valorInicial, applyPaths, notify]);

  // =========================
  // REALTIME FIXADO (SIN DUPLICADOS)
  // =========================
  useEffect(() => {
    if (!gestionarPropio) return;
    if (userId === "anon" || !actividadId) return;

    const channelName =
      `tipod-${actividadId}-${userId}${canalId ? `-${canalId}` : ""}`;

    // 🔥 LIMPIEZA FORZADA
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "progreso_actividades",
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          if (isSaving.current) return;
          if (String(payload.new?.actividad_id) !== String(actividadId)) return;

          const incoming = Array.isArray(
            payload.new?.datos_actividad?.dibujo
          )
            ? payload.new.datos_actividad.dibujo
            : [];

          if (pathsEqual(incoming, localPaths.current)) return;

          localPaths.current = incoming;
          notify(incoming);
          applyPaths(incoming);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    userId,
    actividadId,
    gestionarPropio,
    canalId,
    applyPaths,
    notify,
  ]);

  // =========================
  // STROKE
  // =========================
  const handleStroke = useCallback(async () => {
    if (isHydrating.current || !canvasRef.current) return;

    const exported = await canvasRef.current.exportPaths();

    if (!Array.isArray(exported)) return;

    localPaths.current = exported;
    notify(exported);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      saveToSupabase(exported);
    }, SAVE_DEBOUNCE);
  }, [notify, saveToSupabase]);

  // =========================
  // CLEAR
  // =========================
  const clear = useCallback(async () => {
    if (!canvasRef.current) return;

    isHydrating.current = true;

    await canvasRef.current.clearCanvas();
    await canvasRef.current.resetCanvas();

    setTimeout(() => {
      isHydrating.current = false;
    }, 200);

    localPaths.current = [];
    notify([]);
    saveToSupabase([]);
  }, [notify, saveToSupabase]);

  // =========================
  // UI
  // =========================
  return (
    <div
      ref={containerRef}
      className="w-full border-4 rounded-2xl overflow-hidden bg-white relative"
      style={{ height: `${VIRTUAL_H * scale}px` }}
    >
      {/* COLORES */}
      <div className="absolute top-2 left-2 z-10 flex gap-2 flex-wrap">
        {colores.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2"
            style={{
              backgroundColor: c,
              borderColor: color === c ? "#000" : "#afacac",
              transform: color === c ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* BORRAR */}
      <button
        onClick={clear}
        className="absolute top-2 right-2 z-10 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold"
      >
        🗑 Borrar
      </button>

      {/* CANVAS */}
      <div
        style={{
          width: `${VIRTUAL_W}px`,
          height: `${VIRTUAL_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          width={`${VIRTUAL_W}px`}
          height={`${VIRTUAL_H}px`}
          strokeWidth={5}
          strokeColor={color}
          canvasColor="transparent"
          onStroke={handleStroke}
        />
      </div>
    </div>
  );
};

export default TipoDibujar;