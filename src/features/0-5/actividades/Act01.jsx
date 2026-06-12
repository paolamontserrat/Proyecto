import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act01 = ({ data, onComplete, onBack }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#FFB300");
  const [isValid, setIsValid] = useState(false);
  const [nombre, setNombre] = useState(() => localStorage.getItem(`nombre-${data.id}`) || "");
  const [nombreGuardado, setNombreGuardado] = useState(() => !!localStorage.getItem(`nombre-${data.id}`));

  const storageKey = `dibujo-paso-${data.id}`;
  const colores = ["#FF0000", "#FFB300", "#00FF00", "#0000FF", "#FF00FF"];

  // 1. Validación estricta
  const validarProgreso = () => {
    if (!canvasRef.current) return;
    const saveData = canvasRef.current.getSaveData();
    const parsed = JSON.parse(saveData);
    const tieneDibujo = parsed.lines && parsed.lines.length > 0;
    setIsValid(!!tieneDibujo && nombreGuardado);
  };

  // 2. Carga forzada con delay y validación
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData && canvasRef.current) {
      // Usamos un pequeño delay para asegurar que el canvas esté listo
      setTimeout(() => {
        canvasRef.current.loadSaveData(savedData, true);
        validarProgreso();
      }, 200);
    }
  }, []);

  // 3. Guardado seguro
  const guardarProgreso = () => {
    if (canvasRef.current) {
      localStorage.setItem(storageKey, canvasRef.current.getSaveData());
      validarProgreso();
    }
  };

  const manejarGuardarNombre = () => {
    if (nombre.trim() !== "") {
      localStorage.setItem(`nombre-${data.id}`, nombre);
      setNombreGuardado(true);
      validarProgreso();
    }
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      <div className="mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow">← Regresar</button>
      </div>

      <div className="bg-white/90 p-5 md:p-8 rounded-3xl shadow-lg mb-6 text-center" translate="no">
        <h2 className="text-xl md:text-3xl font-black text-alianza-azul mb-4 uppercase">{data.titulo}</h2>
        <p className="text-sm md:text-lg text-gray-700 mb-6">{data.contenido}</p>
        <img src={data.recursos.procesoAhorro} className="w-full max-w-md mx-auto mb-4" alt="proceso" />
      </div>

      <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
        <h3 className="text-lg md:text-xl font-black text-center text-alianza-azul mb-4">{data.actividad}</h3>

        <div className="flex justify-center gap-3 mb-4 flex-wrap">
          {colores.map((c) => (
            <button key={c} onClick={() => setColor(c)} className="w-8 h-8 md:w-10 md:h-10 rounded-full border" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* El contenedor debe tener tamaño definido para que CanvasDraw no se pierda */}
        <div className="relative w-full aspect-[4/3] border-4 border-gray-200 rounded-2xl mb-4 bg-white overflow-hidden">
          <CanvasDraw
            ref={canvasRef}
            className="absolute inset-0"
            canvasWidth={800}
            canvasHeight={600}
            brushColor={color}
            brushRadius={6}
            lazyRadius={0}
            hideInterface={true}
            onChange={guardarProgreso}
          />
          <img src={data.recursos.cochinitoColorear} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="cochinito" />
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { canvasRef.current.clear(); localStorage.removeItem(storageKey); validarProgreso(); }} className="flex-1 bg-red-100 text-red-600 py-2 rounded-full font-bold">Limpiar</button>
          <button onClick={() => { canvasRef.current.undo(); guardarProgreso(); }} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-full font-bold">Deshacer</button>
        </div>

        <div className="mb-4">
          {nombreGuardado ? (
            <div onClick={() => { setNombreGuardado(false); validarProgreso(); }} className="p-3 border-2 border-green-500 bg-green-50 rounded-xl text-center cursor-pointer">
              <p className="font-bold text-green-700">¡Hola, {nombre}!</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="flex-1 p-3 border rounded-xl text-center" />
              <button onClick={manejarGuardarNombre} className="bg-alianza-azul text-white px-4 rounded-xl">OK</button>
            </div>
          )}
        </div>

        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${isValid ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {isValid ? '¡Listo!' : 'Completa para avanzar'}
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act01;