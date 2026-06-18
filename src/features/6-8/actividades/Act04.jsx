import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import TipoDibujar from '../../../components/actividades/tipos/TipoDibujar';

const Act04 = ({ data, onComplete, onBack, rango }) => {

  const [respuestas, setRespuestas] = useState(() => {
    const saved = localStorage.getItem(`respuestas-${rango}-4`);
    return saved ? JSON.parse(saved) : ["", "", "", ""];
  });

  const [isValid, setIsValid] = useState(false);
  const [tieneDibujo, setTieneDibujo] = useState(false);

  useEffect(() => {
    const todasRespondidas = respuestas.every(r => r.trim() !== "");
    setIsValid(todasRespondidas && tieneDibujo);
  }, [respuestas, tieneDibujo]);

  const manejarCambio = (index, value) => {
    const nuevas = [...respuestas];
    nuevas[index] = value;
    setRespuestas(nuevas);
    localStorage.setItem(`respuestas-${rango}-4`, JSON.stringify(nuevas));
  };

  const guardarYContinuar = () => {
    if (!isValid) return;
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

      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* TIPS + IMAGEN */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">

          <div className="flex-1">

            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black text-lg">
                {data.tips.titulo}
              </h3>
            </div>

            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold text-sm md:text-base space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>

          </div>

          <img 
            src={data.recursos.imagenDerecha}
            className="w-32 md:w-40 object-contain"
          />

        </div>

        {/* IMÁGENES CENTRALES */}
        <div className="flex items-center justify-center gap-4 mb-8">

          <img 
            src={data.recursos.ninoPensando}
            className="w-32 md:w-30 object-contain"
          />

          <div className="flex flex-col items-center gap-3 w-full max-w-xs md:max-w-sm">
            <img
              src={data.recursos.imagenArriba}
              alt=""
              className="
                w-full
                max-w-[280px]
                h-auto
                object-contain
              "
            />

            <img
              src={data.recursos.imagenAbajo}
              alt=""
              className="
                w-full
                max-w-[180px]
                h-auto
                object-contain
              "
            />
          </div>

        </div>

        {/* ACTIVIDAD DIBUJO */}
        <p className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-4">
          {data.actividad}
        </p>

        <TipoDibujar
          storageKey={`dibujo-${rango}-4`}
          onChange={(val) => setTieneDibujo(val)}
        />

        {/* PREGUNTAS */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner mt-6 space-y-4">

          {data.preguntas.map((pregunta, i) => (
            <div key={i}>
              <p className="font-black text-alianza-azul mb-1">{pregunta}</p>
              <input
                type="text"
                value={respuestas[i]}
                onChange={(e) => manejarCambio(i, e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-center font-bold focus:border-alianza-amarillo outline-none"
              />
            </div>
          ))}

        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarYContinuar}
          disabled={!isValid}
          className={`w-full mt-6 py-4 rounded-full font-black text-xl transition ${
            isValid
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isValid ? '¡Continuar!' : 'Completa todo para avanzar'}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act04;