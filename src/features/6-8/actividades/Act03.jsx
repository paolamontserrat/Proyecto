import React, { useState } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act03 = ({ data, onComplete, onBack, rango }) => {

  const [respuesta, setRespuesta] = useState(
    () => localStorage.getItem(`respuesta-${rango}-3`) || ""
  );

  const isValid = respuesta.trim().length > 0;

  const guardarYContinuar = () => {
    if (!isValid) return;
    localStorage.setItem(`respuesta-${rango}-3`, respuesta);
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* BOTÓN */}
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>
      </div>

      {/* CONTENEDOR */}
      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* IMÁGENES SUPERIORES */}
        <img src={data.recursos.imagen1} className="w-full max-w-md mx-auto mb-4" />
        <img src={data.recursos.imagen2} className="w-full max-w-md mx-auto mb-6" />

        {/* TIPS + IMAGEN */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">

          <div className="flex-1">

            {/* NARANJA FUERTE */}
            <div className="bg-orange-600 p-4 rounded-t-2xl">
              <h3 className="text-white font-black text-lg">
                {data.tips.titulo}
              </h3>
            </div>

            {/* NARANJA CLARO */}
            <div className="bg-orange-400 p-4 rounded-b-2xl text-white font-bold text-sm md:text-base space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>

          </div>

          <img 
            src={data.recursos.imagenTips}
            className="w-32 md:w-40 object-contain"
          />

        </div>

        {/* HISTORIA */}
        <div className="text-center mb-6 space-y-2">
          {data.contenido.historia.map((linea, i) => (
            <p key={i} className="text-lg md:text-xl font-bold text-gray-800">
              {linea}
            </p>
          ))}
        </div>

        {/* IMÁGENES INFERIORES */}
        <img src={data.recursos.imagen3} className=" w-32 md:w-40 max-w-md mx-auto mb-0" />

        <div className="relative w-full max-w-md mx-auto mb-6">
          <img src={data.recursos.imagen4} className="w-full" />
          
          {/* LOGO ENCIMA */}
          <img 
            src={data.recursos.logoCentro}
            className="absolute inset-0 m-auto w-20 md:w-28 object-contain"
          />
        </div>

        {/* PREGUNTA */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner text-center mb-6">
          <p className="text-lg md:text-2xl font-black text-alianza-azul mb-4">
            {data.pregunta}
          </p>

          <input
            type="text"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="w-full p-4 border-4 border-gray-300 rounded-3xl text-center font-bold text-lg focus:border-alianza-amarillo outline-none"
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarYContinuar}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isValid ? '¡Continuar!' : 'Responde para continuar'}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act03;