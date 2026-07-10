import React, { useState } from 'react';

const CapturarCoordenadas = ({ imagen = `/images/9-12/3.png`, total = 5 }) => {

  const [puntos, setPuntos] = useState([]);

  const handleClick = (e) => {
    const rect = e.target.getBoundingClientRect();

    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const nuevo = { x, y, radio: 30 };

    const nuevos = [...puntos, nuevo];
    setPuntos(nuevos);

    console.clear();
    console.log("📍 Coordenadas:");
    console.log(JSON.stringify(nuevos, null, 2));
  };

  return (
    <div className="flex flex-col items-center">

      <h2 className="text-2xl font-bold mb-4">
        Da clic en cada diferencia
      </h2>

      <div className="relative">
        <img
          src={imagen = `/images/9-12/3.png`}
          onClick={handleClick}
          className="w-[300px] cursor-crosshair"
        />

        {/* 🔴 DIBUJAR PUNTOS */}
        {puntos.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - p.radio,
              top: p.y - p.radio,
              width: p.radio * 2,
              height: p.radio * 2,
              borderRadius: '50%',
              border: '2px solid red'
            }}
          />
        ))}
      </div>

      <p className="mt-4 font-bold">
        {puntos.length} / {total} capturadas
      </p>

      <button
        onClick={() => setPuntos([])}
        className="mt-4 bg-gray-300 px-4 py-2 rounded"
      >
        Reiniciar
      </button>

    </div>
  );
};

export default CapturarCoordenadas;