import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntro = data?.secciones?.introduccion;
    const secJuego = data?.secciones?.juego;
    const secTip = data?.secciones?.tipFinanciero;

    const preguntas = secJuego?.preguntas || [];
    const tiempoLimite = secJuego?.tiempoPorPreguntaSegundos || 15;

    // Estados de la actividad
    const [juegoIniciado, setJuegoIniciado] = useState(false); // Estado para controlar si ya dio clic en Iniciar
    const [indicePregunta, setIndicePregunta] = useState(0);
    const [respuestasUsuario, setRespuestasUsuario] = useState({});
    const [tiempoRestante, setTiempoRestante] = useState(tiempoLimite);
    const [temporizadorActivo, setTemporizadorActivo] = useState(false);
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [actividadCompletada, setActividadCompletada] = useState(false);
    const [puntaje, setPuntaje] = useState(0);

    // Estado para controlar el estilo del borde de la pregunta tras responder
    // 'default' | 'correcta' | 'incorrecta'
    const [estadoRespuesta, setEstadoRespuesta] = useState("default");

    // Estado para la carga de progreso
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO (Supabase -> LocalStorage -> Default)
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;

                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.completada && progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.respuestasUsuario) setRespuestasUsuario(datos.respuestasUsuario);
                        if (datos.puntaje !== undefined) setPuntaje(datos.puntaje);
                        if (datos.juegoTerminado !== undefined) {
                            setJuegoTerminado(datos.juegoTerminado);
                            setJuegoIniciado(datos.juegoTerminado);
                        }
                        if (datos.actividadCompletada !== undefined) setActividadCompletada(datos.actividadCompletada);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.respuestasUsuario) setRespuestasUsuario(parsed.respuestasUsuario);
                        if (parsed.puntaje !== undefined) setPuntaje(parsed.puntaje);
                        if (parsed.juegoTerminado !== undefined) {
                            setJuegoTerminado(parsed.juegoTerminado);
                            setJuegoIniciado(parsed.juegoTerminado);
                        }
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

    // 2. GUARDADO EN LOCALSTORAGE
    useEffect(() => {
        if (cargandoProgreso || !data?.id) return;

        const datosAGuardar = {
            respuestasUsuario,
            puntaje,
            juegoTerminado,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [respuestasUsuario, puntaje, juegoTerminado, actividadCompletada, cargandoProgreso, storageKey, data?.id]);

    // 3. CONTROL DEL TEMPORIZADOR
    useEffect(() => {
        let interval = null;
        if (juegoIniciado && temporizadorActivo && tiempoRestante > 0 && !juegoTerminado) {
            interval = setInterval(() => {
                setTiempoRestante((prev) => prev - 1);
            }, 1000);
        } else if (tiempoRestante === 0 && temporizadorActivo && !juegoTerminado) {
            // Se agota el tiempo: respuesta incorrecta
            procesarRespuesta(null);
        }

        return () => clearInterval(interval);
    }, [juegoIniciado, temporizadorActivo, tiempoRestante, juegoTerminado]);

    // Iniciar el juego al dar clic en el botón
    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
        setTiempoRestante(tiempoLimite);
        setTemporizadorActivo(true);
        setEstadoRespuesta("default");
    };

    // Iniciar temporizador al avanzar a la siguiente pregunta
    const siguientePregunta = () => {
        if (indicePregunta + 1 < preguntas.length) {
            setIndicePregunta((prev) => prev + 1);
            setTiempoRestante(tiempoLimite);
            setTemporizadorActivo(true);
            setEstadoRespuesta("default");
        } else {
            setJuegoTerminado(true);
            setActividadCompletada(true);
        }
    };

    // MANEJAR RESPUESTA DE USUARIO
    const procesarRespuesta = (valorSeleccionado) => {
        if (!temporizadorActivo) return; // Evita clics dobles

        setTemporizadorActivo(false);

        const preguntaActual = preguntas[indicePregunta];
        const esCorrecta = valorSeleccionado === preguntaActual.respuestaCorrecta;

        // Si es incorrecta -> Borde Amber/Ámbar, Si es correcta -> Borde Verde
        setEstadoRespuesta(esCorrecta ? "correcta" : "incorrecta");

        const nuevasRespuestas = {
            ...respuestasUsuario,
            [preguntaActual.id]: {
                seleccion: valorSeleccionado,
                correcta: esCorrecta,
            },
        };

        setRespuestasUsuario(nuevasRespuestas);

        if (esCorrecta) {
            setPuntaje((prev) => prev + 1);
        }

        // Breve pausa para mostrar la retroalimentación visual del borde antes de avanzar
        setTimeout(() => {
            siguientePregunta();
        }, 700);
    };

    const handleReset = () => {
        setJuegoIniciado(false);
        setIndicePregunta(0);
        setRespuestasUsuario({});
        setTiempoRestante(tiempoLimite);
        setTemporizadorActivo(false);
        setJuegoTerminado(false);
        setActividadCompletada(false);
        setPuntaje(0);
        setEstadoRespuesta("default");
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            respuestasUsuario,
            puntaje,
            juegoTerminado: true,
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

    const preguntaActualObj = preguntas[indicePregunta];

    // Clases dinámicas de borde según si es correcta o incorrecta (amber)
    const getEstiloBorde = () => {
        if (estadoRespuesta === "incorrecta") {
            return "border-amber-500 bg-amber-50 shadow-amber-300";
        }
        if (estadoRespuesta === "correcta") {
            return "border-blue-500 bg-blue-50 shadow-blue-300";
        }
        return "border-red-400 bg-white shadow-xl";
    };

    return (
        <LayoutActividad fondo={data?.fondo || "bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600"}>
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
                        <h1 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase tracking-wide text-center drop-shadow-md">
                            {secIntro.titulo}
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {secIntro.imagenAlianzito && (
                                <div className="flex justify-center md:col-span-1">
                                    <img
                                        src={secIntro.imagenAlianzito}
                                        alt="Alianzito Imprevistos"
                                        className="w-48 md:w-56 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 animate-bounce-gentle"
                                    />
                                </div>
                            )}

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

                {/* 2. SECCIÓN JUEGO */}
                {secJuego && (
                    <div className="bg-blue-900 rounded-3xl p-5 md:p-8 border-4 border-yellow-400 shadow-2xl space-y-6 text-white">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase tracking-wide">
                                {secJuego.titulo}
                            </h2>
                            <p className="text-xs md:text-sm font-medium text-blue-100">
                                {secJuego.instrucciones}
                            </p>
                        </div>

                        {/* PANTALLA PREVIA: BOTÓN INICIAR */}
                        {!juegoIniciado && !juegoTerminado && (
                            <div className="text-center py-8 space-y-6 bg-blue-950 p-6 rounded-3xl border-2 border-yellow-400 max-w-lg mx-auto">
                                <p className="text-sm md:text-base font-bold text-yellow-300">
                                    ¿Estás listo para responder? Tendrás {tiempoLimite} segundos por cada afirmación.
                                </p>
                                <button
                                    onClick={handleIniciarJuego}
                                    className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xl px-8 py-4 rounded-full border-4 border-yellow-200 shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    🚀 ¡Iniciar Actividad!
                                </button>
                            </div>
                        )}

                        {/* JUEGO ACTIVO */}
                        {juegoIniciado && !juegoTerminado && preguntaActualObj && (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                {/* Indicador de Progreso y Temporizador */}
                                <div className="flex justify-between items-center bg-blue-950 p-4 rounded-2xl border-2 border-yellow-400 shadow">
                                    <span className="text-xs md:text-sm font-extrabold text-yellow-300">
                                        Pregunta {indicePregunta + 1} de {preguntas.length}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-blue-200">⏱️ Tiempo:</span>
                                        <span
                                            className={`text-lg font-black px-3 py-1 rounded-full transition-all ${
                                                tiempoRestante <= 5
                                                    ? "bg-red-600 text-white animate-ping"
                                                    : "bg-yellow-400 text-blue-950"
                                            }`}
                                        >
                                            {tiempoRestante}s
                                        </span>
                                    </div>
                                </div>

                                {/* Tarjeta de Afirmación con borde dinámico (Verde / Amber) */}
                                <div
                                    className={`text-blue-950 p-6 md:p-8 rounded-3xl border-8 transition-all duration-300 min-h-[140px] flex items-center justify-center ${getEstiloBorde()}`}
                                >
                                    <p className="text-base md:text-xl font-black leading-snug">
                                        "{preguntaActualObj.afirmacion}"
                                    </p>
                                </div>

                                {/* Botones VERDADERO / FALSO */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => procesarRespuesta(true)}
                                        disabled={!temporizadorActivo}
                                        className="bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-lg md:text-xl border-4 border-blue-950 shadow-lg hover:scale-102 active:scale-98 transition-all"
                                    >
                                        VERDADERO
                                    </button>
                                    <button
                                        onClick={() => procesarRespuesta(false)}
                                        disabled={!temporizadorActivo}
                                        className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-lg md:text-xl border-4 border-red-950 shadow-lg hover:scale-102 active:scale-98 transition-all"
                                    >
                                        FALSO
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* RESUMEN FINAL */}
                        {juegoTerminado && (
                            <div className="bg-blue-950 p-6 rounded-3xl border-4 border-yellow-400 space-y-4 text-center">
                                <h3 className="text-2xl md:text-3xl font-black text-yellow-300">
                                    ¡Actividad Completada! 🎉
                                </h3>
                                <p className="text-lg font-bold text-white">
                                    Obtuviste <span className="text-yellow-300 text-2xl font-black">{puntaje}</span> de <span className="text-2xl font-black">{preguntas.length}</span> respuestas correctas.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TIP FINANCIERO FINAL */}
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
                                        alt="Tip Financiero - Auto"
                                        className="w-64 md:w-80 object-contain drop-shadow-2xl animate-float-slow"
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

export default Act09;