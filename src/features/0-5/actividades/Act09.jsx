import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act09 = ({ data, onComplete, onBack, rango }) => {

  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);

  const [encontradas, setEncontradas] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [completado, setCompletado] = useState(false);
  const [cargando, setCargando] = useState(true);

  // CARGAR PROGRESO
  useEffect(() => {
    const saved = localStorage.getItem(`diferencias-${rango}`);

    if (saved) {
      const parsed = JSON.parse(saved);
      setEncontradas(parsed.encontradas || []);
      setCompletado(parsed.completado || false);
    }

    setCargando(false);
  }, [rango]);

  // GUARDAR
  useEffect(() => {
    if (cargando) return;

    localStorage.setItem(`diferencias-${rango}`, JSON.stringify({
      encontradas,
      completado
    }));

  }, [encontradas, completado, cargando, rango]);

  // CALCULAR ESCALA REAL
  useEffect(() => {
    const updateScale = () => {
      if (!imgRef.current) return;

      const displayedWidth = imgRef.current.clientWidth;
      const originalWidth = 300; // 🔥 AJUSTA ESTE VALOR SI TU DISEÑO ES OTRO

      setScale(displayedWidth / originalWidth);
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // CLICK
  const handleClick = (e) => {
    if (completado) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    let indexEncontrado = -1;

    data.actividad.diferencias.forEach((d, i) => {
      if (encontradas.includes(i)) return;

      const dx = x - d.x;
      const dy = y - d.y;

      if (Math.sqrt(dx * dx + dy * dy) < d.radio) {
        indexEncontrado = i;
      }
    });

    if (indexEncontrado !== -1) {

      setEncontradas(prev => {
        if (prev.includes(indexEncontrado)) return prev;

        const nuevas = [...prev, indexEncontrado];

        if (nuevas.length === data.actividad.totalDiferencias) {
          setCompletado(true);
          setMensaje("Actividad completada correctamente");
        } else {
          setMensaje("¡Bien hecho!");
        }

        return nuevas;
      });

      setTimeout(() => setMensaje(null), 1000);

    } else {
      setMensaje("Sigue intentando");
      setTimeout(() => setMensaje(null), 1000);
    }
  };

  const reiniciar = () => {
    setEncontradas([]);
    setCompletado(false);
    localStorage.removeItem(`diferencias-${rango}`);
  };

  return (
    <LayoutActividad fondo={data.fondo}>

      {/* BOTÓN */}
      <div className="max-w-5xl mx-auto mb-4">
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold"
        >
          ← Regresar
        </button>
      </div>

      <div className="bg-white/95 p-8 rounded-[3rem] border-[8px] border-yellow-400 max-w-5xl mx-auto shadow-2xl">

        {/* TIP */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-200 mb-10 flex flex-col md:flex-row items-center gap-6"
        >
          <img src={data.tip.imagen} className="w-40 h-40 object-contain" />

          <div>
            <h2 className="text-3xl font-black text-blue-700 mb-3">
              {data.tip.titulo}
            </h2>

            {data.tip.descripcion.map((t, i) => (
              <p key={i} className="text-xl font-bold text-gray-700">
                {t}
              </p>
            ))}
          </div>
        </motion.div>

        {/* ACTIVIDAD */}
        <div className="bg-yellow-50 p-6 rounded-3xl border-4 border-yellow-300 text-center">

          <h2 className="text-3xl font-black text-yellow-700 mb-6">
            {data.actividad.titulo}
          </h2>

          {mensaje && (
            <div className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold">
              {mensaje}
            </div>
          )}

          {/* IMÁGENES */}
          <div className="flex gap-6 justify-center flex-wrap">

            {[data.actividad.imagenA, data.actividad.imagenB].map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  ref={imgRef}
                  src={img}
                  onClick={handleClick}
                  className="w-[300px] md:w-[450px] rounded-xl shadow-xl cursor-pointer"
                />

                {/* CÍRCULOS */}
                {encontradas.map((i) => {
                  const d = data.actividad.diferencias[i];

                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: d.x * scale - d.radio * scale,
                        top: d.y * scale - d.radio * scale,
                        width: d.radio * 2 * scale,
                        height: d.radio * 2 * scale,
                        borderRadius: '50%',
                        border: '3px solid red',
                        pointerEvents: 'none'
                      }}
                    />
                  );
                })}
              </div>
            ))}

          </div>

          {completado && (
            <div className="mt-4 bg-green-500 text-white p-3 rounded-xl font-bold">
              ¡Encontraste todas las diferencias!
            </div>
          )}

          <button
            onClick={reiniciar}
            className="mt-4 bg-gray-300 px-6 py-3 rounded-full font-bold"
          >
            Reiniciar
          </button>
        </div>

        {/* FINAL */}
        <button
          onClick={onComplete}
          disabled={!completado}
          className={`mt-8 w-full py-4 rounded-full font-black text-xl transition
            ${completado
              ? 'bg-yellow-400 hover:scale-105'
              : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
        >
          Finalizar
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act09;