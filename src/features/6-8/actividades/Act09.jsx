import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import TipoDibujar from '../../../components/actividades/tipos/TipoDibujar';

const Act09 = ({ data, onBack, onComplete, rango }) => {

  // 🔥 SELECCIÓN GUARDADA
  const [seleccion, setSeleccion] = useState(() =>
    localStorage.getItem(`act09-seleccion-${rango}`) || ""
  );

  const [otro, setOtro] = useState(() =>
    localStorage.getItem(`act09-otro-${rango}`) || ""
  );

  // 🔥 RESPUESTAS TEXTO
  const [respuestas, setRespuestas] = useState(() => ({
    r1: localStorage.getItem(`act09-r1-${rango}`) || "",
    r2: localStorage.getItem(`act09-r2-${rango}`) || "",
    r3: localStorage.getItem(`act09-r3-${rango}`) || ""
  }));

  // 🔥 DIBUJOS
  const [dibujos, setDibujos] = useState({
    d1: false,
    d2: false,
    d3: false,
    d4: false
  });

  // 🔥 GUARDAR SELECCIÓN
  useEffect(() => {
    localStorage.setItem(`act09-seleccion-${rango}`, seleccion);
  }, [seleccion, rango]);

  // 🔥 GUARDAR "OTRO"
  useEffect(() => {
    localStorage.setItem(`act09-otro-${rango}`, otro);
  }, [otro, rango]);

  // 🔥 GUARDAR RESPUESTAS
  useEffect(() => {
    localStorage.setItem(`act09-r1-${rango}`, respuestas.r1);
    localStorage.setItem(`act09-r2-${rango}`, respuestas.r2);
    localStorage.setItem(`act09-r3-${rango}`, respuestas.r3);
  }, [respuestas, rango]);

  // 🔥 VALIDACIÓN TOTAL
  const isValid =
    (seleccion !== "" || otro.trim() !== "") &&
    dibujos.d1 &&
    dibujos.d2 &&
    dibujos.d3 &&
    dibujos.d4 &&
    respuestas.r1.trim() !== "" &&
    respuestas.r2.trim() !== "" &&
    respuestas.r3.trim() !== "";

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* REGRESAR */}
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

        {/* TÍTULO */}
        <h2 className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-2">
          {data.titulo}
        </h2>

        <p className="text-center font-bold text-lg md:text-xl mb-6">
          {data.subtitulo}
        </p>

        {/* ELECCIÓN */}
        <div className="mb-8 text-center">
          <p className="font-bold mb-4">
            Si mi familia ahorra para un paseo, yo elegiría:
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {data.opciones.map((op, i) => (
              <button
                key={i}
                onClick={() => {
                  setSeleccion(op);
                  setOtro("");
                }}
                className={`px-4 py-2 rounded-full font-bold ${
                  seleccion === op
                    ? "bg-alianza-azul text-white"
                    : "bg-gray-200"
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {/* OTRO */}
          <input
            type="text"
            placeholder="Otro..."
            value={otro}
            onChange={(e) => {
              setOtro(e.target.value);
              setSeleccion("");
            }}
            className="p-3 border-2 rounded-xl w-full max-w-md text-center"
          />
        </div>

        {/* DIBUJO PRINCIPAL */}
        <p className="text-center font-black text-lg mb-4">
          Dibuja el paseo elegido
        </p>

        <TipoDibujar
          storageKey={`act09-d1-${rango}`}
          onChange={(v) => setDibujos(prev => ({ ...prev, d1: v }))}
        />

        {/* TIPS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">

          <div className="flex-1">
            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black">
                {data.tips.titulo}
              </h3>
            </div>

            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold space-y-1">
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

        {/* FRASES */}
        {data.frases.map((f, i) => (
          <div key={i} className="mb-8 text-center">

            <p className="font-black mb-2">
              {f} ______
            </p>

            <input
              type="text"
              value={respuestas[`r${i + 1}`]}
              onChange={(e) =>
                setRespuestas(prev => ({
                  ...prev,
                  [`r${i + 1}`]: e.target.value
                }))
              }
              className="mb-4 p-3 border-2 rounded-xl w-full max-w-md text-center"
              placeholder="Escribe tu respuesta..."
            />

            <TipoDibujar
              storageKey={`act09-d${i + 2}-${rango}`}
              onChange={(v) =>
                setDibujos(prev => ({
                  ...prev,
                  [`d${i + 2}`]: v
                }))
              }
            />

          </div>
        ))}

        {/* IMAGEN FINAL */}
        <img
          src={data.recursos.imagenFinal}
          className="w-40 md:w-56 mx-auto mb-6"
        />

        {/* BOTÓN */}
        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isValid ? '¡Continuar!' : 'Completa la actividad'}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act09;