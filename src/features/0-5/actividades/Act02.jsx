import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act02 = ({ data, onComplete, onBack, rango }) => {
  const canvasRef = useRef(null);
  const [isEraser, setIsEraser] = useState(false);
  const [brushColor, setBrushColor] = useState("#2D3748");
  
  // Estados para validación
  const [respuestaTexto, setRespuestaTexto] = useState(() => localStorage.getItem(`respuesta-${rango}-2`) || "");
  const [isValid, setIsValid] = useState(false);

  const colores = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFD700", "#FF4500", "#2D3748"];

  // Función para validar si hay dibujo y texto
  const validarFormulario = () => {
    const saveData = canvasRef.current ? canvasRef.current.getSaveData() : "";
    const tieneDibujo = saveData.length > 50; 
    const tieneTexto = respuestaTexto.trim().length > 0;
    setIsValid(tieneDibujo && tieneTexto);
  };

  // Validar al cargar el componente
  useEffect(() => {
    validarFormulario();
  }, [respuestaTexto]);

  const reiniciarDibujo = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      localStorage.removeItem(`dibujo-${rango}-2`);
      validarFormulario();
    }
  };

  const guardarYTerminar = () => {
    if (!isValid) return;
    localStorage.setItem(`dibujo-${rango}-2`, canvasRef.current.getSaveData());
    localStorage.setItem(`respuesta-${rango}-2`, respuestaTexto);
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo || '/images/0-5/Fondo0-5.png'}>
      
      {/* 🔙 BOTÓN */}
      <div className="mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow">
          ← Regresar
        </button>
      </div>

      <div className="bg-white/95 p-5 md:p-8 rounded-3xl shadow-lg border-4 border-alianza-amarillo" translate="no">

        {/* 🧠 TÍTULO */}
        <h2 className="text-xl md:text-3xl font-black text-alianza-azul text-center mb-6 uppercase">
          {data.titulo}
        </h2>

        {/* 🖼️ HISTORIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          {[
            { img: data.recursos.alcanciaVacia, texto: data.contenido.historia[0] },
            { img: data.recursos.familia, texto: data.contenido.historia[1] },
            { img: data.recursos.alcanciaLlena, texto: data.contenido.historia[2] }
          ].map((item, i) => (
            <div key={i}>
              <img src={item.img} className="w-24 md:w-32 mx-auto mb-2" alt="historia" />
              <p className="text-sm md:text-lg font-bold">{item.texto}</p>
            </div>
          ))}
        </div>

        {/* 💡 TIPS */}
        <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl border-2 border-alianza-amarillo mb-6">
          <h4 className="font-black text-alianza-azul mb-2">💡 Tips para Papás</h4>
          <ul className="text-sm md:text-lg">
            <li>{data.contenido.tips[0]}</li>
            <li>{data.contenido.tips[1]}</li>
            <ul className="list-disc pl-6 font-bold">
              <li>{data.contenido.tips[2]}</li>
              <li>{data.contenido.tips[3]}</li>
              <li>{data.contenido.tips[4]}</li>
            </ul>
          </ul>
        </div>

        {/* 🎨 DIBUJO */}
        <div className="bg-white border-4 border-alianza-azul rounded-[2rem] p-4 mb-6">
          <p className="font-black text-xl text-alianza-azul text-center mb-4">{data.actividad}</p>
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {colores.map((c) => (
              <button key={c} onClick={() => { setBrushColor(c); setIsEraser(false); }} className="w-8 h-8 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: c }} />
            ))}
            <button onClick={() => setIsEraser(true)} className="w-8 h-8 rounded-full bg-red-100 border-4 border-red-500 text-red-500 font-bold" translate="no">G</button>
          </div>
          <button onClick={reiniciarDibujo} className="w-full text-sm bg-red-50 text-red-600 py-2 rounded-full font-bold mb-2">Reiniciar dibujo</button>
          <div className="w-full h-[250px] bg-gray-50 rounded-2xl overflow-hidden border-4 border-gray-200 flex justify-center">
            <CanvasDraw 
              ref={canvasRef}
              canvasWidth={680} canvasHeight={350} 
              brushRadius={isEraser ? 25 : 5} 
              brushColor={isEraser ? "#F9FAFB" : brushColor} 
              backgroundColor="transparent"
              onChange={validarFormulario}
              saveData={localStorage.getItem(`dibujo-${rango}-2`)}
            />
          </div>
          <div className='mt-15 mb-10'/>
        </div>

        {/* 📝 RESPUESTA PREGUNTA */}
        <div className="mt-12 mb-10 text-center bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner">
          <h3 className="text-lg md:text-2xl font-black text-pink-500 mb-2 uppercase tracking-wide">{data.subtitulo}</h3>
          <p className="text-lg md:text-2xl font-black text-alianza-azul mb-6">{data.pregunta}</p>
          <input 
            type="text" 
            value={respuestaTexto} 
            onChange={(e) => setRespuestaTexto(e.target.value)} 
            className="w-full p-4 border-4 border-gray-300 rounded-3xl text-center font-bold text-lg focus:border-alianza-amarillo outline-none" 
            placeholder="Escribe tu respuesta aquí..." 
          />
        </div>

        {/* BOTÓN FINAL */}
        <button 
          onClick={guardarYTerminar} 
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl shadow-xl transition ${isValid ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {isValid ? '¡Terminé mi obra de arte!' : 'Dibuja y escribe para continuar'}
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act02;