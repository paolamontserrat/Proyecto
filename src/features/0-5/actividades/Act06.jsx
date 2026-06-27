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

  const zonaInicio = { x: 10, y: 10, w: 120, h: 120 };
  const zonaMeta = { x: 670, y: 470, w: 120, h: 120 };

  // ==============================
  // USER SEGURO
  // ==============================
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  };

  const userId = getUser()?.id || "anon";

  // ==============================
  // KEY MULTIUSUARIO REAL
  // ==============================
  const key = `laberinto-${rango}-${userId}-${data.id}`;

// =========================
// GUARDADO GLOBAL
// =========================
const guardarTodo = async (state) => {
  // LOCAL
  localStorage.setItem(key, JSON.stringify(state));

  // SUPABASE
  if (userId !== "anon") {
    try {
      await supabase.from('progreso_actividades').upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: state,
          completada: state.terminado,
        },
        { onConflict: 'usuario_id,actividad_id' }   // ← sin espacio
      );
    } catch {
      console.warn("Offline → se sincronizará después");
    }
  }
};

  const guardar = (estadoTerminado = terminado) => {
    const dataURL = canvasRef.current.toDataURL();

    const state = {
      imagen: dataURL,
      terminado: estadoTerminado
    };

    guardarTodo(state);
  };

 // =========================
// CARGA (SUPABASE PRIMERO → local como fallback)
// =========================
useEffect(() => {
  const cargar = async () => {
    const img = new Image();
    img.src = data.recursos.laberintoImg;

    img.onload = async () => {
      const mazeCanvas = mazeCanvasRef.current;
      const mazeCtx = mazeCanvas.getContext('2d');
      mazeCanvas.width = BASE_WIDTH;
      mazeCanvas.height = BASE_HEIGHT;
      mazeCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);

      const aplicarEstado = ({ imagen, terminado: t }) => {
        if (imagen) {
          const ctx = canvasRef.current.getContext('2d');
          const savedImg = new Image();
          savedImg.src = imagen;
          savedImg.onload = () => ctx.drawImage(savedImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
        }
        if (t) setTerminado(true);
      };

      // 1. SUPABASE (fuente de verdad, multi-dispositivo)
      if (userId !== "anon") {
        const { data: db } = await supabase
          .from('progreso_actividades')
          .select('datos_actividad')
          .eq('usuario_id', userId)
          .eq('actividad_id', data.id)
          .maybeSingle();            // ← maybeSingle en lugar de single

        if (db?.datos_actividad) {
          aplicarEstado(db.datos_actividad);
          localStorage.setItem(key, JSON.stringify(db.datos_actividad));
          return;
        }
      }

      // 2. LOCAL (fallback para anónimos o sin conexión)
      const local = localStorage.getItem(key);
      if (local) {
        try { aplicarEstado(JSON.parse(local)); } catch { /* corrupto */ }
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
      setScale(containerRef.current.clientWidth / BASE_WIDTH);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getCtx = () => canvasRef.current.getContext('2d');

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) / scale,
        y: (e.touches[0].clientY - rect.top) / scale
      };
    }

    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const estaEnZona = (x, y, zona) =>
    x >= zona.x && x <= zona.x + zona.w &&
    y >= zona.y && y <= zona.y + zona.h;

  // ==============================
  // DRAW
  // ==============================
  const startDrawing = (e) => {
    if (terminado) return;

    const { x, y } = getCoords(e);

    if (!estaEnZona(x, y, zonaInicio)) {
      setMensaje("Comienza desde el inicio.");
      setTimeout(() => setMensaje(null), 2000);
      return;
    }

    const ctx = getCtx();
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || terminado) return;

    const { x, y } = getCoords(e);
    const ctx = getCtx();

    const esTouch = e.type.includes('touch');

    if (!esTouch) {
      const mazeCtx = mazeCanvasRef.current.getContext('2d');
      const pixel = mazeCtx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;

      if (r > 200 && g < 80 && b < 80) {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        localStorage.removeItem(key);
        setIsDrawing(false);
        setMensaje("Tocaste la pared.");
        setTimeout(() => setMensaje(null), 2000);
        return;
      }
    }

    if (estaEnZona(x, y, zonaMeta)) {
      setIsDrawing(false);
      setTerminado(true);

      guardar(true);

      setMensaje("Laberinto completado.");
      return;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = esTouch ? 10 : 5;
    ctx.stroke();

    guardar();
  };

  // ==============================
  //  RESET
  // ==============================
  const reiniciar = () => {
    const ctx = getCtx();
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    const state = { imagen: null, terminado: false };

    localStorage.removeItem(key);
    setTerminado(false);

    guardarTodo(state);
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

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      <div className="bg-white p-4 rounded-2xl border-4 border-yellow-400 max-w-4xl mx-auto">

        <h2 className="text-xl font-bold text-center mb-2">{data.titulo}</h2>

        <div ref={containerRef} className="w-full">
          <div className="relative" style={{ height: BASE_HEIGHT * scale }}>

            {mensaje && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded z-10">
                {mensaje}
              </div>
            )}

            {/* LABERINTO BASE */}
            <img 
              src={data.recursos.laberintoImg} 
              className="absolute w-full h-full" 
            />

            {/* INICIO */}
            <img
              src={data.recursos.inicioImg}
              style={{
                position: 'absolute',
                left: zonaInicio.x * scale,
                top: zonaInicio.y * scale,
                width: zonaInicio.w * scale
              }}
            />

            {/* META */}
            <img
              src={data.recursos.finImg}
              style={{
                position: 'absolute',
                left: zonaMeta.x * scale,
                top: zonaMeta.y * scale,
                width: zonaMeta.w * scale
              }}
            />

            <canvas
              ref={canvasRef}
              width={BASE_WIDTH}
              height={BASE_HEIGHT}
              className="absolute w-full h-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={() => setIsDrawing(false)}
            />

            <canvas ref={mazeCanvasRef} style={{ display: 'none' }} />

          </div>
        </div>

        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={onComplete}
            disabled={!terminado}
            className={`px-6 py-2 rounded font-bold
              ${terminado ? 'bg-yellow-400' : 'bg-gray-300'}
            `}
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