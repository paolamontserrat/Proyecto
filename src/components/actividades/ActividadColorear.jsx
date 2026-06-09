import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';

const ActividadColorear = ({ data, onComplete, onBack }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#FFB300");
  const colores = ["#FF0000", "#FFB300", "#00FF00", "#0000FF", "#FF00FF"];
  
  // Estados para persistencia
  const [nombre, setNombre] = useState(() => localStorage.getItem(`nombre-${data.id}`) || "");
  const [nombreGuardado, setNombreGuardado] = useState(() => !!localStorage.getItem(`nombre-${data.id}`));
  const storageKey = `dibujo-paso-${data.id}`;

  // Cargar dibujo al montar
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData && canvasRef.current) {
      canvasRef.current.loadSaveData(savedData);
    }
  }, [storageKey]);

  // Guardar dibujo
  const guardarProgreso = () => {
    if (canvasRef.current) {
      localStorage.setItem(storageKey, canvasRef.current.getSaveData());
    }
  };

  // Manejo de nombre
  const manejarGuardarNombre = () => {
    if (nombre.trim() !== "") {
      localStorage.setItem(`nombre-${data.id}`, nombre);
      setNombreGuardado(true);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center" style={{ backgroundImage: `url('${data.recursos.fondo}')` }}>
      
      {/* Botón Regresar */}
      <div className="w-full max-w-2xl flex justify-start mb-4">
        <button 
          onClick={onBack}
          className="bg-alianza-azul text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-md"
        >
          <span>←</span> Regresar
        </button>
      </div>
      
      {/* Contenedor Superior */}
      <div className="bg-white/90 p-8 rounded-3xl shadow-lg mb-6 text-center w-full max-w-2xl">
        <h2 className="text-3xl font-black text-alianza-azul mb-4 uppercase">{data.titulo}</h2>
        <p className="text-lg text-gray-700 mb-6 font-medium">{data.contenido}</p>
        
        <div className="flex flex-col items-center gap-6">
          <img src={data.recursos.procesoAhorro} alt="Proceso de Ahorro" className="w-full max-w-lg" />
          <div className="flex justify-center items-end gap-6 w-full">
            <img src={data.recursos.ninoIzquierda} alt="Niño ahorrando" className="w-1/4 object-contain" />
            <img src={data.recursos.ninoMostrador} alt="Niño en mostrador" className="w-1/2 object-contain" />
          </div>
        </div>
      </div>

      {/* Contenedor Inferior */}
      <div className="bg-white p-8 rounded-3xl border-4 border-alianza-amarillo w-full max-w-2xl shadow-2xl">
        <h3 className="text-xl font-black text-alianza-azul text-center mb-6">{data.actividad}</h3>
        
        {/* Paleta de Colores */}
        <div className="flex justify-center gap-3 mb-6">
          {colores.map((c) => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              className="w-10 h-10 rounded-full border-2 border-gray-300 transition-transform hover:scale-110 shadow-md"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Área de dibujo */}
        <div className="relative w-full h-[400px] border-2 border-gray-200 rounded-2xl mb-6 bg-white overflow-hidden">
          <CanvasDraw
            ref={canvasRef}
            className="absolute inset-0 z-0"
            canvasWidth={672}
            canvasHeight={400}
            brushColor={color}
            brushRadius={8}
            lazyRadius={0}
            backgroundColor="transparent"
            hideInterface={true}
            onChange={guardarProgreso}
          />
          <img 
            src={data.recursos.cochinitoColorear} 
            alt="Contorno" 
            className="absolute inset-0 w-full h-full object-contain p-6 z-10 pointer-events-none" 
          />
        </div>

        {/* Botones de control */}
        <div className="flex gap-4 mb-6">
           <button 
             onClick={() => { canvasRef.current.clear(); localStorage.removeItem(storageKey); }} 
             className="flex-1 bg-red-100 text-red-600 py-3 rounded-full font-bold text-lg"
           >Limpiar</button>
           <button 
             onClick={() => { canvasRef.current.undo(); guardarProgreso(); }} 
             className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-full font-bold text-lg"
           >Deshacer</button>
        </div>

        {/* Input de Nombre dinámico */}
        <div className="mb-6">
          {nombreGuardado ? (
            <div onClick={() => setNombreGuardado(false)} className="w-full p-4 border-2 border-green-500 bg-green-50 rounded-2xl text-center cursor-pointer hover:bg-green-100 transition">
              <p className="font-black text-green-700 text-lg">¡Hola, {nombre}!</p>
              <span className="text-xs text-green-600 underline">Toca para editar</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Escribe tu nombre aquí" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && manejarGuardarNombre()}
                className="flex-1 p-4 border-2 border-alianza-azul rounded-2xl text-center font-bold text-lg"
              />
              <button onClick={manejarGuardarNombre} className="bg-alianza-azul text-white px-6 rounded-2xl font-bold">OK</button>
            </div>
          )}
        </div>

        <button 
          onClick={onComplete} 
          className="w-full bg-alianza-amarillo py-5 rounded-full font-black text-alianza-azul shadow-xl text-lg hover:scale-[1.02] transition-transform"
        >
          ¡Listo, ya terminé!
        </button>
      </div>
    </div>
  );
};

export default ActividadColorear;