import React, { useEffect, useState } from "react";

const GRID = 3;
const STORAGE_KEY = "act07Puzzle";

const PuzzleImagen = ({
  imagen,
  onCompletePuzzle,
  onResetPuzzle,
}) => {
  const [tablero, setTablero] = useState(
    Array(9).fill(null)
  );

  const [piezasDisponibles, setPiezasDisponibles] =
    useState([]);

  const [piezaSeleccionada, setPiezaSeleccionada] =
    useState(null);

  const [completado, setCompletado] =
    useState(false);

  const [cargado, setCargado] =
    useState(false);

  // ==========================
  // CARGAR PROGRESO
  // ==========================
  useEffect(() => {
    const guardado =
      localStorage.getItem(STORAGE_KEY);

    if (guardado) {
      try {
        const datos =
          JSON.parse(guardado);

        setTablero(
          datos.tablero ||
            Array(9).fill(null)
        );

        setPiezasDisponibles(
          datos.piezasDisponibles ||
            []
        );

        setCompletado(
          datos.completado || false
        );

        if (datos.completado) {
          onCompletePuzzle?.();
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      const piezas = [
        ...Array(9),
      ].map((_, i) => i);

      const mezcladas =
        [...piezas].sort(
          () => Math.random() - 0.5
        );

      setPiezasDisponibles(
        mezcladas
      );
    }

    setCargado(true);
  }, []);

  // ==========================
  // GUARDAR PROGRESO
  // ==========================
  useEffect(() => {
    if (!cargado) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tablero,
        piezasDisponibles,
        completado,
      })
    );
  }, [
    tablero,
    piezasDisponibles,
    completado,
    cargado,
  ]);

  const colocarPieza = (
    casilla
  ) => {
    if (completado) return;

    if (
      piezaSeleccionada === null
    )
      return;

    if (
      piezaSeleccionada !==
      casilla
    )
      return;

    const nuevoTablero = [
      ...tablero,
    ];

    nuevoTablero[casilla] =
      piezaSeleccionada;

    const nuevasDisponibles =
      piezasDisponibles.filter(
        (id) =>
          id !==
          piezaSeleccionada
      );

    setTablero(
      nuevoTablero
    );

    setPiezasDisponibles(
      nuevasDisponibles
    );

    setPiezaSeleccionada(
      null
    );

    try {
      const audio =
        new Audio(
          "/sounds/correct.mp3"
        );

      audio.play();
    } catch {}

    const puzzleCompleto =
      nuevoTablero.every(
        (pieza, index) =>
          pieza === index
      );

    if (puzzleCompleto) {
      setCompletado(true);
      onCompletePuzzle?.();
    }
  };

  const reiniciarPuzzle =
    () => {
      const piezas = [
        ...Array(9),
      ].map((_, i) => i);

      const mezcladas =
        [...piezas].sort(
          () => Math.random() - 0.5
        );

      setTablero(
        Array(9).fill(null)
      );

      setPiezasDisponibles(
        mezcladas
      );

      setPiezaSeleccionada(
        null
      );

      setCompletado(false);

      localStorage.removeItem(
        STORAGE_KEY
      );

      onResetPuzzle?.();
    };

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ESTADO */}

      <div
        className={`px-5 py-2 rounded-full font-bold text-white ${
          completado
            ? "bg-green-500"
            : "bg-yellow-500"
        }`}
      >
        {completado
          ? "✅ Completado"
          : `🧩 En progreso (${9 - piezasDisponibles.length}/9)`}
      </div>

      {/* TABLERO */}

      <div
        className="
          grid
          grid-cols-3
          gap-1
          bg-blue-700
          p-2
          rounded-2xl
        "
      >
        {[...Array(9)].map(
          (_, index) => (
            <button
              key={index}
              onClick={() =>
                colocarPieza(index)
              }
              className="
                w-24 h-24
                md:w-32 md:h-32
                bg-white
                border-2
                border-dashed
                rounded-lg
                overflow-hidden
                flex
                items-center
                justify-center
              "
            >
              {tablero[index] !==
              null ? (
                <div
                  className="
                    w-full
                    h-full
                    border-4
                    border-green-500
                  "
                  style={{
                    backgroundImage: `url(${imagen})`,
                    backgroundSize: `${GRID * 100}%`,
                    backgroundPosition: `${
                      -(index % GRID) *
                      100
                    }% ${
                      -Math.floor(
                        index / GRID
                      ) * 100
                    }%`,
                  }}
                />
              ) : (
                <span className="text-gray-400 text-2xl font-black">
                  ?
                </span>
              )}
            </button>
          )
        )}
      </div>

      {!completado && (
        <>
          <div className="text-center">
            <p className="font-bold text-alianza-azul">
              1. Toca una pieza
            </p>

            <p className="font-bold text-alianza-azul">
              2. Luego toca el lugar
              correcto
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-3
              gap-2
              max-w-md
            "
          >
            {piezasDisponibles.map(
              (piezaId) => (
                <button
                  key={piezaId}
                  onClick={() =>
                    setPiezaSeleccionada(
                      piezaId
                    )
                  }
                  className={`
                    w-24 h-24
                    md:w-32 md:h-32
                    rounded-lg
                    shadow-lg
                    border-4
                    transition-all
                    ${
                      piezaSeleccionada ===
                      piezaId
                        ? "border-yellow-400 scale-105"
                        : "border-white"
                    }
                  `}
                  style={{
                    backgroundImage: `url(${imagen})`,
                    backgroundSize: `${GRID * 100}%`,
                    backgroundPosition: `${
                      -(piezaId %
                        GRID) *
                      100
                    }% ${
                      -Math.floor(
                        piezaId /
                          GRID
                      ) * 100
                    }%`,
                  }}
                />
              )
            )}
          </div>
        </>
      )}

      <button
        onClick={
          reiniciarPuzzle
        }
        className="
          bg-red-500
          text-white
          px-6
          py-3
          rounded-full
          font-black
          shadow-lg
          hover:bg-red-600
          transition
        "
      >
        🔄 Reiniciar rompecabezas
      </button>
    </div>
  );
};

export default PuzzleImagen;