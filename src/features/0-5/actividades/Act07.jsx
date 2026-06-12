import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const Act07 = ({ data, onComplete, onBack, rango }) => {
  const containerRef = useRef(null);

  const [relaciones, setRelaciones] = useState([]);
  const [completado, setCompletado] = useState(false);
  const [startItem, setStartItem] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [errorItem, setErrorItem] = useState(null);

  const [textos, setTextos] = useState([]);
  const [imagenesIzq, setImagenesIzq] = useState([]);
  const [imagenesDer, setImagenesDer] = useState([]);

  const [ready, setReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  const key = `act07-progreso-${rango || 1}`;

  // =========================
  // 🔁 CARGA INICIAL
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem(key);

    if (saved) {
      const d = JSON.parse(saved);

      setRelaciones(d.relaciones || []);
      setTextos(d.textos || []);
      setImagenesIzq(d.imagenesIzq || []);
      setImagenesDer(d.imagenesDer || []);
      setCompletado(d.completado || false);
    } else {
      const shuffled = shuffle(data.pares);

      setTextos(shuffle([...shuffled]));
      setImagenesIzq(shuffle(shuffled.slice(0, 3)));
      setImagenesDer(shuffle(shuffled.slice(3)));
    }

    setReady(true);

    // 🔥 IMPORTANTE: esperar render REAL del DOM
    requestAnimationFrame(() => {
      setLayoutReady(true);
    });

  }, [key, data]);

  // =========================
  // 💾 GUARDADO AUTOMÁTICO
  // =========================
  useEffect(() => {
    if (!ready) return;

    const state = {
      relaciones,
      textos,
      imagenesIzq,
      imagenesDer,
      completado
    };

    localStorage.setItem(key, JSON.stringify(state));
  }, [relaciones, textos, imagenesIzq, imagenesDer, completado, ready, key]);

  // =========================
  // 📱 FIX RESIZE (recalcular líneas)
  // =========================
  useEffect(() => {
    const update = () => {
      setLayoutReady(false);
      requestAnimationFrame(() => setLayoutReady(true));
    };

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // =========================
  // 🔄 RESET
  // =========================
  const resetear = () => {
    const shuffled = shuffle(data.pares);

    const base = {
      relaciones: [],
      textos: shuffle([...shuffled]),
      imagenesIzq: shuffle(shuffled.slice(0, 3)),
      imagenesDer: shuffle(shuffled.slice(3)),
      completado: false
    };

    setRelaciones([]);
    setTextos(base.textos);
    setImagenesIzq(base.imagenesIzq);
    setImagenesDer(base.imagenesDer);
    setCompletado(false);
    setMensaje(null);

    localStorage.setItem(key, JSON.stringify(base));
    setLayoutReady(false);

    requestAnimationFrame(() => setLayoutReady(true));
  };

  // =========================
  // 📍 COORDENADAS
  // =========================
  const getCoords = (id) => {
    const el = document.getElementById(id);
    const cont = containerRef.current;

    if (!el || !cont) return null;

    const r = el.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();

    return {
      x: r.left - cr.left + r.width / 2,
      y: r.top - cr.top + r.height / 2
    };
  };

  // =========================
  // 🎯 MATCH
  // =========================
  const handleSelect = (item, tipo) => {
    if (completado || relaciones.find(r => r.id === item.id)) return;

    if (!startItem) {
      setStartItem({ ...item, tipo });
    } else {
      if (startItem.id === item.id && startItem.tipo !== tipo) {
        const newRel = [...relaciones, { id: item.id }];
        setRelaciones(newRel);

        if (newRel.length === data.pares.length) {
          setCompletado(true);
        }
      } else {
        setMensaje("¡Intenta de nuevo!");
        setErrorItem(item.id);

        setTimeout(() => {
          setMensaje(null);
          setErrorItem(null);
        }, 800);
      }

      setStartItem(null);
    }
  };

  if (!ready) return null;

  return (
    <div
      className="min-h-screen p-2 sm:p-4"
      style={{
        backgroundImage: `url(${data.fondo})`,
        backgroundSize: 'cover'
      }}
    >
      {/* BACK */}
      <div className="w-full max-w-5xl mx-auto mb-4 px-2">
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-black"
        >
          ← Regresar
        </button>
      </div>

      {/* CARD */}
      <div
        ref={containerRef}
        className="bg-white/95 p-3 sm:p-6 rounded-[2rem] border-[6px] border-yellow-400 max-w-5xl mx-auto relative"
      >
        {/* TIPS */}
        <motion.div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-blue-700 mb-2">
            {data.tips.titulo}
          </h2>

          <div className="bg-blue-50 p-3 rounded-2xl mb-3">
            <img src={data.tips.imagenTip} className="w-40 sm:w-40 mx-auto mb-2" />
            {data.tips.descripcion.map((t, i) => (
              <p key={i} className="font-bold text-xs sm:text-sm">{t}</p>
            ))}
          </div>

          <div className="bg-yellow-100 p-3 rounded-2xl">
            <img src={data.tips.imagenFrases} className="w-50 sm:w-50 mx-auto mb-2" />
            {data.tips.frases.map((f, i) => (
              <p key={i} className="font-black text-xs sm:text-sm">"{f}"</p>
            ))}
          </div>
        </motion.div>

        {/* MENSAJES */}
        {completado && (
          <div className="bg-green-500 text-white p-2 rounded mb-2 text-center font-bold">
            Actividad completada
          </div>
        )}

        {mensaje && (
          <div className="bg-red-500 text-white p-2 rounded mb-2 text-center text-sm">
            {mensaje}
          </div>
        )}

        {/* SVG LÍNEAS */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {layoutReady &&
            relaciones.map((rel) => {
              const p1 =
                getCoords(`izq-${rel.id}`) ||
                getCoords(`der-${rel.id}`);
              const p2 = getCoords(`text-${rel.id}`);

              if (!p1 || !p2) return null;

              return (
                <line
                  key={rel.id}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#22c55e"
                  strokeWidth="4"
                />
              );
            })}
        </svg>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 items-center relative z-20">

          {/* IZQUIERDA */}
          <div className="flex sm:flex-col flex-row flex-wrap justify-center gap-2">
            {imagenesIzq.map(item => (
              <img
                key={item.id}
                id={`izq-${item.id}`}
                src={item.imagen}
                onClick={() => handleSelect(item, 'izq')}
                className={`w-28 sm:w-32 md:w-36 h-20 sm:h-24 object-contain cursor-pointer border-2 rounded-lg ${
                  errorItem === item.id ? 'border-red-500' : 'border-transparent'
                }`}
              />
            ))}
          </div>

          {/* CENTRO */}
          <div className="flex flex-col gap-2 order-3 sm:order-none">
            {textos.map(item => (
              <div
                key={item.id}
                id={`text-${item.id}`}
                onClick={() => handleSelect(item, 'text')}
                className={`p-2 text-[11px] sm:text-xs text-center font-bold border-2 rounded cursor-pointer ${
                  errorItem === item.id
                    ? 'bg-red-200 border-red-500'
                    : 'bg-blue-100 border-blue-200'
                }`}
              >
                {item.texto}
              </div>
            ))}
          </div>

          {/* DERECHA */}
          <div className="flex sm:flex-col flex-row flex-wrap justify-center gap-2">
            {imagenesDer.map(item => (
              <img
                key={item.id}
                id={`der-${item.id}`}
                src={item.imagen}
                onClick={() => handleSelect(item, 'der')}
                className={`w-28 sm:w-32 md:w-36 h-20 sm:h-24 object-contain cursor-pointer border-2 rounded-lg ${
                  errorItem === item.id ? 'border-red-500' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            onClick={onComplete}
            disabled={!completado}
            className={`px-4 py-4 rounded-full w-full font-bold ${
              completado ? 'bg-yellow-400' : 'bg-gray-300'
            }`}
          >
            Finalizar
          </button>

          <button
            onClick={resetear}
            className="bg-gray-200 px-4 py-4 rounded-full w-full font-bold"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Act07;