import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import PuzzleImagen from '../../../components/actividades/tipos/PuzzleImagen';

const Act07 = ({ data, onBack, onComplete }) => {
  const [puzzleCompletado, setPuzzleCompletado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem('act07Puzzle');

    if (guardado) {
      const datos = JSON.parse(guardado);

      if (datos.completado) {
        setPuzzleCompletado(true);
      }
    }
  }, []);

  const handleContinuar = () => {
    localStorage.removeItem('act07Puzzle');
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      {/* BOTÓN REGRESAR */}
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

        {/* ===== PARTE 1: ESCENA ===== */}
        <div className="relative flex flex-col md:flex-row items-center justify-between mb-10">

          <div className="text-center md:text-left">
            <h3 className="text-red-500 font-black text-xl md:text-2xl mb-2">
              {data.textos.izquierda}
            </h3>

            <img
              src={data.recursos.dulces}
              className="w-40 md:w-56 mx-auto"
              alt=""
            />
          </div>

          <div className="my-6 md:my-0">
            <img
              src={data.recursos.nina}
              className="w-44 md:w-60 mx-auto"
              alt=""
            />
          </div>

          <div className="text-center md:text-right">
            <h3 className="text-blue-500 font-black text-xl md:text-2xl mb-2">
              {data.textos.derecha}
            </h3>

            <img
              src={data.recursos.dinero}
              className="w-40 md:w-56 mx-auto"
              alt=""
            />
          </div>

        </div>

        {/* ===== PARTE 2: TIPS ===== */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-10">

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
            alt=""
          />

        </div>

        {/* ===== PARTE 3: ROMPECABEZAS ===== */}
        <div className="text-center mb-10">

          <h3 className="text-xl md:text-2xl font-black text-alianza-azul mb-4">
            {data.actividad}
          </h3>

          {/* REFERENCIA */}
          <div className="mb-6">
            <p className="font-bold text-gray-700 mb-2">
              Observa la imagen y arma el rompecabezas
            </p>

            <img
              src={data.recursos.imagenPrincipal}
              className="w-52 md:w-72 mx-auto rounded-2xl shadow-lg"
              alt=""
            />
          </div>

          {/* PUZZLE */}
          <PuzzleImagen
            imagen={data.recursos.imagenInferior}
            onCompletePuzzle={() => setPuzzleCompletado(true)}
          />

          {puzzleCompletado && (
            <div className="mt-6">
              <p className="text-green-600 font-black text-xl">
                🎉 ¡Excelente trabajo!
              </p>
            </div>
          )}

        </div>

        {/* ===== BOTÓN CONTINUAR ===== */}
        <button
          onClick={handleContinuar}
          disabled={!puzzleCompletado}
          className={`
            w-full
            py-4
            rounded-full
            font-black
            text-xl
            transition

            ${
              puzzleCompletado
                ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continuar
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act07;