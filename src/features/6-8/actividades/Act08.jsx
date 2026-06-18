import React, { useState, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";

const Act08 = ({ data, onBack, onComplete }) => {
  const [jugadores, setJugadores] = useState(0);
  const [dado, setDado] = useState(null);
  const [piezas, setPiezas] = useState([]);

  const tableroRef = useRef(null);
  const [piezaActiva, setPiezaActiva] = useState(null);

  const colores = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500"
  ];

  const crearJugadores = (cantidad) => {
    const nuevasPiezas = [];

    for (let i = 0; i < cantidad; i++) {
      nuevasPiezas.push({
        id: i,
        x: 10 + i * 40,
        y: 10
      });
    }

    setJugadores(cantidad);
    setPiezas(nuevasPiezas);
  };

  const lanzarDado = () => {
    const numero = Math.floor(Math.random() * 6) + 1;
    setDado(numero);
  };

  const moverPieza = (id, clientX, clientY) => {
    if (!tableroRef.current) return;

    const tablero =
      tableroRef.current.getBoundingClientRect();

    const tamaño = window.innerWidth < 768 ? 32 : 48;

    const x = Math.max(
      0,
      Math.min(
        clientX - tablero.left - tamaño / 2,
        tablero.width - tamaño
      )
    );

    const y = Math.max(
      0,
      Math.min(
        clientY - tablero.top - tamaño / 2,
        tablero.height - tamaño
      )
    );

    setPiezas(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, x, y }
          : p
      )
    );
  };

  const reiniciar = () => {
    setJugadores(0);
    setDado(null);
    setPiezas([]);
  };

  return (
    <LayoutActividad fondo={data.recursos.fondo}>
      {/* BOTÓN REGRESAR */}

      <div className="mb-4">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL */}

      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* TÍTULO */}

        <h2 className="text-2xl md:text-4xl font-black text-center text-alianza-azul mb-6">
          {data.titulo}
        </h2>

        {/* INSTRUCCIONES */}

        <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl mb-8 text-center">
          {data.instrucciones.map((texto, index) => (
            <p
              key={index}
              className="font-bold text-gray-700 mb-2"
            >
              {texto}
            </p>
          ))}
        </div>

        {/* JUGADORES */}

        <div className="mb-8">
          <h3 className="text-center font-black text-lg mb-4">
            ¿Cuántos jugadores participarán?
          </h3>

          <div className="flex flex-wrap justify-center gap-3">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => crearJugadores(num)}
                className={`px-5 py-3 rounded-full font-black transition-all ${
                  jugadores === num
                    ? "bg-alianza-azul text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* DADO */}

        <div className="text-center mb-8">
          <button
            onClick={lanzarDado}
            className="bg-alianza-amarillo text-alianza-azul px-8 py-4 rounded-full font-black text-xl shadow-lg hover:scale-105 transition"
          >
            🎲 Lanzar dado
          </button>

          {dado && (
            <div className="mt-4">
              <p className="font-bold text-lg">
                Resultado
              </p>

              <div className="text-6xl font-black text-alianza-azul">
                {dado}
              </div>
            </div>
          )}
        </div>

        {/* TABLERO */}

        <div className="mb-8 flex justify-center">
          <div
            ref={tableroRef}
            className="relative inline-block w-full max-w-[800px]"
          >
            <img
              src={data.recursos.tablero}
              alt="Tablero"
              className="w-full h-auto rounded-2xl shadow-lg block"
              draggable={false}
            />

            {piezas.map((pieza, index) => (
              <div
                key={pieza.id}
                draggable
                onDragEnd={(e) =>
                  moverPieza(
                    pieza.id,
                    e.clientX,
                    e.clientY
                  )
                }
                onTouchStart={() =>
                  setPiezaActiva(pieza.id)
                }
                onTouchMove={(e) => {
                  if (piezaActiva !== pieza.id) return;

                  const touch = e.touches[0];

                  moverPieza(
                    pieza.id,
                    touch.clientX,
                    touch.clientY
                  );
                }}
                onTouchEnd={() =>
                  setPiezaActiva(null)
                }
                className="absolute cursor-move select-none touch-none"
                style={{
                  left: pieza.x,
                  top: pieza.y,
                  width: "clamp(32px, 5vw, 52px)",
                  height: "clamp(32px, 5vw, 52px)",
                  zIndex: 100
                }}
              >
                <div className="relative w-full h-full">
                  <img
                    src={data.recursos.pieza}
                    alt={`Jugador ${index + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  <div
                    className={`
                      absolute
                      -top-1
                      -right-1
                      w-5
                      h-5
                      md:w-6
                      md:h-6
                      rounded-full
                      text-white
                      text-[10px]
                      md:text-xs
                      font-black
                      flex
                      items-center
                      justify-center
                      shadow-lg
                      ${colores[index]}
                    `}
                  >
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REINICIAR */}

        <div className="text-center mb-6">
          <button
            onClick={reiniciar}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-black shadow hover:bg-red-600 transition"
          >
            Reiniciar partida
          </button>
        </div>

        {/* CONTINUAR */}

        <button
          onClick={onComplete}
          className="w-full py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-[1.02] transition"
        >
          ¡Continuar!
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act08;