import React, { useState } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import TipoDibujar from '../../../components/actividades/tipos/TipoDibujar';

const Act02 = ({ data, onComplete, onBack, rango }) => {

  const [isValid, setIsValid] = useState(false);

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

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white/85 backdrop-blur-sm p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* TÍTULO */}
        <h2 className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-6">
          {data.titulo}
        </h2>

        {/* SECCIÓN SUPERIOR */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">

          {/* IMAGEN IZQUIERDA */}
          <img 
            src={data.recursos.imagenIzquierda}
            className="w-40 md:w-52 object-contain"
          />

          {/* TEXTO */}
          <div className="text-center md:text-left">
            {data.contenido.map((linea, i) => (
              <p key={i} className="text-lg md:text-xl font-bold text-gray-800">
                {linea}
              </p>
            ))}
          </div>

        </div>

        {/* TIPS + IMAGEN */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">

          {/* CUADROS */}
          <div className="flex-1">

            {/* AZUL FUERTE */}
            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black text-lg">
                {data.tips.titulo}
              </h3>
            </div>

            {/* AZUL CLARO */}
            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold text-sm md:text-base space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>

          </div>

          {/* IMAGEN DERECHA */}
          <img 
            src={data.recursos.imagenDerecha}
            className="w-32 md:w-40 object-contain "
          />

        </div>

        {/* INSTRUCCIÓN DE DIBUJO */}
        <p className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-4">
        {data.instruccionDibujo}
        </p>

        {/* DIBUJO */}
        <TipoDibujar
          storageKey={`dibujo-${rango}-2`}
          onChange={(tieneDibujo) => setIsValid(tieneDibujo)}
        />

        {/* BOTÓN FINAL */}
        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isValid ? '¡Terminé!' : 'Dibuja para continuar'}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act02;