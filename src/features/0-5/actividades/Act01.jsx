import React, { useEffect, useRef, useState, useCallback } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// ─── Dimensiones virtuales fijas ─────────────────────────────────────────────
const VIRTUAL_W = 1000;
const VIRTUAL_H = 700;
const SAVE_DEBOUNCE = 500;

const pathsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ============================================================================
const Act01 = ({ data, onComplete, rango, onBack }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId  = usuario?.id ?? "anon";

  // ── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef      = useRef(null);
  const containerRef   = useRef(null);
  const saveTimer      = useRef(null);
  const isSaving       = useRef(false);
  const isHydrating    = useRef(false);
  const localPaths     = useRef([]);

  // ── Estado ────────────────────────────────────────────────────────────────
  const [scale,          setScale]          = useState(1);
  const [paths,          setPaths]          = useState([]);
  const [color,          setColor]          = useState("#FFB300");
  const [loading,        setLoading]        = useState(true);
  const [nombre,         setNombre]         = useState("");
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [syncStatus,     setSyncStatus]     = useState("idle");
  const [hasData,        setHasData]        = useState(false);

  const colores = ["#FF0000", "#FFB300", "#00FF00", "#0000FF", "#FF00FF", "#FFFF"];

  const isValid = (paths.length > 0 || hasData) && nombreGuardado;

  // =========================================================================
  //  ESCALA RESPONSIVA (CORREGIDA CON ONLOAD Y RETARDO INICIAL)
  // =========================================================================
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const currentWidth = containerRef.current.offsetWidth;
    if (currentWidth > 0) {
      setScale(currentWidth / VIRTUAL_W);
    }
  }, []);

  useEffect(() => {
    updateScale();

    // Re-calcula tras un breve tiempo para asegurar el renderizado completo del layout
    const timer = setTimeout(updateScale, 100);

    window.addEventListener("resize", updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScale);
    };
  }, [updateScale]);

  // =========================================================================
  //  APLICAR PATHS AL CANVAS
  // =========================================================================
  const applyPathsToCanvas = useCallback(async (newPaths) => {
    if (!canvasRef.current) return;

    isHydrating.current = true;

    await canvasRef.current.clearCanvas();
    await canvasRef.current.resetCanvas();

    setTimeout(async () => {
      if (newPaths.length > 0) {
        await canvasRef.current.loadPaths(newPaths);
      }
      setTimeout(() => { isHydrating.current = false; }, 200);
    }, 100);
  }, []);

  // =========================================================================
  //  CARGA INICIAL desde Supabase
  // =========================================================================
  useEffect(() => {
    if (userId === "anon") { setLoading(false); return; }

    const load = async () => {
      const { data: db, error } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", data.id)
        .maybeSingle();

      if (error) console.error("[Act01] Error cargando:", error);

      const saved       = db?.datos_actividad;
      const savedPaths  = Array.isArray(saved?.dibujo) ? saved.dibujo : [];
      const savedNombre = saved?.nombre ?? "";

      if (savedPaths.length > 0) {
        setHasData(true); 
        localPaths.current = savedPaths;
        setPaths(savedPaths);
        setTimeout(() => applyPathsToCanvas(savedPaths), 300);
      }
      if (savedNombre) { setNombre(savedNombre); setNombreGuardado(true); }

      setLoading(false);
    };

    load();
  }, [userId, data.id, applyPathsToCanvas]);

  // =========================================================================
  //  REALTIME
  // =========================================================================
  useEffect(() => {
    if (userId === "anon") return;

    const channel = supabase
      .channel(`act01-rt-${userId}-${data.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progreso_actividades",
          filter: `usuario_id=eq.${userId}` },
        (payload) => {
          if (isSaving.current) return;
          if (payload.new?.actividad_id !== data.id) return;

          const incoming = payload.new?.datos_actividad;
          if (!incoming) return;

          const incomingPaths  = Array.isArray(incoming.dibujo) ? incoming.dibujo : [];
          const incomingNombre = incoming.nombre ?? "";

          if (!pathsEqual(incomingPaths, localPaths.current)) {
            localPaths.current = incomingPaths;
            setPaths(incomingPaths);
            applyPathsToCanvas(incomingPaths);
          }

          if (incomingNombre) { setNombre(incomingNombre); setNombreGuardado(true); }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, data.id, applyPathsToCanvas]);

  // =========================================================================
  //  GUARDAR en Supabase
  // =========================================================================
  const saveToSupabase = useCallback(async (newPaths, currentNombre, isNombreGuardado) => {
    if (userId === "anon") return;

    isSaving.current = true;
    setSyncStatus("saving");

    const { error } = await supabase
      .from("progreso_actividades")
      .upsert(
        { usuario_id: userId, actividad_id: data.id,
          datos_actividad: { dibujo: newPaths, nombre: currentNombre },
          completada: newPaths.length > 0 && isNombreGuardado },
        { onConflict: "usuario_id,actividad_id" }
      );

    if (error) { console.error("[Act01] Error guardando:", error); setSyncStatus("error"); }
    else { setSyncStatus("saved"); setTimeout(() => setSyncStatus("idle"), 1500); }

    setTimeout(() => { isSaving.current = false; }, 600);
  }, [userId, data.id]);

  // =========================================================================
  //  STROKE
  // =========================================================================
  const handleStroke = useCallback(async () => {
    if (isHydrating.current) return;
    if (!canvasRef.current) return;

    const exported = await canvasRef.current.exportPaths();
    if (!Array.isArray(exported) || exported.length === 0) return;

    setHasData(exported.length > 0);
    localPaths.current = exported;
    setPaths(exported);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToSupabase(exported, nombre, nombreGuardado);
    }, SAVE_DEBOUNCE);
  }, [nombre, nombreGuardado, saveToSupabase]);

  // =========================================================================
  //  BORRAR
  // =========================================================================
  const clearCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    isHydrating.current = true;
    await canvasRef.current.clearCanvas();
    await canvasRef.current.resetCanvas();
    setTimeout(() => { isHydrating.current = false; }, 200);
    setHasData(false);
    localPaths.current = [];
    setPaths([]);
    saveToSupabase([], nombre, nombreGuardado);
  }, [nombre, nombreGuardado, saveToSupabase]);

  // =========================================================================
  //  NOMBRE
  // =========================================================================
  const guardarNombre = useCallback(() => {
    if (!nombre.trim()) return;
    setNombreGuardado(true);
    saveToSupabase(localPaths.current, nombre.trim(), true);
  }, [nombre, saveToSupabase]);

  // =========================================================================
  //  LOADING
  // =========================================================================
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold text-xl animate-pulse">
          Cargando tu progreso…
        </div>
      </LayoutActividad>
    );
  }

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(`/dashboard/${rango}`)} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow">
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/90 p-5 md:p-8 rounded-3xl shadow-lg mb-6 text-center" translate="no">
        <h2 className="text-xl md:text-3xl font-black text-alianza-azul mb-4 uppercase">{data.titulo}</h2>
        <p className="text-sm md:text-lg text-gray-700 mb-6">{data.contenido}</p>
        <img src={data.recursos.procesoAhorro} className="w-full max-w-md mx-auto mb-4" alt="proceso" />
      </div>

      <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">

        <h3 className="text-lg md:text-xl font-black text-center text-alianza-azul mb-4">
          {data.actividad}
        </h3>

        {/* Paleta de colores */}
        <div className="flex justify-center gap-3 mb-4 flex-wrap">
          {colores.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-4 transition-transform"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#000" : "#949393",
                transform:   color === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* CANVAS con sistema de escala corregido */}
        <div
          ref={containerRef}
          className="relative w-full border-4 border-gray-200 rounded-2xl mb-4 bg-white overflow-hidden"
          style={{ height: `${VIRTUAL_H * scale}px` }}
        >
          <div
            style={{
              width:           `${VIRTUAL_W}px`,
              height:          `${VIRTUAL_H}px`,
              transform:       `scale(${scale})`,
              transformOrigin: "top left",
              position:        "absolute",
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
              style={{ position: "absolute", inset: 0, zIndex: 5 }}
            />

            <img
              src={data.recursos?.cochinitoColorear}
              onLoad={updateScale}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ zIndex: 10 }}
              alt="cochinito para colorear"
            />
          </div>
        </div>

        {/* Botones limpiar / deshacer */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={clearCanvas}
            className="flex-1 bg-red-100 text-red-600 py-2 rounded-full font-bold"
          >
            🗑 Limpiar
          </button>
          <button
            onClick={() => canvasRef.current?.undo()}
            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-full font-bold"
          >
            ↩ Deshacer
          </button>
        </div>

        {/* Nombre */}
        <div className="mb-4">
          {nombreGuardado ? (
            <div
              onClick={() => setNombreGuardado(false)}
              className="p-3 border-2 border-blue-500 bg-blue-50 rounded-xl text-center cursor-pointer"
            >
              <p className="font-bold text-blue-700">¡Hola, {nombre}! 👋</p>
              <span className="text-xs text-gray-400">(toca para editar)</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && guardarNombre()}
                placeholder="Tu nombre"
                className="flex-1 p-3 border rounded-xl text-center text-lg"
              />
              <button onClick={guardarNombre} className="bg-alianza-azul text-white px-4 rounded-xl font-bold">
                OK
              </button>
            </div>
          )}
        </div>

        {/* Continuar */}
        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isValid ? "¡Listo!" : "Completa para avanzar"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act01;