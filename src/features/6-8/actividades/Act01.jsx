import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import TipoDibujar from '../../../components/actividades/tipos/TipoDibujar';

const Act01 = ({ data, onComplete, onBack, rango }) => {

  // Validación
  const [tieneDibujo, setTieneDibujo] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validar automáticamente
  useEffect(() => {
    setIsValid(tieneDibujo);
  }, [tieneDibujo]);

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

      {/* CONTENIDO */}
      <div className="bg-white/90 p-5 md:p-8 rounded-3xl shadow-lg mb-6 text-center" translate="no">
        
        <h2 className="text-xl md:text-3xl font-black text-alianza-azul mb-4 uppercase">
          {data.titulo}
        </h2>

        <p className="text-sm md:text-lg text-gray-700 mb-6 whitespace-pre-line">
          {data.contenido}
        </p>

        {/* IMAGEN 8 */}
        <img 
          src={data.recursos.imagen1} 
          className="w-full max-w-md mx-auto mb-4"
          alt="imagen 1"
        />

        {/* IMAGEN 7 */}
        <img 
          src={data.recursos.imagen2} 
          className="w-full max-w-md mx-auto mb-6"
          alt="imagen 2"
        />
      </div>

      {/* ACTIVIDAD */}
      <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
        
        <h3 className="text-lg md:text-xl font-black text-center text-alianza-azul mb-4">
          {data.actividad}
        </h3>

        {/* DIBUJO */}
        <TipoDibujar 
          storageKey={`dibujo-${rango}-1`}
          onChange={(valor) => setTieneDibujo(valor)}
        />

        {/* BOTÓN FINAL */}
        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid 
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isValid ? '¡Listo!' : 'Dibuja para continuar'}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act01;