import React, { useRef, useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act06 = ({ data, onComplete, onBack, rango }) => {

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

  // GUARDAR (imagen + estado)
  const guardar = (estadoTerminado = terminado) => {
    const dataURL = canvasRef.current.toDataURL();

    localStorage.setItem(`laberinto-${rango}`, JSON.stringify({
      imagen: dataURL,
      terminado: estadoTerminado
    }));
  };

  // CARGAR LABERINTO + PROGRESO
  useEffect(() => {
    const img = new Image();
    img.src = data.recursos.laberintoImg;

    img.onload = () => {
      const mazeCanvas = mazeCanvasRef.current;
      const mazeCtx = mazeCanvas.getContext('2d');

      mazeCanvas.width = BASE_WIDTH;
      mazeCanvas.height = BASE_HEIGHT;

      mazeCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);

      // RESTAURAR
      const saved = localStorage.getItem(`laberinto-${rango}`);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed.imagen) {
          const ctx = canvasRef.current.getContext('2d');
          const savedImg = new Image();
          savedImg.src = parsed.imagen;

          savedImg.onload = () => {
            ctx.drawImage(savedImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
          };
        }

        if (parsed.terminado) {
          setTerminado(true);
        }
      }
    };

  }, [data.recursos.laberintoImg, rango]);

  // ESCALA RESPONSIVE
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

  // INICIO
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

  // DIBUJO (VALIDACIÓN CORREGIDA)
  const draw = (e) => {
    if (!isDrawing || terminado) return;

    const { x, y } = getCoords(e);
    const ctx = getCtx();

    const esEventoTouch = e.type.includes('touch'); // 🔥 CLAVE

    // VALIDACIÓN SOLO CON MOUSE
    if (!esEventoTouch) {
      const mazeCtx = mazeCanvasRef.current.getContext('2d');
      const pixel = mazeCtx.getImageData(x, y, 1, 1).data;
      const [r, g, b] = pixel;

      if (r > 200 && g < 80 && b < 80) {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        localStorage.removeItem(`laberinto-${rango}`);
        setIsDrawing(false);
        setMensaje("Tocaste la pared.");
        setTimeout(() => setMensaje(null), 2000);
        return;
      }
    }

    // META
    if (estaEnZona(x, y, zonaMeta)) {
      setIsDrawing(false);
      setTerminado(true);

      guardar(true);

      setMensaje("Laberinto completado.");
      return;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = esEventoTouch ? 10 : 5;
    ctx.stroke();

    guardar();
  };

  const reiniciar = () => {
    const ctx = getCtx();
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    localStorage.removeItem(`laberinto-${rango}`);
    setTerminado(false);
  };

  return (
    <LayoutActividad fondo={data.recursos.fondoImg}>

      {/* BOTÓN REGRESAR */}
      <div className="w-full max-w-4xl mb-4">
        <button onClick={onBack} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold">
          ← Regresar
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border-4 border-yellow-400 max-w-4xl mx-auto">

        <h2 className="text-xl font-bold text-center mb-2">
          {data.titulo}
        </h2>

        <p className="text-center text-sm md:text-base text-gray-600 mb-4 font-semibold">
          💡 Si quieres subir el nivel de dificultad, intenta hacerlo en computadora.
        </p>

        <div ref={containerRef} className="w-full">

          <div
            className="relative"
            style={{
              width: '100%',
              height: BASE_HEIGHT * scale
            }}
          >

            {mensaje && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded z-10">
                {mensaje}
              </div>
            )}

            {/* LABERINTO */}
            <img
              src={data.recursos.laberintoImg}
              className="absolute w-full h-full"
              alt="Laberinto"
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
              alt="Inicio"
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
              alt="Meta"
            />

            {/* CANVAS */}
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

        {/* BOTONES */}
        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={onComplete}
            disabled={!terminado}
            className={`px-6 py-2 rounded font-bold
              ${terminado ? 'bg-yellow-400' : 'bg-gray-300 opacity-60 cursor-not-allowed'}
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