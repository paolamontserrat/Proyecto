import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const COMBINACIONES_GANADORAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntro = data?.secciones?.introduccion;
    const secJuego = data?.secciones?.juego;
    const secTip = data?.secciones?.tipFinanciero;

    const reglas = secJuego?.reglas || [];
    const preguntas = secJuego?.preguntas || [];

    // Estados del Juego
    const [tablero, setTablero] = useState(Array(9).fill(null));
    const [turno, setTurno] = useState("O"); // "O" = Usuario, "X" = Máquina
    const [casillaSeleccionada, setCasillaSeleccionada] = useState(null);
    const [preguntaActual, setPreguntaActual] = useState(null);
    const [ganador, setGanador] = useState(null); // "O", "X", "Empate"
    const [mostrarReglas, setMostrarReglas] = useState(false);
    const [mensajeAzarMaquina, setMensajeAzarMaquina] = useState("");
    const [actividadCompletada, setActividadCompletada] = useState(false);

    // Estado para controlar la carga inicial del progreso
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO (Supabase [si completada] -> LocalStorage -> Default)
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;

                // Paso 1: Consultar Supabase si hay usuario
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.completada && progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.tablero) setTablero(datos.tablero);
                        if (datos.ganador) setGanador(datos.ganador);
                        if (datos.actividadCompletada !== undefined) setActividadCompletada(datos.actividadCompletada);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                // Paso 2: Si no estaba completada en Supabase, intentar cargar desde LocalStorage
                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.tablero) setTablero(parsed.tablero);
                        if (parsed.ganador) setGanador(parsed.ganador);
                        if (parsed.actividadCompletada !== undefined) setActividadCompletada(parsed.actividadCompletada);
                        cargado = true;
                    }
                }
            } catch (err) {
                console.warn("Error al cargar progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // 2. GUARDADO AUTOMÁTICO EN LOCALSTORAGE
    useEffect(() => {
        if (cargandoProgreso || !data?.id) return;

        const datosAGuardar = {
            tablero,
            ganador,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [tablero, ganador, actividadCompletada, cargandoProgreso, storageKey, data?.id]);

    // LÓGICA DE GANADOR
    const verificarGanador = (tableroActual) => {
        for (let combo of COMBINACIONES_GANADORAS) {
            const [a, b, c] = combo;
            if (
                tableroActual[a] &&
                tableroActual[a] === tableroActual[b] &&
                tableroActual[a] === tableroActual[c]
            ) {
                return tableroActual[a];
            }
        }
        if (tableroActual.every((casilla) => casilla !== null)) {
            return "Empate";
        }
        return null;
    };

    // TURNO DE LA MÁQUINA (X)
    useEffect(() => {
        if (turno === "X" && !ganador) {
            const casillasVacias = tablero
                .map((val, idx) => (val === null ? idx : null))
                .filter((val) => val !== null);

            if (casillasVacias.length > 0) {
                const timer = setTimeout(() => {
                    const casillaAleatoria = casillasVacias[Math.floor(Math.random() * casillasVacias.length)];
                    const exitoMaquina = Math.random() < 0.5; // 50% de probabilidad verde / rojo

                    const nuevoTablero = [...tablero];
                    if (exitoMaquina) {
                        nuevoTablero[casillaAleatoria] = "X";
                    } else {
                        setMensajeAzarMaquina("La máquina se equivoco. Es tu turno");
                    }

                    setTablero(nuevoTablero);
                    const resultado = verificarGanador(nuevoTablero);
                    if (resultado) {
                        setGanador(resultado);
                        if (resultado === "O") setActividadCompletada(true);
                    } else {
                        setTurno("O");
                    }
                }, 1000);

                return () => clearTimeout(timer);
            }
        }
    }, [turno, tablero, ganador]);

    // MANEJAR CLIC EN CASILLA POR EL USUARIO (O)
    const handleCasillaClick = (index) => {
        if (tablero[index] !== null || turno !== "O" || ganador) return;

        setCasillaSeleccionada(index);
        setPreguntaActual(preguntas[index] || preguntas[0]);
        setMensajeAzarMaquina("");
    };

    // MANEJAR RESPUESTA DEL USUARIO
    const handleRespuesta = (opcionSeleccionada) => {
        const esCorrecta = opcionSeleccionada === preguntaActual.respuestaCorrecta;
        const nuevoTablero = [...tablero];

        if (esCorrecta) {
            // Respuesta correcta: coloca 'O' en la casilla
            nuevoTablero[casillaSeleccionada] = "O";
            setTablero(nuevoTablero);

            const resultado = verificarGanador(nuevoTablero);
            if (resultado) {
                setGanador(resultado);
                if (resultado === "O") setActividadCompletada(true);
            } else {
                setTurno("X"); // Pasa el turno a la máquina
            }
        } else {
            // Respuesta incorrecta: pierde la oportunidad, la casilla sigue libre y pasa el turno a la máquina
            setTurno("X");
        }

        setPreguntaActual(null);
        setCasillaSeleccionada(null);
    };

    const handleReset = () => {
        setTablero(Array(9).fill(null));
        setTurno("O");
        setCasillaSeleccionada(null);
        setPreguntaActual(null);
        setGanador(null);
        setMensajeAzarMaquina("");
        setActividadCompletada(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            tablero,
            ganador,
            actividadCompletada: true,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

        if (userId !== "anon" && data?.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: data.id,
                        datos_actividad: datosAGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado en LocalStorage", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo || "bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950"}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación superior */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="bg-blue-950 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-950 text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-8" translate="no">

                {/* 1. SECCIÓN INTRODUCCIÓN */}
                {secIntro && (
                    <div className="bg-blue-950 backdrop-blur-md rounded-3xl p-6 md:p-8 border-4 border-yellow-400 shadow-2xl text-white space-y-6">
                        <h1 className="text-2xl md:text-4xl font-black text-yellow-300 uppercase tracking-wide text-center drop-shadow-md">
                            {secIntro.titulo}
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* Ilustración de Alianzito */}
                            {secIntro.imagenEscudo && (
                                <div className="flex justify-center md:col-span-1">
                                    <img
                                        src={secIntro.imagenEscudo}
                                        alt="Escudo de Protección Financiera"
                                        className="w-48 md:w-56 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 animate-bounce-gentle"
                                    />
                                </div>
                            )}

                            {/* Mensaje General */}
                            <div className="md:col-span-2 space-y-4">
                                <p className="text-base md:text-lg text-yellow-300 font-extrabold leading-relaxed">
                                    {secIntro.mensajeGeneral}
                                </p>
                                <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed bg-blue-900/60 p-4 rounded-2xl border border-blue-700">
                                    {secIntro.mensajeDetalle}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SECCIÓN DEL JUEGO (3 EN RAYA) */}
                {secJuego && (
                    <div className="bg-amber-500 rounded-3xl p-5 md:p-8 border-4 border-white shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <h2 className="text-2xl md:text-3xl font-black text-blue-950 uppercase tracking-wide">
                                {secJuego.titulo}
                            </h2>
                        </div>

                        {/* Modal/Desplegable de Reglas */}
                            <div className="bg-blue-950 p-4 md:p-6 rounded-2xl border-2 border-yellow-400 text-xs md:text-sm text-blue-100 space-y-2">
                                <p className="font-extrabold text-yellow-300 uppercase tracking-wider text-sm mb-2">
                                    Instrucciones del Juego:
                                </p>
                                <ul className="list-disc list-inside space-y-1 font-medium">
                                    {reglas.map((regla, idx) => (
                                        <li key={idx}>{regla}</li>
                                    ))}
                                </ul>
                            </div>
                        

                        {/* Estado del Turno / Mensajes */}
                        {!ganador && (
                            <div className="text-center font-black text-base md:text-lg bg-blue-950/90 text-white p-3 rounded-2xl border-2 border-yellow-400 shadow">
                                {turno === "O" ? (
                                    <span className="text-blue-400">Tu turno (O): Haz clic en una casilla</span>
                                ) : (
                                    <span className="text-yellow-300 animate-pulse">Turno de la máquina (X)...</span>
                                )}
                            </div>
                        )}

                        {mensajeAzarMaquina && (
                            <div className="text-center text-xs md:text-sm font-black text-blue-950 bg-yellow-200 p-2.5 rounded-xl border-2 border-yellow-500">
                                {mensajeAzarMaquina}
                            </div>
                        )}

                        {/* TABLERO DE 3 EN RAYA */}
                        <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-xs md:max-w-sm mx-auto">
                            {tablero.map((valor, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleCasillaClick(idx)}
                                    disabled={valor !== null || turno !== "O" || ganador !== null}
                                    className={`h-24 md:h-28 text-4xl md:text-5xl font-black rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md border-4 ${
                                        valor === "O"
                                            ? "bg-yellow-600 text-white border-yellow-800 scale-100"
                                            : valor === "X"
                                            ? "bg-red-600 text-white border-red-800 scale-100"
                                            : "bg-blue-950 border-yellow-400 hover:bg-blue-900 hover:scale-105 active:scale-95 text-transparent cursor-pointer"
                                    }`}
                                >
                                    {valor}
                                </button>
                            ))}
                        </div>

                        {/* Fin del juego / Resultado */}
                        {ganador && (
                            <div className="text-center bg-blue-950 p-6 rounded-2xl border-4 border-yellow-400 space-y-3">
                                <h3 className="text-xl md:text-2xl font-black">
                                    {ganador === "O" && <span className="text-amber-400">¡Felicidades, ganaste! 🎉</span>}
                                    {ganador === "X" && <span className="text-red-400">¡Gana la máquina! Inténtalo otra vez. 🤖</span>}
                                    {ganador === "Empate" && <span className="text-yellow-300">¡Es un empate! 🤝</span>}
                                </h3>
                                <p className="text-xs md:text-sm text-blue-200">
                                    {ganador === "O"
                                        ? "Lograste proteger tu dinero y ganar la partida."
                                        : "Puedes reiniciar el tablero para conseguir la victoria."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL DE PREGUNTA EN TURNO DEL USUARIO */}
                {preguntaActual && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-blue-950 border-4 border-yellow-400 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-5 animate-bounce-gentle">
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-yellow-400 text-blue-950 border border-yellow-300">
                                Dificultad: {preguntaActual.dificultad}
                            </span>
                            
                            <h3 className="text-base md:text-lg font-extrabold text-white leading-snug">
                                {preguntaActual.pregunta}
                            </h3>

                            <div className="flex flex-col gap-3">
                                {preguntaActual.opciones.map((opcion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleRespuesta(opcion)}
                                        className="w-full bg-blue-800 hover:bg-yellow-400 hover:text-blue-950 text-white font-black py-3 px-4 rounded-xl transition-all border-2 border-blue-600 text-xs md:text-sm shadow-md"
                                    >
                                        {opcion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TIP FINANCIERO FINAL (SE DESBLOQUEA SI 'O' GANA O COMPLETA) */}
                {actividadCompletada && secTip && (
                    <section className="space-y-6">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTip.titulo}
                            </h2>

                            {secTip.imagen && (
                                <div className="flex justify-center">
                                    <img
                                        src={secTip.imagen}
                                        alt="Tip Financiero - Protección"
                                        className="w-56 md:w-72 object-contain drop-shadow-2xl animate-float-slow"
                                    />
                                </div>
                            )}

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTip.mensaje}
                            </p>
                        </div>
                    </section>
                )}

                {/* Botones Globales de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 max-w-4xl mx-auto">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!actividadCompletada}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !actividadCompletada
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;