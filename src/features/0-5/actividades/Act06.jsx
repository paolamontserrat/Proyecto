import React, { useRef, useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act06 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const mazeCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [terminado, setTerminado] = useState(false);
  const [scale, setScale] = useState(1);

  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;

  const zonaInicio = {
    x: 10,
    y: 10,
    w: 120,
    h: 120
  };

  const zonaMeta = {
    x: 670,
    y: 470,
    w: 120,
    h: 120
  };

  // ==============================
  // USUARIO SEGURO
  // ==============================
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch {
      return null;
    }
  };

  const userId = getUser()?.id || 'anon';

  // ==============================
  // KEY MULTIUSUARIO REAL
  // ==============================
  const key = `laberinto-${rango}-${userId}-${data.id}`;

  // ==============================
  // GUARDADO GLOBAL
  // ==============================
  const guardarTodo = async (state) => {
    localStorage.setItem(key, JSON.stringify(state));

    if (userId !== 'anon') {
      try {
        await supabase
          .from('progreso_actividades')
          .upsert(
            {
              usuario_id: userId,
              actividad_id: data.id,
              datos_actividad: state,
              completada: state.terminado
            },
            {
              onConflict: 'usuario_id,actividad_id'
            }
          );
      } catch {
        console.warn('Offline → se sincronizará después');
      }
    }
  };

  const guardar = (estadoTerminado = terminado) => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL();

    const state = {
      imagen: dataURL,
      terminado: estadoTerminado
    };

    guardarTodo(state);
  };

  // ==============================
  // CARGA
  // SUPABASE PRIMERO → LOCAL COMO FALLBACK
  // ==============================
  useEffect(() => {
    const cargar = async () => {
      const img = new Image();

      img.src = data.recursos.laberintoImg;

      img.onload = async () => {
        const mazeCanvas = mazeCanvasRef.current;

        if (!mazeCanvas || !canvasRef.current) return;

        const mazeCtx = mazeCanvas.getContext('2d');

        mazeCanvas.width = BASE_WIDTH;
        mazeCanvas.height = BASE_HEIGHT;

        mazeCtx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

        mazeCtx.drawImage(
          img,
          0,
          0,
          BASE_WIDTH,
          BASE_HEIGHT
        );

        const aplicarEstado = ({
          imagen,
          terminado: t
        }) => {
          if (imagen) {
            const ctx = canvasRef.current.getContext('2d');

            const savedImg = new Image();

            savedImg.src = imagen;

            savedImg.onload = () => {
              ctx.clearRect(
                0,
                0,
                BASE_WIDTH,
                BASE_HEIGHT
              );

              ctx.drawImage(
                savedImg,
                0,
                0,
                BASE_WIDTH,
                BASE_HEIGHT
              );
            };
          }

          if (t) {
            setTerminado(true);
          }
        };

        // ==============================
        // SUPABASE
        // ==============================
        if (userId !== 'anon') {
          const { data: db, error } = await supabase
            .from('progreso_actividades')
            .select('datos_actividad')
            .eq('usuario_id', userId)
            .eq('actividad_id', data.id)
            .maybeSingle();

          if (!error && db?.datos_actividad) {
            aplicarEstado(db.datos_actividad);

            localStorage.setItem(
              key,
              JSON.stringify(db.datos_actividad)
            );

            return;
          }
        }

        // ==============================
        // LOCALSTORAGE
        // ==============================
        const local = localStorage.getItem(key);

        if (local) {
          try {
            aplicarEstado(JSON.parse(local));
          } catch {
            console.warn('Estado local corrupto');
          }
        }
      };
    };

    cargar();
  }, [data.id, userId, rango]);

  // ==============================
  // SCALE
  // ==============================
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;

      if (!width) return;

      setScale(width / BASE_WIDTH);
    };

    updateScale();

    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // ==============================
  // CONTEXTO DEL CANVAS
  // ==============================
  const getCtx = () => {
    if (!canvasRef.current) return null;

    return canvasRef.current.getContext('2d');
  };

  // ==============================
  // COORDENADAS
  // ==============================
  // Se calculan usando el tamaño REAL
  // que tiene el canvas en pantalla.
  //
  // Esto evita errores cuando:
  //
  // 800x600 internos
  // ↓
  // se muestran como
  // 360x270, 768x576, etc.
  // ==============================
  const getCoords = (e) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0
      };
    }

    const rect = canvas.getBoundingClientRect();

    const x =
      (e.clientX - rect.left) *
      (BASE_WIDTH / rect.width);

    const y =
      (e.clientY - rect.top) *
      (BASE_HEIGHT / rect.height);

    return {
      x: Math.max(0, Math.min(BASE_WIDTH, x)),
      y: Math.max(0, Math.min(BASE_HEIGHT, y))
    };
  };

  // ==============================
  // ZONA
  // ==============================
  const estaEnZona = (x, y, zona) =>
    x >= zona.x &&
    x <= zona.x + zona.w &&
    y >= zona.y &&
    y <= zona.y + zona.h;

  // ==============================
  // INICIAR DIBUJO
  // ==============================
  const startDrawing = (e) => {
    if (terminado) return;

    // Si es mouse, únicamente botón izquierdo.
    if (
      e.pointerType === 'mouse' &&
      e.button !== 0
    ) {
      return;
    }

    // Evita que el navegador interrumpa
    // el gesto táctil.
    e.preventDefault();

    // Mantiene el pointer capturado aunque
    // el dedo se salga ligeramente del canvas.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Algunos navegadores pueden no soportarlo.
    }

    const { x, y } = getCoords(e);

    // ==============================
    // VALIDAR INICIO
    // ==============================
    if (!estaEnZona(x, y, zonaInicio)) {
      setMensaje('Comienza desde el inicio.');

      setTimeout(() => {
        setMensaje(null);
      }, 2000);

      return;
    }

    const ctx = getCtx();

    if (!ctx) return;

    ctx.beginPath();

    ctx.moveTo(x, y);

    setIsDrawing(true);
  };

  // ==============================
  // DIBUJAR
  // ==============================
  const draw = (e) => {
    if (!isDrawing || terminado) return;

    e.preventDefault();

    const { x, y } = getCoords(e);

    const ctx = getCtx();

    if (!ctx) return;

    // ==============================
    // TOUCH VS MOUSE
    // ==============================
    //
    // TOUCH:
    // Puede tocar paredes.
    //
    // MOUSE:
    // Tocar pared hace perder.
    //
    const esTouch = e.pointerType === 'touch';

    // ==============================
    // DETECCIÓN DE PARED
    // SOLO MOUSE
    // ==============================
    if (!esTouch) {
      const mazeCanvas = mazeCanvasRef.current;

      if (mazeCanvas) {
        const mazeCtx = mazeCanvas.getContext('2d');

        const pixel = mazeCtx.getImageData(
          Math.floor(x),
          Math.floor(y),
          1,
          1
        ).data;

        const [r, g, b] = pixel;

        if (
          r > 200 &&
          g < 80 &&
          b < 80
        ) {
          ctx.clearRect(
            0,
            0,
            BASE_WIDTH,
            BASE_HEIGHT
          );

          localStorage.removeItem(key);

          setIsDrawing(false);

          setMensaje('Tocaste la pared.');

          setTimeout(() => {
            setMensaje(null);
          }, 2000);

          return;
        }
      }
    }

    // ==============================
    // META
    // ==============================
    if (estaEnZona(x, y, zonaMeta)) {
      setIsDrawing(false);

      setTerminado(true);

      guardar(true);

      setMensaje('Laberinto completado.');

      return;
    }

    // ==============================
    // TRAZO
    // ==============================
    ctx.lineTo(x, y);

    ctx.strokeStyle = '#2563eb';

    // Dedo = trazo más grueso.
    // Mouse = trazo más fino.
    ctx.lineWidth = esTouch ? 10 : 5;

    // Hace que el trazo sea más suave.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.stroke();

    // ==============================
    // GUARDAR PROGRESO
    // ==============================
    guardar();
  };

  // ==============================
  // FINALIZAR DIBUJO
  // ==============================
  const stopDrawing = (e) => {
    try {
      if (
        e?.currentTarget &&
        e.pointerId !== undefined
      ) {
        if (
          e.currentTarget.hasPointerCapture?.(
            e.pointerId
          )
        ) {
          e.currentTarget.releasePointerCapture(
            e.pointerId
          );
        }
      }
    } catch {
      // Ignorar si el navegador no soporta
      // pointer capture completamente.
    }

    setIsDrawing(false);
  };

  // ==============================
  // RESET
  // ==============================
  const reiniciar = () => {
    const ctx = getCtx();

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      BASE_WIDTH,
      BASE_HEIGHT
    );

    const state = {
      imagen: null,
      terminado: false
    };

    localStorage.removeItem(key);

    setTerminado(false);

    setMensaje(null);

    guardarTodo(state);
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <LayoutActividad fondo={data.recursos.fondoImg}>

      {/* ==============================
          HEADER
      ============================== */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() =>
            navigate(`/dashboard/${rango}`)
          }
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      {/* ==============================
          CONTENEDOR
      ============================== */}
      <div className="bg-white p-4 rounded-2xl border-4 border-yellow-400 max-w-4xl mx-auto">

        <h2 className="text-xl font-bold text-center mb-2">
          {data.titulo}
        </h2>

        {/* ==============================
            AVISO
        ============================== */}
        <p className="text-center text-xs md:text-sm text-gray-500 font-semibold mb-3">
          💡 En pantallas táctiles el juego es más flexible.
          Para más dificultad —donde tocar la pared sí te hace perder—
          juega desde una computadora con mouse.
        </p>

        {/* ==============================
            CANVAS CONTAINER
        ============================== */}
        <div
          ref={containerRef}
          className="w-full"
        >

          <div
            className="relative"
            style={{
              height: BASE_HEIGHT * scale,
              touchAction: 'none'
            }}
          >

            {/* ==============================
                MENSAJE
            ============================== */}
            {mensaje && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded z-10">
                {mensaje}
              </div>
            )}

            {/* ==============================
                LABERINTO BASE
            ============================== */}
            <img
              src={data.recursos.laberintoImg}
              className="absolute w-full h-full select-none pointer-events-none"
              draggable="false"
              alt="Laberinto"
            />

            {/* ==============================
                INICIO
            ============================== */}
            <img
              src={data.recursos.inicioImg}
              className="absolute select-none pointer-events-none"
              draggable="false"
              alt="Inicio"
              style={{
                left: zonaInicio.x * scale,
                top: zonaInicio.y * scale,
                width: zonaInicio.w * scale
              }}
            />

            {/* ==============================
                META
            ============================== */}
            <img
              src={data.recursos.finImg}
              className="absolute select-none pointer-events-none"
              draggable="false"
              alt="Meta"
              style={{
                left: zonaMeta.x * scale,
                top: zonaMeta.y * scale,
                width: zonaMeta.w * scale
              }}
            />

            {/* ==============================
                CANVAS DE DIBUJO
            ============================== */}
            <canvas
              ref={canvasRef}
              width={BASE_WIDTH}
              height={BASE_HEIGHT}
              className="absolute w-full h-full"
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={(e) => {
                // No detenemos inmediatamente el dibujo
                // en touch porque el pointer capture
                // mantiene el evento.
                if (e.pointerType === 'mouse') {
                  stopDrawing(e);
                }
              }}
              draggable="false"
            />

            {/* ==============================
                CANVAS INVISIBLE DEL LABERINTO
                Se utiliza únicamente para detectar
                las paredes cuando se usa mouse.
            ============================== */}
            <canvas
              ref={mazeCanvasRef}
              width={BASE_WIDTH}
              height={BASE_HEIGHT}
              style={{
                display: 'none'
              }}
            />

          </div>

        </div>

        {/* ==============================
            BOTONES
        ============================== */}
        <div className="flex gap-4 justify-center mt-4">

          <button
            onClick={onComplete}
            disabled={!terminado}
            className={`px-6 py-2 rounded font-bold ${
              terminado
                ? 'bg-yellow-400'
                : 'bg-gray-300'
            }`}
          >
            Continuar
          </button>

          <button
            onClick={reiniciar}
            className="bg-gray-300 px-6 py-2 rounded font-bold"
          >
            Reiniciar
          </button>

        </div>

      </div>

    </LayoutActividad>
  );
};

export default Act06;