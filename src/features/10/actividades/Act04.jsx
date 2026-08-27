import React, { useRef, useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const fondoImg = data?.fondo || "/images/10/Fondo.png";
  const personajeImg = data?.seccion1?.personajeImg || "/images/10/13.png";
  const laberintoImg = data?.seccion2?.laberintoImg || "/images/10/35.png";

  const canvasRef = useRef(null);
  const mazeCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const snapshotRef = useRef(null);
  const puntoInicioRef = useRef(null);
  const [colorDebug, setColorDebug] = useState(null);

  // ⚠️ IMPORTANTE: estas dimensiones ahora coinciden EXACTAMENTE con el
  // tamaño natural del archivo /images/10/35.png (587x607). Así lo que
  // se ve en pantalla y lo que se analiza para detectar la pared son
  // siempre el mismo pixel — sin estiramientos que desalineen todo.
  const BASE_WIDTH = 587;
  const BASE_HEIGHT = 607;

  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [caminoActual, setCaminoActual] = useState(null);

  const [quienAhorraMas, setQuienAhorraMas] = useState("");
  const [completadas, setCompletadas] = useState({
    opcion1: false,
    opcion2: false,
    opcion3: false,
  });

  const [terminado, setTerminado] = useState(false);
  const [syncStatus, setSyncStatus] = useState("saved");

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };
  const userId = getUser()?.id || "anon";
  const storageKey = `act04-${rango}-${userId}-${data?.id || "default"}`;

  // Coordenadas recalculadas con un único factor de escala uniforme
  // (587/300 = 1.9567) a partir de tus 6 puntos capturados. Ya no hay
  // distorsión entre eje X y eje Y.
  const zonas = {
    opcion1: {
      inicio: { x: 141, y: 18, w: 70, h: 70 },
      meta: { x: 405, y: 35, w: 70, h: 70 },
    },
    opcion2: {
      inicio: { x: 96, y: 341, w: 70, h: 70 },
      meta: { x: 296, y: 525, w: 70, h: 70 },
    },
    opcion3: {
      inicio: { x: 401, y: 245, w: 70, h: 70 },
      meta: { x: 71, y: 276, w: 70, h: 70 },
    },
  };

  // ⚠️ MODO DEPURACIÓN: actívalo, dibuja sobre una pared real, y verás
  // en pantalla el color exacto bajo el cursor para calibrar si hace falta.
  const DEBUG_COLOR = true;

  const AZUL_PARED = { r: 59, g: 58, b: 167 };
  const TOLERANCIA = 90;

  // Ya no debería necesitarse una zona de gracia tan grande, porque la
  // detección ahora es precisa. Se deja un margen pequeño de todos modos.
  const DISTANCIA_GRACIA = 20;

  const esPared = (r, g, b) => {
    const distancia = Math.sqrt(
      (r - AZUL_PARED.r) ** 2 +
        (g - AZUL_PARED.g) ** 2 +
        (b - AZUL_PARED.b) ** 2,
    );
    return distancia < TOLERANCIA;
  };

  // Promedia un pequeño bloque de pixeles en vez de leer solo uno, para
  // que el antialiasing de los bordes de la pared no dé falsos positivos
  // ni falsos negativos.
  const colorPromedio = (ctx, x, y) => {
    const tam = 3;
    const datos = ctx.getImageData(
      Math.max(0, Math.round(x) - 1),
      Math.max(0, Math.round(y) - 1),
      tam,
      tam,
    ).data;
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < datos.length; i += 4) {
      r += datos[i];
      g += datos[i + 1];
      b += datos[i + 2];
      n++;
    }
    return { r: r / n, g: g / n, b: b / n };
  };

  const guardarTodo = async (state) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (userId === "anon" || !data?.id) return;

    setSyncStatus("saving");
    try {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: state,
          completada: state.terminado,
        },
        { onConflict: "usuario_id,actividad_id" },
      );
      setSyncStatus("saved");
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
    }
  };

  const restaurar = (state) => {
    if (!state) return;

    if (state.imagen && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const savedImg = new Image();
      savedImg.src = state.imagen;
      savedImg.onload = () => {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx.drawImage(savedImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      };
    }
    if (state.completadas) setCompletadas(state.completadas);
    if (state.quienAhorraMas) setQuienAhorraMas(state.quienAhorraMas);
    if (state.terminado) setTerminado(state.terminado);
  };

  useEffect(() => {
    const cargar = async () => {
      const img = new Image();
      img.src = laberintoImg;
      img.onload = async () => {
        const mazeCanvas = mazeCanvasRef.current;
        if (!mazeCanvas) return;
        const mazeCtx = mazeCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        mazeCanvas.width = BASE_WIDTH;
        mazeCanvas.height = BASE_HEIGHT;
        // Se dibuja al tamaño NATURAL de la imagen, sin estirar.
        mazeCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);

        if (userId !== "anon" && data?.id) {
          setSyncStatus("saving");
          const { data: db } = await supabase
            .from("progreso_actividades")
            .select("datos_actividad")
            .eq("usuario_id", userId)
            .eq("actividad_id", data.id)
            .maybeSingle();

          setSyncStatus("saved");
          if (db?.datos_actividad) {
            restaurar(db.datos_actividad);
            localStorage.setItem(
              storageKey,
              JSON.stringify(db.datos_actividad),
            );
            return;
          }
        }

        const local = localStorage.getItem(storageKey);
        if (local) {
          try {
            restaurar(JSON.parse(local));
          } catch {}
        }
      };
    };
    cargar();
  }, [data?.id, userId, rango, laberintoImg]);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      setScale(containerRef.current.clientWidth / BASE_WIDTH);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-bold text-slate-600 animate-pulse">
          Cargando actividad...
        </p>
      </div>
    );
  }

  const getCtx = () => canvasRef.current?.getContext("2d");

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const dentro = (x, y, z) =>
    x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;

  const guardar = (
    estadoComp = completadas,
    textoRespuesta = quienAhorraMas,
    fin = terminado,
  ) => {
    if (!canvasRef.current) return;
    const imagen = canvasRef.current.toDataURL();
    guardarTodo({
      imagen,
      completadas: estadoComp,
      quienAhorraMas: textoRespuesta,
      terminado: fin,
    });
  };

  const startDrawing = (e) => {
    if (terminado) return;
    const { x, y } = getCoords(e);
    let idCamino = null;

    Object.entries(zonas).forEach(([nombre, zona]) => {
      if (dentro(x, y, zona.inicio)) {
        idCamino = nombre;
      }
    });

    if (!idCamino) {
      setMensaje("Haz clic sobre la punta de una flecha negra de entrada.");
      setTimeout(() => setMensaje(""), 2500);
      return;
    }

    if (completadas[idCamino]) {
      setMensaje("¡Ya completaste este camino!");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    setCaminoActual(idCamino);
    puntoInicioRef.current = { x, y };
    const ctx = getCtx();
    if (!ctx) return;
    snapshotRef.current = ctx.getImageData(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = getCtx();
    if (!ctx) return;
    const esTouch = e.type.includes("touch");

    // ⚠️ La detección de "chocar con la pared" solo aplica en dispositivos
    // sin pantalla táctil (mouse). En celulares/tablets queda deshabilitada
    // a propósito, porque dibujar con el dedo es mucho menos preciso.
    if (!esTouch && mazeCanvasRef.current) {
      const mazeCtx = mazeCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
      const { r, g, b } = colorPromedio(mazeCtx, x, y);

      if (DEBUG_COLOR) {
        setColorDebug({
          x: Math.round(x),
          y: Math.round(y),
          r: Math.round(r),
          g: Math.round(g),
          b: Math.round(b),
        });
      }

      const inicio = puntoInicioRef.current;
      const distanciaDesdeInicio = inicio
        ? Math.hypot(x - inicio.x, y - inicio.y)
        : DISTANCIA_GRACIA + 1;

      if (distanciaDesdeInicio > DISTANCIA_GRACIA && esPared(r, g, b)) {
        if (snapshotRef.current) {
          ctx.putImageData(snapshotRef.current, 0, 0);
        } else {
          ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        }
        setIsDrawing(false);
        setCaminoActual(null);
        guardar();
        setMensaje("¡Tocaste la pared!");
        setTimeout(() => setMensaje(""), 1800);
        return;
      }
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = esTouch ? 8 : 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    if (caminoActual && dentro(x, y, zonas[caminoActual].meta)) {
      const nuevoEstado = { ...completadas, [caminoActual]: true };
      setCompletadas(nuevoEstado);
      setCaminoActual(null);
      setIsDrawing(false);

      const todosCaminos =
        nuevoEstado.opcion1 && nuevoEstado.opcion2 && nuevoEstado.opcion3;
      const finalizado = todosCaminos && quienAhorraMas.trim().length > 0;

      if (todosCaminos) {
        setMensaje("🎉 ¡Laberinto resuelto!");
      } else {
        setMensaje("¡Camino correcto!");
      }

      setTerminado(finalizado);
      guardar(nuevoEstado, quienAhorraMas, finalizado);
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setCaminoActual(null);
  };

  const handleTextoChange = (e) => {
    const val = e.target.value;
    setQuienAhorraMas(val);
    const todosCaminos =
      completadas.opcion1 && completadas.opcion2 && completadas.opcion3;
    const finalizado = todosCaminos && val.trim().length > 0;
    setTerminado(finalizado);
    guardar(completadas, val, finalizado);
  };

  const reiniciar = () => {
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    const nuevo = { opcion1: false, opcion2: false, opcion3: false };
    setCompletadas(nuevo);
    setQuienAhorraMas("");
    setTerminado(false);
    snapshotRef.current = null;
    localStorage.removeItem(storageKey);
    guardarTodo({
      imagen: null,
      completadas: nuevo,
      quienAhorraMas: "",
      terminado: false,
    });
  };

  const preguntaAnalisis = data?.preguntas?.find(
    (p) => p.id === "quienAhorraMas",
  );

  return (
    <LayoutActividad fondo={fondoImg}>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="bg-sky-900 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-sky-800 transition"
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
          className="bg-sky-900 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="bg-white rounded-[35px] shadow-2xl border-4 border-amber-400 p-6 md:p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-black text-sky-950">
              {data?.titulo}
            </h1>
            {data?.subtitulo && (
              <p className="text-lg md:text-xl font-bold text-amber-600">
                {data.subtitulo}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-sky-100 p-5 rounded-2xl border-2 border-sky-300 flex items-center gap-4">
                <span className="w-10 h-10 bg-sky-900 text-white font-black rounded-full flex items-center justify-center shrink-0 text-xl">
                  1
                </span>
                <p className="font-extrabold text-sky-950 text-base md:text-lg">
                  {data?.seccion1?.casoSofía}
                </p>
              </div>
              <div className="bg-sky-100 p-5 rounded-2xl border-2 border-sky-300 flex items-center gap-4">
                <span className="w-10 h-10 bg-sky-900 text-white font-black rounded-full flex items-center justify-center shrink-0 text-xl">
                  2
                </span>
                <p className="font-extrabold text-sky-950 text-base md:text-lg">
                  {data?.seccion1?.casoCarlos}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-300 space-y-3">
              <label className="block font-black text-sky-950 text-lg">
                {preguntaAnalisis?.pregunta ||
                  "Después de varios meses, ¿Quién tendrá mucho más dinero ahorrado en la cooperativa? y ¿Por qué?"}
              </label>
              <textarea
                rows={3}
                value={quienAhorraMas}
                onChange={handleTextoChange}
                placeholder={
                  preguntaAnalisis?.placeholder || "Escribe aquí tu análisis..."
                }
                className="w-full p-4 rounded-xl border-2 border-amber-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-sky-50 p-6 rounded-2xl border-2 border-sky-200">
              <div className="md:col-span-7 space-y-4">
                <div className="bg-sky-950 text-amber-300 font-black text-lg md:text-xl py-2 px-6 rounded-r-full inline-block shadow-md">
                  Mensaje clave
                </div>
                <div className="space-y-2 text-sky-950 font-black text-lg md:text-2xl">
                  <p>{data?.seccion1?.mensajeClave?.linea1}</p>
                  <p className="text-amber-600">
                    {data?.seccion1?.mensajeClave?.linea2}
                  </p>
                  {data?.seccion1?.mensajeClave?.fraseLibreta && (
                    <span className="inline-block bg-amber-200 text-amber-900 text-sm font-bold px-3 py-1 rounded-md mt-2">
                      💡 {data.seccion1.mensajeClave.fraseLibreta}
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-5 flex justify-center">
                <img
                  src={personajeImg}
                  alt="Alianzito"
                  className="max-h-60 object-contain drop-shadow-md"
                />
              </div>
            </div>
          </div>

          <hr className="border-t-2 border-amber-200 my-6" />

          <div className="space-y-6">
            <h2 className="text-center text-xl md:text-3xl font-black text-sky-950">
              {data?.seccion2?.tituloActividad}
            </h2>
            <p className="text-center text-xs md:text-sm text-gray-500 font-semibold mb-3">
              💡 En pantallas táctiles el juego es más flexible. Para más
              dificultad —donde tocar la pared sí te hace perder— juega desde
              una computadora con mouse.
            </p>

            <div className="w-full max-w-[587px] mx-auto">
              <div
                ref={containerRef}
                className="relative w-full bg-sky-50 rounded-2xl overflow-hidden border-2 border-sky-300 shadow-inner select-none touch-none"
                style={{ aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}` }}
              >
                {mensaje && (
                  <div className="absolute z-20 top-3 left-1/2 -translate-x-1/2 bg-sky-900 text-amber-300 font-black text-sm md:text-base px-6 py-2 rounded-full shadow-xl border-2 border-amber-400 text-center">
                    {mensaje}
                  </div>
                )}
                {DEBUG_COLOR && colorDebug && (
                  <div className="absolute z-20 bottom-3 left-3 bg-black/80 text-white text-xs font-mono px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded border border-white/50 inline-block"
                        style={{
                          backgroundColor: `rgb(${colorDebug.r},${colorDebug.g},${colorDebug.b})`,
                        }}
                      />
                      r:{colorDebug.r} g:{colorDebug.g} b:{colorDebug.b}
                    </div>
                    <div className="text-white/60">
                      x:{colorDebug.x} y:{colorDebug.y}
                    </div>
                  </div>
                )}

                {/* Ahora la imagen ocupa exactamente el mismo espacio que
                    el canvas de análisis, sin letterboxing ni distorsión. */}
                <img
                  src={laberintoImg}
                  alt="Laberinto"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                <canvas
                  ref={canvasRef}
                  width={BASE_WIDTH}
                  height={BASE_HEIGHT}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <canvas ref={mazeCanvasRef} style={{ display: "none" }} />
              </div>
            </div>

            <div className="flex justify-center gap-5 pt-4">
              <button
                onClick={reiniciar}
                className="bg-slate-200 hover:bg-slate-300 px-8 py-3 rounded-full font-bold text-slate-800 transition"
              >
                Reiniciar
              </button>
              <button
                type="button"
                disabled={!terminado}
                onClick={onComplete}
                className={`w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all uppercase tracking-wider ${
                  terminado
                    ? "bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutActividad>
  );
};

export default Act04;
