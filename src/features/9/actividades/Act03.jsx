import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();
  //=========================
  // CANVAS
  //=========================
  const canvasRef = useRef(null);
  const mazeCanvasRef = useRef(null);
  const containerRef = useRef(null);
  // Guarda una "foto" (ImageData) del canvas justo antes de empezar cada
  // trazo nuevo. Si se toca la pared, se restaura esta foto en vez de
  // borrar todo el canvas, así el progreso de frutas ya completadas NO
  // se pierde cuando fallas en una fruta distinta.
  const snapshotRef = useRef(null);

  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 1000;

  const [scale, setScale] = useState(1);
  //=========================
  // PANTALLAS
  //=========================
  // mostrarInfo solo controla un OVERLAY visual. El contenido de la
  // actividad (y sus canvas) están SIEMPRE montados, igual que en Act06,
  // para que la carga/restauración de Supabase pueda dibujar sin importar
  // si el usuario todavía está viendo las instrucciones o no.
  const [mostrarInfo, setMostrarInfo] = useState(true);
  //=========================
  // DIBUJO
  //=========================
  const [isDrawing, setIsDrawing] = useState(false);
  const [mensaje, setMensaje] = useState("");
  //=========================
  // FRUTAS COMPLETADAS
  //=========================
  const [completadas, setCompletadas] = useState({
    sandia: false,
    naranja: false,
    pina: false,
  });
  //=========================
  // FRUTA ACTUAL
  //=========================
  const [frutaActual, setFrutaActual] = useState(null);
  //=========================
  // TERMINADO
  //=========================
  const [terminado, setTerminado] = useState(false);
  const [syncStatus, setSyncStatus] = useState("saved");

  //=========================
  // USER
  //=========================
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };
  const userId = getUser()?.id || "anon";

  // ==============================
  // KEY MULTIUSUARIO + MULTIACTIVIDAD (igual que Act06)
  // ==============================
  const storageKey = `act03-${rango}-${userId}-${data.id}`;
  //=========================
  // GUARDAR
  //=========================
  const guardarTodo = async (state) => {
    localStorage.setItem(storageKey, JSON.stringify(state));

    if (userId === "anon") return;

    setSyncStatus("saving");

    try {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: state,
          completada: state.terminado,
        },
        {
          onConflict: "usuario_id,actividad_id",
        },
      );

      setSyncStatus("saved");
    } catch (err) {
      console.error(err);

      setSyncStatus("error");
    }
  };
  //=========================================
  // COORDENADAS
  //=========================================
  const zonas = {
    sandia: {
      inicio: { x: 50, y: 55, w: 90, h: 90 },
      meta: { x: 505, y: 95, w: 120, h: 90 },
    },
    naranja: {
      inicio: { x: -25, y: 480, w: 90, h: 90 },
      meta: { x: 505, y: 420, w: 120, h: 90 },
    },
    pina: {
      inicio: { x: -25, y: 580, w: 90, h: 90 },
      meta: { x: 430, y: 900, w: 120, h: 90 },
    },
  };

  //=========================================
  // RESTAURAR (idéntico en espíritu a "aplicarEstado" de Act06)
  //=========================================
  const restaurar = (state) => {
    if (!state) return;

    if (state.imagen) {
      const ctx = canvasRef.current.getContext("2d");
      const savedImg = new Image();
      savedImg.src = state.imagen;
      savedImg.onload = () => {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx.drawImage(savedImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      };
    }
    if (state.completadas) {
      setCompletadas(state.completadas);
    }
    if (state.terminado) {
      setTerminado(true);
    }
  };

  //=========================================
  // CARGAR LABERINTO (Supabase primero → local como fallback)
  //=========================================
  // IMPORTANTE: canvasRef y mazeCanvasRef ya existen desde el primer
  // render (ya no dependen de "mostrarInfo"), así que este efecto puede
  // dibujar directamente, sin trucos ni estados intermedios.
  useEffect(() => {
    const cargar = async () => {
      const img = new Image();
      img.src = data.recursos.laberintoImg;
      img.onload = async () => {
        const mazeCanvas = mazeCanvasRef.current;
        const mazeCtx = mazeCanvas.getContext("2d");
        mazeCanvas.width = BASE_WIDTH;
        mazeCanvas.height = BASE_HEIGHT;
        mazeCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);

        //====================
        // 1. SUPABASE (fuente de verdad, multidispositivo)
        //====================
        if (userId !== "anon") {
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

        //====================
        // 2. LOCAL (fallback para anónimos o sin conexión)
        //====================
        const local = localStorage.getItem(storageKey);
        if (local) {
          try {
            restaurar(JSON.parse(local));
          } catch {
            /* corrupto */
          }
        }
      };
    };
    cargar();
  }, [data.id, userId, rango]);

  //=========================================
  // SCALE RESPONSIVE
  //=========================================
  // containerRef también está siempre montado ahora, así que este efecto
  // vuelve a ser el mismo de Act06: se calcula una vez al montar y se
  // recalcula solo con el evento resize de la ventana.
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      setScale(containerRef.current.clientWidth / BASE_WIDTH);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  //=========================================
  // CONTEXTO
  //=========================================
  const getCtx = () => canvasRef.current.getContext("2d");
  //=========================================
  // COORDENADAS
  //=========================================
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) / scale,
        y: (e.touches[0].clientY - rect.top) / scale,
      };
    }
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };
  //=========================================
  // DENTRO DE UNA ZONA
  //=========================================
  const dentro = (x, y, z) =>
    x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
  //=========================================
  // GUARDAR ESTADO
  //=========================================
  const guardar = (estado = completadas, fin = terminado) => {
    const imagen = canvasRef.current.toDataURL();
    guardarTodo({
      imagen,
      completadas: estado,
      terminado: fin,
    });
  };
  //=========================================
  // INICIAR DIBUJO
  //=========================================
  const startDrawing = (e) => {
    if (mostrarInfo) return; // bloqueado mientras se ve el overlay informativo
    if (terminado) return;
    const { x, y } = getCoords(e);
    let fruta = null;
    Object.entries(zonas).forEach(([nombre, zona]) => {
      if (dentro(x, y, zona.inicio)) {
        fruta = nombre;
      }
    });
    if (!fruta) {
      setMensaje("Debes comenzar desde una fruta.");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
    if (completadas[fruta]) {
      setMensaje("Esa fruta ya llegó a su canasta.");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
    setFrutaActual(fruta);
    const ctx = getCtx();
    // Foto del canvas ANTES de dibujar este trazo, para poder revertir
    // solo este intento si se toca la pared, sin perder lo ya completado.
    snapshotRef.current = ctx.getImageData(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  //=========================================
  // DIBUJAR
  //=========================================
  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = getCtx();

    // Igual que Act06: se detecta el tipo de evento en cada movimiento
    // (más confiable que revisar una sola vez si el dispositivo "es móvil",
    // porque también cubre laptops con pantalla táctil usadas con mouse).
    const esTouch = e.type.includes("touch");

    //==========================
    // RESTRICCIÓN DE PARED: SOLO CON MOUSE (COMPUTADORA)
    //==========================
    if (!esTouch) {
      const mazeCtx = mazeCanvasRef.current.getContext("2d");
      const pixel = mazeCtx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;
      if (r > 200 && g < 80 && b < 80) {
        // Se revierte SOLO el trazo actual (restaurando la foto de antes
        // de empezarlo), no todo el canvas — así las frutas que ya
        // llegaron a su canasta siguen dibujadas.
        if (snapshotRef.current) {
          ctx.putImageData(snapshotRef.current, 0, 0);
        } else {
          ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        }
        setIsDrawing(false);
        setFrutaActual(null);
        guardar(completadas, terminado);
        setMensaje("¡Tocaste la pared!");
        setTimeout(() => setMensaje(""), 2000);
        return;
      }
    }
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = esTouch ? 10 : 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    //==========================
    // ¿LLEGÓ A SU META?
    //==========================
    if (frutaActual && dentro(x, y, zonas[frutaActual].meta)) {
      const nuevoEstado = {
        ...completadas,
        [frutaActual]: true,
      };
      setCompletadas(nuevoEstado);
      setFrutaActual(null);
      setIsDrawing(false);
      const finalizado =
        nuevoEstado.sandia && nuevoEstado.naranja && nuevoEstado.pina;
      if (finalizado) {
        setTerminado(true);
        setMensaje("🎉 ¡Excelente trabajo!");
      } else {
        setMensaje("¡Muy bien!");
      }
      guardar(nuevoEstado, finalizado);
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
    guardar();
  };

  //=========================================
  // DETENER DIBUJO
  //=========================================
  const stopDrawing = () => {
    setIsDrawing(false);
    setFrutaActual(null);
  };
  //=========================================
  // REINICIAR
  //=========================================
  const reiniciar = () => {
    const ctx = getCtx();
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    const nuevo = {
      sandia: false,
      naranja: false,
      pina: false,
    };
    setCompletadas(nuevo);
    setTerminado(false);
    snapshotRef.current = null;
    localStorage.removeItem(storageKey);
    guardarTodo({
      imagen: null,
      completadas: nuevo,
      terminado: false,
    });
  };
  //=========================================
  // CONTINUAR
  //=========================================
  const continuar = async () => {
    guardar(completadas, true);
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos.fondoImg}>
      {/* HEADER */}
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
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>
      </div>

      {/* ===================================================== */}
      {/*  CONTENEDOR RELATIVO: la actividad SIEMPRE está montada  */}
      {/*  debajo; la info es un overlay que se puede ocultar sin  */}
      {/*  desmontar los canvas.                                   */}
      {/* ===================================================== */}
      <div className="relative max-w-6xl mx-auto">
        {/* ===================================================== */}
        {/*                    LABERINTO (SIEMPRE MONTADO)        */}
        {/* ===================================================== */}
        <div className="bg-white rounded-[35px] shadow-2xl border-4 border-yellow-400 p-6">
          <h2 className="text-center text-3xl font-black text-alianza-azul mb-2">
            Ayuda a Alianzito a poner la fruta en su lugar correcto.
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Une cada fruta con su canasta correspondiente.
          </p>

          {/* INDICADORES */}
          <div className="flex justify-center gap-6 mb-5">
            <div
              className={`px-4 py-2 rounded-full font-bold ${completadas.sandia ? "bg-green-500 text-white" : "bg-gray-200"}`}
            >
              🍉 Sandía
            </div>
            <div
              className={`px-4 py-2 rounded-full font-bold ${completadas.naranja ? "bg-green-500 text-white" : "bg-gray-200"}`}
            >
              🍊 Naranja
            </div>
            <div
              className={`px-4 py-2 rounded-full font-bold ${completadas.pina ? "bg-green-500 text-white" : "bg-gray-200"}`}
            >
              🍍 Piña
            </div>
          </div>

          <div ref={containerRef} className="w-full">
            <div
              className="relative"
              style={{
                height: BASE_HEIGHT * scale,
              }}
            >
              {mensaje && (
                <div className="absolute z-20 top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-2 rounded-full">
                  {mensaje}
                </div>
              )}

              {/* LABERINTO */}
              <img
                src={data.recursos.laberintoImg}
                className="absolute w-full h-full"
              />

              {/* FRUTAS */}
              <img
                src={data.recursos.sandiaInicio}
                className="absolute"
                style={{
                  left: zonas.sandia.inicio.x * scale,
                  top: zonas.sandia.inicio.y * scale,
                  width: zonas.sandia.inicio.w * scale,
                }}
              />
              <img
                src={data.recursos.sandiaFin}
                className="absolute"
                style={{
                  left: zonas.sandia.meta.x * scale,
                  top: zonas.sandia.meta.y * scale,
                  width: zonas.sandia.meta.w * scale,
                }}
              />
              <img
                src={data.recursos.naranjaInicio}
                className="absolute"
                style={{
                  left: zonas.naranja.inicio.x * scale,
                  top: zonas.naranja.inicio.y * scale,
                  width: zonas.naranja.inicio.w * scale,
                }}
              />
              <img
                src={data.recursos.naranjaFin}
                className="absolute"
                style={{
                  left: zonas.naranja.meta.x * scale,
                  top: zonas.naranja.meta.y * scale,
                  width: zonas.naranja.meta.w * scale,
                }}
              />
              <img
                src={data.recursos.pinaInicio}
                className="absolute"
                style={{
                  left: zonas.pina.inicio.x * scale,
                  top: zonas.pina.inicio.y * scale,
                  width: zonas.pina.inicio.w * scale,
                }}
              />
              <img
                src={data.recursos.pinaFin}
                className="absolute"
                style={{
                  left: zonas.pina.meta.x * scale,
                  top: zonas.pina.meta.y * scale,
                  width: zonas.pina.meta.w * scale,
                }}
              />

              {/* DIBUJO */}
              <canvas
                ref={canvasRef}
                width={BASE_WIDTH}
                height={BASE_HEIGHT}
                className="absolute w-full h-full"
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
          <div className="flex justify-center gap-5 mt-8">
            <button
              onClick={reiniciar}
              className="bg-gray-300 px-8 py-3 rounded-full font-bold"
            >
              Reiniciar
            </button>
            <button
              disabled={!terminado}
              onClick={continuar}
              className={`px-8 py-3 rounded-full font-black ${
                terminado ? "bg-yellow-400 hover:scale-105" : "bg-gray-300"
              } transition`}
            >
              Continuar
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/*      PANTALLA INFORMATIVA (OVERLAY, no desmonta nada)  */}
        {/* ===================================================== */}
        <AnimatePresence>
          {mostrarInfo && (
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 overflow-y-auto bg-white rounded-[35px] shadow-2xl border-4 border-yellow-400 p-8"
            >
              <motion.h1
                initial={{ y: -25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center text-4xl font-black text-alianza-azul mb-8"
              >
                {data.titulo}
              </motion.h1>

              <div className="grid lg:grid-cols-2 gap-10">
                {/* LADO IZQUIERDO */}
                <div>
                  <h2 className="font-black text-2xl text-blue-800 mb-5">
                    Cuando depositas tus ahorros en la Caja:
                  </h2>
                  <div className="space-y-4">
                    {data.pasos.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex items-start gap-4"
                      >
                        <div className="bg-yellow-400 w-10 h-10 rounded-full flex items-center justify-center font-black">
                          {i + 1}
                        </div>
                        <p className="text-lg">{p}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-sky-600 text-white rounded-3xl p-6 mt-8 shadow-xl"
                  >
                    <h3 className="font-black text-2xl mb-3">
                      ¿Qué son los rendimientos?
                    </h3>
                    <p className="leading-8">{data.rendimientos}</p>
                  </motion.div>
                </div>

                {/* LADO DERECHO */}
                <div className="flex flex-col items-center">
                  <motion.img
                    src={data.recursos.personaje}
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="w-72"
                  />
                  <div className="bg-blue-50 rounded-3xl shadow-lg p-6 mt-6">
                    <p className="text-lg leading-8 whitespace-pre-line">
                      {data.cooperacion}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMostrarInfo(false)}
                className="mt-10 w-full bg-yellow-400 py-4 rounded-full text-2xl font-black text-blue-900 hover:scale-105 transition"
              >
                Comenzar actividad
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutActividad>
  );
};
export default Act03;