import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';

const Act06 = ({ data, onComplete, onBack, rango }) => {

  const storageKey = `act06-${rango}`;

  const [opciones, setOpciones] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState({});
  const [resultado, setResultado] = useState(null);

  // 🔀 Mezclar opciones SIN romper React
  const mezclar = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // 🔥 Cargar estado guardado o inicial
  useEffect(() => {
    const guardado = JSON.parse(localStorage.getItem(storageKey));

    if (guardado) {
      setOpciones(guardado.opciones);
      setSeleccionadas(guardado.seleccionadas);
      setResultado(guardado.resultado);
    } else {
      setOpciones(mezclar(data.opciones));
    }
  }, []);

  // 💾 Guardar automáticamente
  useEffect(() => {
    if (opciones.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        opciones,
        seleccionadas,
        resultado
      }));
    }
  }, [opciones, seleccionadas, resultado]);

  // ✅ Seleccionar opción
  const toggleSeleccion = (id) => {
    setSeleccionadas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 🧠 Validar respuestas
  const validar = () => {
    let correctas = true;

    data.opciones.forEach(op => {
      const marcada = !!seleccionadas[op.id];
      if (marcada !== op.correcta) {
        correctas = false;
      }
    });

    setResultado(correctas);
  };

  // 🔄 Reiniciar
  const reiniciar = () => {
    const nuevas = mezclar(data.opciones);
    setOpciones(nuevas);
    setSeleccionadas({});
    setResultado(null);
  };

  const completado = resultado === true;

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
      <div className="bg-white/90 p-6 md:p-10 rounded-3xl shadow-xl border-4 border-alianza-amarillo">

        {/* TÍTULO */}
        <h2 className="text-2xl md:text-3xl font-black text-center text-alianza-azul mb-6">
          Encuentra las decisiones inteligentes
        </h2>

        <p className="text-center font-bold mb-6">
          Marca con X las buenas decisiones:
        </p>

        {/* OPCIONES */}
        <div className="space-y-3 mb-6">
          {opciones.map((op) => (
            <div
              key={op.id} // 🔥 CLAVE CORRECTA
              onClick={() => toggleSeleccion(op.id)}
              className={`p-3 rounded-xl border-2 cursor-pointer flex justify-between items-center transition
                ${seleccionadas[op.id] ? 'bg-yellow-100 border-yellow-500' : 'bg-white'}
              `}
            >
              <span>{op.texto}</span>

              {seleccionadas[op.id] && (
                <span className="font-black text-xl notranslate">X</span>
              )}
            </div>
          ))}
        </div>

        {/* BOTONES VALIDAR / REINICIAR */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={validar}
            className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold"
          >
            Validar
          </button>

          <button
            onClick={reiniciar}
            className="flex-1 bg-red-400 text-white py-2 rounded-full font-bold"
          >
            Reiniciar
          </button>
        </div>

        {/* RESULTADO */}
        {resultado !== null && (
          <div className={`text-center font-black mb-6 text-lg ${
            resultado ? 'text-green-600' : 'text-red-600'
          }`}>
            {resultado
              ? '¡Muy bien! Elegiste correctamente 👏'
              : 'Revisa tus respuestas e inténtalo otra vez ❌'}
          </div>
        )}
         {/* IMAGEN ESQUINA */}
        <img 
          src={data.recursos.imagenDecorativa}
          className="w-50 ml-center mb-6"
        />

        {/* BOTÓN AVANZAR */}
        <button
          onClick={onComplete}
          disabled={!completado}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            completado
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {completado ? '¡Continuar!' : 'Completa correctamente'}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act06;