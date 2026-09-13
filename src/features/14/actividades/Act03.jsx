import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
    const [respuestas, setRespuestas] = useState({}); // { 1: { seleccion: 'MITO', correcta: true }, ... }
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
    const [mostrarExplicacion, setMostrarExplicacion] = useState(false);
    const [juegoTerminado, setJuegoTerminado] = useState(false);

    const seccionResultadoRef = useRef(null);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act03-${rango}-${userId}`;

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const { respuestasGuardadas, terminado } = progreso.datos_actividad;
                        if (respuestasGuardadas) setRespuestas(respuestasGuardadas);
                        if (terminado) {
                            setJuegoIniciado(true);
                            setJuegoTerminado(true);
                            setPreguntaActualIndex(config.actividad?.preguntas?.length || 0);
                        }
                        return;
                    }
                } catch (err) {
                    console.warn("Cargando desde LocalStorage...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestas) setRespuestas(parsed.respuestas);
                    if (parsed.terminado) {
                        setJuegoIniciado(true);
                        setJuegoTerminado(true);
                        setPreguntaActualIndex(config.actividad?.preguntas?.length || 0);
                    }
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const preguntas = config.actividad?.preguntas || [];
    const totalPreguntas = preguntas.length;
    const preguntaActual = preguntas[preguntaActualIndex];

    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
    };

    const handleSeleccion = (opcion) => {
        if (mostrarExplicacion) return;

        const esCorrecta = opcion === preguntaActual.respuestaCorrecta;
        setOpcionSeleccionada(opcion);
        setMostrarExplicacion(true);

        const nuevasRespuestas = {
            ...respuestas,
            [preguntaActual.id]: {
                seleccion: opcion,
                esCorrecta
            }
        };
        setRespuestas(nuevasRespuestas);
    };

    const handleSiguientePregunta = () => {
        setOpcionSeleccionada(null);
        setMostrarExplicacion(false);

        const siguienteIndex = preguntaActualIndex + 1;
        if (siguienteIndex < totalPreguntas) {
            setPreguntaActualIndex(siguienteIndex);
        } else {
            setJuegoTerminado(true);
            setTimeout(() => {
                seccionResultadoRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        }
    };

    const aciertos = Object.values(respuestas).filter((r) => r.esCorrecta).length;

    const handleReset = async () => {
        setJuegoIniciado(false);
        setPreguntaActualIndex(0);
        setRespuestas({});
        setOpcionSeleccionada(null);
        setMostrarExplicacion(false);
        setJuegoTerminado(false);

        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        const payload = {
            respuestas,
            aciertos,
            totalPreguntas,
            terminado: true,
            completado: true
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando progreso en Supabase", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fadeInDown 0.5s ease-out forwards;
                }
            `}</style>

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

            {/* Tarjeta Principal Vertical */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8 max-w-4xl mx-auto mb-10" translate="no">

                {/* ENCABEZADO Y REGLA CON ALIANZITO */}
                <div className="bg-sky-50 p-5 md:p-6 rounded-3xl border-2 border-sky-100 text-center space-y-3 relative">
                    <span className="bg-amber-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {config.imagenes?.alianzito && (
                            <img
                                src={config.imagenes.alianzito}
                                alt="Alianzito"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg animate-float-slow"
                            />
                        )}
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="font-extrabold text-blue-900 text-xl md:text-3xl uppercase tracking-wide">
                                {config.regla?.numero}: {config.regla?.titulo}
                            </h1>
                            <p className="text-amber-600 font-extrabold text-base md:text-lg">
                                "{config.regla?.subtitulo}"
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-700 font-medium text-sm md:text-base leading-relaxed max-w-2xl mx-auto pt-2">
                        {config.regla?.descripcion}
                    </p>
                </div>

                {/* BLOQUE IMPORTANCIA */}
                {config.importancia && (
                    <div className="bg-amber-50/80 p-5 rounded-3xl border border-amber-200 text-center space-y-1">
                        <span className="text-amber-800 font-black text-sm uppercase tracking-wide">
                            📌 {config.importancia.titulo}
                        </span>
                        <p className="text-gray-800 font-bold text-base md:text-lg">
                            {config.importancia.texto}
                        </p>
                    </div>
                )}

                {/* TITULO Y BANNER DE LA ACTIVIDAD */}
                <div className="bg-sky-50 border-2 border-sky-200 p-5 rounded-3xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {config.imagenes?.billete && (
                            <img
                                src={config.imagenes.billete}
                                alt="Ilustración"
                                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-bounce-gentle"
                            />
                        )}
                        <div>
                            <h2 className="text-blue-900 font-black text-lg md:text-xl uppercase">
                                🕵️‍♂️ {config.actividad?.titulo}
                            </h2>
                            <p className="text-gray-600 font-bold text-xs md:text-sm">
                                {config.actividad?.indicacion}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTÓN PREVIO PARA INICIAR */}
                {!juegoIniciado && !juegoTerminado && (
                    <div className="bg-sky-50/80 p-8 rounded-3xl border-3 border-sky-200 text-center space-y-5 animate-fade-in">
                        <h3 className="text-2xl font-black text-blue-900">
                            ¿Listo para descubrir la verdad?
                        </h3>
                        <p className="text-gray-700 font-bold text-base max-w-lg mx-auto">
                            Lee con atención cada afirmación y presiona si crees que es un MITO o una REALIDAD.
                        </p>
                        <button
                            onClick={handleIniciarJuego}
                            className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            🚀 ¡Iniciar Actividad!
                        </button>
                    </div>
                )}

                {/* CONTENEDOR DE AFIRMACIONES (DIAPOSITIVAS) */}
                {juegoIniciado && !juegoTerminado && preguntaActual && (
                    <div className="bg-sky-50/60 p-6 md:p-8 rounded-3xl border-3 border-sky-200 space-y-6 animate-fade-in shadow-md">

                        <div className="flex justify-between items-center border-b border-sky-200 pb-3">
                            <span className="bg-blue-900 text-white font-black px-4 py-1.5 rounded-full text-sm">
                                Afirmación {preguntaActualIndex + 1} de {totalPreguntas}
                            </span>
                        </div>

                        <div className="text-center space-y-4 py-2">
                            <h3 className="text-2xl md:text-3xl font-black text-blue-950 leading-snug max-w-2xl mx-auto">
                                "{preguntaActual.afirmacion}"
                            </h3>
                        </div>

                        {/* BOTONES MITO / REALIDAD */}
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                            <button
                                onClick={() => handleSeleccion("MITO")}
                                disabled={mostrarExplicacion}
                                className={`py-4 rounded-2xl font-black text-xl shadow-lg transition-all ${
                                    opcionSeleccionada === "MITO"
                                    ? opcionSeleccionada === preguntaActual.respuestaCorrecta
                                        ? "bg-amber-600 text-white border-3 border-sky-500"
                                        : "bg-amber-600 text-white border-3 border-red-500"
                                    : "bg-amber-400 hover:bg-amber-600 text-white hover:scale-105 active:scale-95 border-transparent"
                                } ${mostrarExplicacion && opcionSeleccionada !== "MITO" ? "opacity-50" : ""}`}
                            >
                                ❌ MITO
                            </button>

                            <button
                                onClick={() => handleSeleccion("REALIDAD")}
                                disabled={mostrarExplicacion}
                                className={`py-4 rounded-2xl font-black text-xl shadow-lg transition-all border-4 ${
                                    opcionSeleccionada === "REALIDAD"
                                    ? opcionSeleccionada === preguntaActual.respuestaCorrecta
                                        ? "bg-sky-700 text-white border-3 border-sky-500"
                                        : "bg-sky-700 text-white border-3 border-red-500"
                                    : "bg-sky-500 hover:bg-amber-600 text-white hover:scale-105 active:scale-95 border-transparent"
                                } ${mostrarExplicacion && opcionSeleccionada !== "REALIDAD" ? "opacity-50" : ""}`}
                                >
                                ✅ REALIDAD
                            </button>
                        </div>

                        {/* DESPLEGABLE CON LA EXPLICACIÓN */}
                        {mostrarExplicacion && (
                            <div className="bg-white p-6 rounded-2xl border-2 border-amber-300 space-y-4 animate-fade-in text-center shadow-inner">
                                <div className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                                    {opcionSeleccionada === preguntaActual.respuestaCorrecta ? "🎉 ¡Respuesta Correcta!" : "💡 Explicación"}
                                </div>

                                <p className="text-gray-800 font-bold text-base md:text-lg leading-relaxed">
                                    {preguntaActual.explicacion}
                                </p>

                                <button
                                    onClick={handleSiguientePregunta}
                                    className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-black text-lg rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
                                >
                                    {preguntaActualIndex + 1 < totalPreguntas ? "Siguiente Afirmación ➔" : "Ver Resultados Finales ➔"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN FINAL (RESULTADOS Y TIP FINANCIERO) */}
                {juegoTerminado && (
                    <div ref={seccionResultadoRef} className="space-y-8 animate-fade-in pt-4 border-t-2 border-sky-100">

                        <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-3 shadow-xl">
                            <h2 className="text-3xl md:text-4xl font-black text-sky-950 uppercase">
                                ¡COMPLETADO!
                            </h2>
                            <p className="text-lg font-bold text-sky-900">
                                Acertaste {aciertos} de {totalPreguntas} afirmaciones. ¡Ahora tienes un pensamiento crítico más fuerte!
                            </p>
                        </div>

                        {/* Tip Financiero */}
                        <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-3">
                            <span className="bg-blue-900 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>

                        {/* Habilidad Desbloqueada */}
                        <div className="bg-sky-50 border-2 border-sky-300 p-5 rounded-3xl text-center space-y-2 shadow-inner">
                            <span className="text-xs font-black text-sky-600 uppercase tracking-widest">
                                🔓 HABILIDAD DESBLOQUEADA
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-sky-800">
                                {config.tipFinanciero?.habilidad}
                            </h2>
                        </div>
                    </div>
                )}

                {/* ACCIONES FIJAS (REINICIAR Y CONTINUAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleFinalizar}
                        disabled={!juegoTerminado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !juegoTerminado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act03;