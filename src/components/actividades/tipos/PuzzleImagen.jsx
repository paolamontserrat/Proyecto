import React, { useEffect, useState } from "react";

const GRID = 3;

const PuzzleImagen = ({
  imagen,
  storageKey,
  onCompletePuzzle,
}) => {

  const [tablero, setTablero] = useState(Array(9).fill(null));
  const [piezasDisponibles, setPiezasDisponibles] = useState([]);
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
  const [completado, setCompletado] = useState(false);

  // =========================
  // SIEMPRE INICIA VACÍO VISUALMENTE
  // =========================
  useEffect(() => {
    const guardado = localStorage.getItem(storageKey);

    if (guardado) {
      const datos = JSON.parse(guardado);

      // SOLO guardamos estado lógico (no reconstruimos tablero visual)
      setCompletado(datos.completado || false);
    }

    // SIEMPRE NUEVO PUZZLE VISUAL
    const piezas = [...Array(9)].map((_, i) => i);
    const mezcladas = [...piezas].sort(() => Math.random() - 0.5);

    setPiezasDisponibles(mezcladas);
    setTablero(Array(9).fill(null));

  }, [storageKey]);

  // =========================
  // GUARDAR SOLO PROGRESO
  // =========================
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      completado
    }));
  }, [completado, storageKey]);

  // =========================
  // COLOCAR PIEZA
  // =========================
  const colocarPieza = (casilla) => {
    if (completado) return;
    if (piezaSeleccionada === null) return;
    if (piezaSeleccionada !== casilla) return;

    const nuevoTablero = [...tablero];
    nuevoTablero[casilla] = piezaSeleccionada;

    const nuevas = piezasDisponibles.filter(
      p => p !== piezaSeleccionada
    );

    setTablero(nuevoTablero);
    setPiezasDisponibles(nuevas);
    setPiezaSeleccionada(null);

    const listo = nuevoTablero.every((p, i) => p === i);

    if (listo) {
      setCompletado(true);
      localStorage.setItem(storageKey, JSON.stringify({ completado: true }));
      onCompletePuzzle?.();
    }
  };

  // =========================
  // REINICIAR (SIEMPRE LIMPIO)
  // =========================
  const reiniciar = () => {
    const piezas = [...Array(9)].map((_, i) => i);
    const mezcladas = [...piezas].sort(() => Math.random() - 0.5);

    setTablero(Array(9).fill(null));
    setPiezasDisponibles(mezcladas);
    setPiezaSeleccionada(null);
    setCompletado(false);

    localStorage.setItem(storageKey, JSON.stringify({ completado: false }));
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="flex flex-col items-center gap-6">

      {/* SIEMPRE VISIBLE (NO DESAPARECE) */}
      <div className={`px-5 py-2 rounded-full font-bold text-white ${
        completado ? "bg-green-500" : "bg-yellow-500"
      }`}>
        {completado ? "✅ Completado" : "🧩 Arma el rompecabezas"}
      </div>

      {/* TABLERO */}
      <div className="grid grid-cols-3 gap-1 bg-blue-700 p-2 rounded-2xl">

        {[...Array(9)].map((_, i) => (
          <button
            key={i}
            onClick={() => colocarPieza(i)}
            className="w-24 h-24 bg-white border rounded-lg flex items-center justify-center"
          >
            {tablero[i] !== null ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${imagen})`,
                  backgroundSize: "300%",
                  backgroundPosition: `${
                    -(i % GRID) * 100
                  }% ${
                    -Math.floor(i / GRID) * 100
                  }%`
                }}
              />
            ) : (
              "?"
            )}
          </button>
        ))}
      </div>

      {/* PIEZAS */}
      {!completado && (
        <div className="grid grid-cols-3 gap-2">
          {piezasDisponibles.map(p => (
            <button
              key={p}
              onClick={() => setPiezaSeleccionada(p)}
              className={`w-24 h-24 border-4 ${
                piezaSeleccionada === p
                  ? "border-yellow-400"
                  : "border-white"
              }`}
              style={{
                backgroundImage: `url(${imagen})`,
                backgroundSize: "300%",
                backgroundPosition: `${
                  -(p % GRID) * 100
                }% ${
                  -Math.floor(p / GRID) * 100
                }%`
              }}
            />
          ))}
        </div>
      )}

      {/* BOTÓN */}
      <button
        onClick={reiniciar}
        className="bg-red-500 text-white px-6 py-3 rounded-full font-black"
      >
        Reiniciar
      </button>
    </div>
  );
};

export default PuzzleImagen;