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

  // Dimensiones base del lienzo interno
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 1000;

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

  // Coordenadas basadas en un canvas de 800x1000
  const zonas = {
    // Opción 1: Entrada superior (Flecha hacia abajo sobre el laberinto) -> Meta: $2,800
    opcion1: {
      inicio: { x: 200, y: 50, w: 100, h: 80 },
      meta: { x: 620, y: 100, w: 120, h: 80 },
    },
    // Opción 2: Entrada izquierda ($300 al mes) -> Meta: $1,800 (Abajo)
    opcion2: {
      inicio: { x: 120, y: 640, w: 100, h: 80 },
      meta: { x: 420, y: 920, w: 120, h: 80 },
    },
    // Opción 3: Entrada derecha ($25 semanales) -> Meta: $1,300 (Izquierda)
    opcion3: {
      inicio: { x: 580, y: 440, w: 100, h: 80 },
      meta: { x: 120, y: 500, w: 100, h: 80 },
    },
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
        { onConflict: "usuario_id,actividad_id" }
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
        const mazeCtx = mazeCanvas.getContext("2d");
        mazeCanvas.width = BASE_WIDTH;
        mazeCanvas.height = BASE_HEIGHT;
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
            localStorage.setItem(storageKey, JSON.stringify(db.datos_actividad));
            return;
          }
        }

        const local = localStorage.getItem(storageKey);
        if (local) {
          try { restaurar(JSON.parse(local)); } catch {}
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
        <p className="text-lg font-bold text-slate-600 animate-pulse">Cargando actividad...</p>
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

  const guardar = (estadoComp = completadas, textoRespuesta = quienAhorraMas, fin = terminado) => {
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

    if (!esTouch && mazeCanvasRef.current) {
      const mazeCtx = mazeCanvasRef.current.getContext("2d");
      const pixel = mazeCtx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;

      // Detección de paredes azules en la imagen
      if (b > 110 && r < 100 && g < 100) {
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
    ctx.lineWidth = esTouch ? 12 : 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    if (caminoActual && dentro(x, y, zonas[caminoActual].meta)) {
      const nuevoEstado = { ...completadas, [caminoActual]: true };
      setCompletadas(nuevoEstado);
      setCaminoActual(null);
      setIsDrawing(false);

      const todosCaminos = nuevoEstado.opcion1 && nuevoEstado.opcion2 && nuevoEstado.opcion3;
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
    const todosCaminos = completadas.opcion1 && completadas.opcion2 && completadas.opcion3;
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
    guardarTodo({ imagen: null, completadas: nuevo, quienAhorraMas: "", terminado: false });
  };

  const continuar = async () => {
    guardar(completadas, quienAhorraMas, true);
    if (onComplete) onComplete();
  };

  const preguntaAnalisis = data?.preguntas?.find((p) => p.id === "quienAhorraMas");

  return (
    <LayoutActividad fondo={fondoImg}>
      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="bg-sky-900 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-sky-800 transition"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-sky-900 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="bg-white rounded-[35px] shadow-2xl border-4 border-amber-400 p-6 md:p-8 space-y-8">
          
          {/* ENCABEZADO */}
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

          {/* SECCIÓN TEÓRICA */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-sky-100 p-5 rounded-2xl border-2 border-sky-300 flex items-center gap-4">
                <span className="w-10 h-10 bg-sky-900 text-white font-black rounded-full flex items-center justify-center shrink-0 text-xl">1</span>
                <p className="font-extrabold text-sky-950 text-base md:text-lg">
                  {data?.seccion1?.casoSofía}
                </p>
              </div>
              <div className="bg-sky-100 p-5 rounded-2xl border-2 border-sky-300 flex items-center gap-4">
                <span className="w-10 h-10 bg-sky-900 text-white font-black rounded-full flex items-center justify-center shrink-0 text-xl">2</span>
                <p className="font-extrabold text-sky-950 text-base md:text-lg">
                  {data?.seccion1?.casoCarlos}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-300 space-y-3">
              <label className="block font-black text-sky-950 text-lg">
                {preguntaAnalisis?.pregunta || "Después de varios meses, ¿Quién tendrá mucho más dinero ahorrado en la cooperativa? y ¿Por qué?"}
              </label>
              <textarea
                rows={3}
                value={quienAhorraMas}
                onChange={handleTextoChange}
                placeholder={preguntaAnalisis?.placeholder || "Escribe aquí tu análisis..."}
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
                  <p className="text-amber-600">{data?.seccion1?.mensajeClave?.linea2}</p>
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

          {/* SECCIÓN LABERINTO */}
          <div className="space-y-6">
            <h2 className="text-center text-xl md:text-3xl font-black text-sky-950">
              {data?.seccion2?.tituloActividad}
            </h2>

            {/* CONTENEDOR CON RELACIÓN DE ASPECTO 4:5 PARA COINCIDIR CON 800x1000 */}
            <div className="w-full max-w-[700px] mx-auto">
              <div
                ref={containerRef}
                className="relative w-full aspect-[4/5] bg-sky-50 rounded-2xl overflow-hidden border-2 border-sky-300 shadow-inner select-none touch-none"
              >
                {mensaje && (
                  <div className="absolute z-20 top-3 left-1/2 -translate-x-1/2 bg-sky-900 text-amber-300 font-black text-sm md:text-base px-6 py-2 rounded-full shadow-xl border-2 border-amber-400 text-center">
                    {mensaje}
                  </div>
                )}

                {/* Imagen ajustada con object-contain para evitar cortes */}
                <img
                  src={laberintoImg}
                  alt="Laberinto"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Canvas de trazado */}
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

            {/* ACCIONES */}
            <div className="flex justify-center gap-5 pt-4">
              <button
                onClick={reiniciar}
                className="bg-slate-200 hover:bg-slate-300 px-8 py-3 rounded-full font-bold text-slate-800 transition"
              >
                Reiniciar
              </button>
              <button
                        type="button"
                        onClick={onComplete}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
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