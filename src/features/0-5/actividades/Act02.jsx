import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import DibujoCanvas from '../../../components/actividades/tipos/TipoDibujar';

const Act02 = ({ data, onComplete, onBack, rango }) => {

  // Estado de respuesta
  const [respuestaTexto, setRespuestaTexto] = useState(() => 
    localStorage.getItem(`respuesta-${rango}-2`) || ""
  );

  // Validación
  const [tieneDibujo, setTieneDibujo] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validar cuando cambian datos
  useEffect(() => {
    const tieneTexto = respuestaTexto.trim().length > 0;
    setIsValid(tieneTexto && tieneDibujo);
  }, [respuestaTexto, tieneDibujo]);

  // Guardar
  const guardarYTerminar = () => {
    if (!isValid) return;

    localStorage.setItem(`respuesta-${rango}-2`, respuestaTexto);
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo || '/images/0-5/Fondo0-5.png'}>
      
      {/* BOTÓN */}
      <div className="mb-4">
        <button 
          onClick={onBack} 
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>
      </div>

      <div className="bg-white/95 p-5 md:p-8 rounded-3xl shadow-lg border-4 border-alianza-amarillo" translate="no">

        {/* TÍTULO */}
        <h2 className="text-xl md:text-3xl font-black text-alianza-azul text-center mb-6 uppercase">
          {data.titulo}
        </h2>

        {/* HISTORIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          {[
            { img: data.recursos.alcanciaVacia, texto: data.contenido.historia[0] },
            { img: data.recursos.familia, texto: data.contenido.historia[1] },
            { img: data.recursos.alcanciaLlena, texto: data.contenido.historia[2] }
          ].map((item, i) => (
            <div key={i}>
              <img 
                src={item.img} 
                className="w-24 md:w-32 mx-auto mb-2" 
                alt="historia" 
              />
              <p className="text-sm md:text-lg font-bold">
                {item.texto}
              </p>
            </div>
          ))}
        </div>

        {/* TIPS */}
        <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl border-2 border-alianza-amarillo mb-6">
          <h4 className="font-black text-alianza-azul mb-2">
            💡 Tips para Papás
          </h4>

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

        {/*DIBUJO (REUTILIZABLE) */}
        <DibujoCanvas 
          storageKey={`dibujo-${rango}-2`}
          onChange={(valor) => setTieneDibujo(valor)}
        />

        {/* RESPUESTA */}
        <div className="mt-12 mb-10 text-center bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner">
          
          <h3 className="text-lg md:text-2xl font-black text-pink-500 mb-2 uppercase tracking-wide">
            {data.subtitulo}
          </h3>

          <p className="text-lg md:text-2xl font-black text-alianza-azul mb-6">
            {data.pregunta}
          </p>

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
          className={`w-full py-4 rounded-full font-black text-xl shadow-xl transition ${
            isValid 
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isValid 
            ? '¡Terminé mi obra de arte!' 
            : 'Dibuja y escribe para continuar'}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act02;