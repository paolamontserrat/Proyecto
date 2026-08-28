import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const FILAS = 6;
const COLUMNAS = 7;
const JUGADOR = "RED"; // Usuario (Rojo)
const BOT = "YELLOW"; // Bot (Amarillo)

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    // Tablero inicial 6x7 relleno con null
    const [tablero, setTablero] = useState(() =>
        Array(FILAS).fill(null).map(() => Array(COLUMNAS).fill(null))
    );
    const [turno, setTurno] = useState(JUGADOR);
    const [ganador, setGanador] = useState(null); // 'RED', 'YELLOW', 'EMPATE', o null
    const [movimientosCount, setMovimientosCount] = useState(0);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act0-${rango}-${userId}`;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id !== undefined) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const d = progreso.datos_actividad;
                        if (d.tablero) setTablero(d.tablero);
                        if (d.turno) setTurno(d.turno);
                        if (d.ganador !== undefined) setGanador(d.ganador);
                        if (d.movimientosCount) setMovimientosCount(d.movimientosCount);
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.tablero) setTablero(parsed.tablero);
                    if (parsed.turno) setTurno(parsed.turno);
                    if (parsed.ganador !== undefined) setGanador(parsed.ganador);
                    if (parsed.movimientosCount) setMovimientosCount(parsed.movimientosCount);
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Verificar si 4 fichas están alineadas
    const verificarVictoria = (grid, ficha) => {
        // Horizontal
        for (let r = 0; r < FILAS; r++) {
            for (let c = 0; c < COLUMNAS - 3; c++) {
                if (grid[r][c] === ficha && grid[r][c + 1] === ficha && grid[r][c + 2] === ficha && grid[r][c + 3] === ficha) {
                    return true;
                }
            }
        }
        // Vertical
        for (let r = 0; r < FILAS - 3; r++) {
            for (let c = 0; c < COLUMNAS; c++) {
                if (grid[r][c] === ficha && grid[r + 1][c] === ficha && grid[r + 2][c] === ficha && grid[r + 3][c] === ficha) {
                    return true;
                }
            }
        }
        // Diagonal Positiva (/)
        for (let r = 3; r < FILAS; r++) {
            for (let c = 0; c < COLUMNAS - 3; c++) {
                if (grid[r][c] === ficha && grid[r - 1][c + 1] === ficha && grid[r - 2][c + 2] === ficha && grid[r - 3][c + 3] === ficha) {
                    return true;
                }
            }
        }
        // Diagonal Negativa (\)
        for (let r = 0; r < FILAS - 3; r++) {
            for (let c = 0; c < COLUMNAS - 3; c++) {
                if (grid[r][c] === ficha && grid[r + 1][c + 1] === ficha && grid[r + 2][c + 2] === ficha && grid[r + 3][c + 3] === ficha) {
                    return true;
                }
            }
        }
        return false;
    };

    const estaLleno = (grid) => {
        return grid[0].every((celda) => celda !== null);
    };

    // Obtener la primera fila disponible de una columna
    const obtenerFilaDisponible = (grid, col) => {
        for (let r = FILAS - 1; r >= 0; r--) {
            if (grid[r][col] === null) return r;
        }
        return -1;
    };

    // Soltar una ficha en el tablero
    const soltarFicha = (grid, col, ficha) => {
        const fila = obtenerFilaDisponible(grid, col);
        if (fila === -1) return null;

        const nuevoTablero = grid.map((r) => [...r]);
        nuevoTablero[fila][col] = ficha;
        return { nuevoTablero, fila };
    };

    // Lógica del Bot (Dificultad Media)
    const turnoBot = (grid) => {
        const columnasValidas = [];
        for (let c = 0; c < COLUMNAS; c++) {
            if (grid[0][c] === null) columnasValidas.push(c);
        }

        if (columnasValidas.length === 0) return;

        // 1. Intentar Ganar
        for (let c of columnasValidas) {
            const res = soltarFicha(grid, c, BOT);
            if (res && verificarVictoria(res.nuevoTablero, BOT)) {
                ejecutarMovimiento(c, BOT);
                return;
            }
        }

        // 2. Bloquear al Jugador si va a ganar
        for (let c of columnasValidas) {
            const res = soltarFicha(grid, c, JUGADOR);
            if (res && verificarVictoria(res.nuevoTablero, JUGADOR)) {
                ejecutarMovimiento(c, BOT);
                return;
            }
        }

        // 3. Preferir columnas centrales (3, 2, 4, 1, 5, 0, 6)
        const preferenciaCentral = [3, 2, 4, 1, 5, 0, 6];
        for (let c of preferenciaCentral) {
            if (columnasValidas.includes(c)) {
                // Evitar darle al jugador una jugada ganadora directamente encima
                const resBot = soltarFicha(grid, c, BOT);
                if (resBot) {
                    const filaArriba = resBot.fila - 1;
                    if (filaArriba >= 0) {
                        const tempGrid = resBot.nuevoTablero.map((r) => [...r]);
                        tempGrid[filaArriba][c] = JUGADOR;
                        if (verificarVictoria(tempGrid, JUGADOR)) {
                            continue; // Evita esta columna si beneficia al jugador en el siguiente turno
                        }
                    }
                }
                ejecutarMovimiento(c, BOT);
                return;
            }
        }

        // 4. Si ninguna opción estratégica aplica, elegir una columna válida al azar
        const colAzar = columnasValidas[Math.floor(Math.random() * columnasValidas.length)];
        ejecutarMovimiento(colAzar, BOT);
    };

    // Ejecutar colocación de ficha
    const ejecutarMovimiento = (col, jugadorActual) => {
        const resultado = soltarFicha(tablero, col, jugadorActual);
        if (!resultado) return;

        const { nuevoTablero } = resultado;
        setTablero(nuevoTablero);
        setMovimientosCount((prev) => prev + 1);

        const haGanado = verificarVictoria(nuevoTablero, jugadorActual);
        const lleno = estaLleno(nuevoTablero);

        let nuevoGanador = null;
        let siguienteTurno = jugadorActual === JUGADOR ? BOT : JUGADOR;

        if (haGanado) {
            nuevoGanador = jugadorActual;
            setGanador(nuevoGanador);
        } else if (lleno) {
            nuevoGanador = "EMPATE";
            setGanador("EMPATE");
        } else {
            setTurno(siguienteTurno);
        }

        // Guardar estado
        const estadoGuardar = {
            tablero: nuevoTablero,
            turno: siguienteTurno,
            ganador: nuevoGanador,
            movimientosCount: movimientosCount + 1,
        };
        localStorage.setItem(storageKey, JSON.stringify(estadoGuardar));
    };

    // Manejar clic del usuario
    const handleClickColumna = (col) => {
        if (ganador || turno !== JUGADOR || tablero[0][col] !== null) return;
        ejecutarMovimiento(col, JUGADOR);
    };

    // Efecto para activar el turno del Bot tras una breve pausa
    useEffect(() => {
        if (turno === BOT && !ganador) {
            const timer = setTimeout(() => {
                turnoBot(tablero);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [turno, ganador, tablero]);

    // Reiniciar juego
    const handleReset = () => {
        const nuevoTablero = Array(FILAS).fill(null).map(() => Array(COLUMNAS).fill(null));
        setTablero(nuevoTablero);
        setTurno(JUGADOR);
        setGanador(null);
        setMovimientosCount(0);
        localStorage.removeItem(storageKey);
    };

    // Guardar avance al completar
    const handleContinue = async () => {
        if (ganador !== JUGADOR) return;

        const estadoGuardar = {
            tablero,
            ganador,
            completado: true,
        };

        if (userId !== "anon" && config.id !== undefined) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-azul-oscuro text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-6" translate="no">

                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "4 EN LÍNEA"}
                    </h1>
                    <p className="text-gray-700 font-bold text-base md:text-lg">
                        {config.subtitulo || "Consigue conectar 4 fichas rojas antes que el bot."}
                    </p>
                </div>

                {/* Indicador de Estado / Turno */}
                <div className="flex justify-center items-center gap-4 text-center">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border-2 border-slate-300 font-extrabold text-sm md:text-base">
                        <span>Tú:</span>
                        <div className="w-5 h-5 rounded-full bg-red-500 shadow-inner"></div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border-2 border-slate-300 font-extrabold text-sm md:text-base">
                        <span>Bot:</span>
                        <div className="w-5 h-5 rounded-full bg-amber-400 shadow-inner"></div>
                    </div>
                </div>

                {/* Mensajes de Resultado */}
                {ganador && (
                    <div className="text-center animate-bounce">
                        {ganador === JUGADOR && (
                            <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-900 p-4 rounded-2xl font-black text-xl max-w-md mx-auto shadow-md">
                                ¡Felicidades! Le has ganado al bot 🔴🎉
                            </div>
                        )}
                        {ganador === BOT && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-900 p-4 rounded-2xl font-black text-xl max-w-md mx-auto shadow-md">
                                ¡El bot ha ganado! Inténtalo de nuevo 🟡🤖
                            </div>
                        )}
                        {ganador === "EMPATE" && (
                            <div className="bg-yellow-100 border-2 border-yellow-500 text-yellow-900 p-4 rounded-2xl font-black text-xl max-w-md mx-auto shadow-md">
                                ¡Empate técnico! 🤝
                            </div>
                        )}
                    </div>
                )}

                {/* Tablero de Juego 6x7 */}
                <div className="max-w-md mx-auto bg-blue-900 p-3 md:p-5 rounded-3xl border-4 border-blue-950 shadow-2xl">
                    {/* Botones de soltar ficha arriba de cada columna */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                        {Array(COLUMNAS).fill(null).map((_, colIdx) => (
                            <button
                                key={colIdx}
                                disabled={ganador !== null || turno !== JUGADOR || tablero[0][colIdx] !== null}
                                onClick={() => handleClickColumna(colIdx)}
                                className={`h-8 md:h-10 rounded-xl font-black text-white flex items-center justify-center transition-all ${
                                    tablero[0][colIdx] === null && !ganador && turno === JUGADOR
                                        ? "bg-amber-400 hover:bg-amber-300 text-blue-950 active:scale-95 cursor-pointer shadow-md"
                                        : "bg-blue-950/40 opacity-30 cursor-not-allowed"
                                }`}
                            >
                                ↓
                            </button>
                        ))}
                    </div>

                    {/* Matriz de celdas */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2 bg-blue-950 p-2 rounded-2xl">
                        {tablero.map((fila, rIdx) =>
                            fila.map((celda, cIdx) => (
                                <div
                                    key={`${rIdx}-${cIdx}`}
                                    onClick={() => handleClickColumna(cIdx)}
                                    className="aspect-square bg-blue-900 rounded-full p-1 border-2 border-blue-950 flex items-center justify-center cursor-pointer"
                                >
                                    <div
                                        className={`w-full h-full rounded-full transition-all duration-300 shadow-inner ${
                                            celda === JUGADOR
                                                ? "bg-red-500 border-2 border-red-700 scale-100"
                                                : celda === BOT
                                                ? "bg-amber-400 border-2 border-amber-600 scale-100"
                                                : "bg-blue-950/60 scale-90"
                                        }`}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Botones de Acción (Reiniciar y Completar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={ganador !== JUGADOR}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            ganador !== JUGADOR
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Coninuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act01;



// {
//       "id": 1,
//       "fondo": "/images/10/Fondo.png",
//       "titulo": "ACTIVIDAD 0: 4 EN LÍNEA",
//       "subtitulo": "¡Demuestra tu estrategia! Juega contra el bot y sé el primero en conectar 4 fichas.",
//       "filas": 6,
//       "columnas": 7
//     }