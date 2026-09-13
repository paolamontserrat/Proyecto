import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const rondas = config.rondas || [];
    const imagenes = config.imagenes || [];

    const [rondaActualIndex, setRondaActualIndex] = useState(0);
    const [respuestasUsuario, setRespuestasUsuario] = useState({});
    const [feedback, setFeedback] = useState(null); // { tipo: 'exito' | 'error', mensaje: string }
    const [juegoCompletado, setJuegoCompletado] = useState(false);

    // Persistencia
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act07-${rango}-${userId}`;

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

                    if (progreso) {
                        if (progreso.completada || progreso.datos_actividad?.completado) {
                            setJuegoCompletado(true);
                            setRondaActualIndex(rondas.length - 1);
                            return;
                        }
                        if (progreso.datos_actividad?.respuestas) {
                            setRespuestasUsuario(progreso.datos_actividad.respuestas);
                            if (progreso.datos_actividad.rondaIndex !== undefined) {
                                setRondaActualIndex(progreso.datos_actividad.rondaIndex);
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Error cargando progreso desde Supabase", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.completado) {
                        setJuegoCompletado(true);
                    }
                    if (parsed.respuestas) {
                        setRespuestasUsuario(parsed.respuestas);
                    }
                    if (parsed.rondaIndex !== undefined) {
                        setRondaActualIndex(parsed.rondaIndex);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, rondas.length, storageKey, userId]);

    const rondaActual = rondas[rondaActualIndex] || rondas[0];

    const handleSeleccionarOpcion = (opcion) => {
        if (juegoCompletado && rondaActualIndex === rondas.length - 1) return;

        if (opcion.esMentira) {
            const nuevasRespuestas = {
                ...respuestasUsuario,
                [rondaActual.id]: opcion.id,
            };
            setRespuestasUsuario(nuevasRespuestas);
            setFeedback({
                tipo: "exito",
                mensaje: "¡Excelente detective! Encontraste la mentira.",
            });

            const siguienteIndex = rondaActualIndex + 1;
            const esUltima = siguienteIndex >= rondas.length;

            const datosProgreso = {
                respuestas: nuevasRespuestas,
                rondaIndex: esUltima ? rondaActualIndex : siguienteIndex,
                completado: esUltima,
            };

            localStorage.setItem(storageKey, JSON.stringify(datosProgreso));

            setTimeout(() => {
                setFeedback(null);
                if (esUltima) {
                    setJuegoCompletado(true);
                } else {
                    setRondaActualIndex(siguienteIndex);
                }
            }, 2200);
        } else {
            setFeedback({
                tipo: "error",
                mensaje: "Esa afirmación es VERDADERA. ¡Sigue investigando para hallar la mentira!",
            });
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    const handleReset = () => {
        setRondaActualIndex(0);
        setRespuestasUsuario({});
        setJuegoCompletado(false);
        setFeedback(null);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!juegoCompletado) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: respuestasUsuario, completado: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, progreso guardado localmente", err);
            }
        }
        onComplete();
    };

    if (!rondas.length) {
        return (
            <LayoutActividad fondo={config.fondo}>
                <div className="text-center py-12">
                    <p className="text-gray-500 font-bold text-xl">Cargando actividad...</p>
                </div>
            </LayoutActividad>
        );
    }

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                .animate-float-slow {
                    animation: float-slow 4.5s ease-in-out infinite;
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

            {/* Contenedor Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative overflow-visible" translate="no">
                
                {/* ENCABEZADO DE REGLA */}
                <div className="bg-sky-50 p-5 md:p-6 rounded-3xl border-2 border-sky-100 text-center space-y-3 relative mb-6">
                    <span className="bg-amber-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {imagenes[0] && (
                            <img
                                src={imagenes[0]}
                                alt="Detective Alianzito"
                                className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg animate-float-slow"
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

                {/* INDICACIÓN DE ACTIVIDAD Y NAVEGACIÓN DE RONDAS */}
                <div className="text-center mb-6 max-w-2xl mx-auto space-y-2">
                    {imagenes[1] && (
                            <img
                                src={imagenes[1]}
                                alt="Ilustración"
                                className="w-28 h-28 md:w-32 md:h-32 object-contain animate-bounce-gentle animate-float-slow justify-center mx-auto mb-2"
                            />
                    )}
                    <h2 className="text-xl md:text-2xl font-black text-blue-950 uppercase">
                        🔍 {config.actividad?.titulo}
                    </h2>
                    <p className="text-gray-600 font-semibold text-sm md:text-base">
                        {config.actividad?.indicacion}
                    </p>

                    {/* Barra de Progreso de Rondas */}
                    <div className="flex justify-center items-center gap-2 pt-3">
                        {rondas.map((ronda, idx) => {
                            const resuelto = respuestasUsuario[ronda.id] !== undefined;
                            const esActual = idx === rondaActualIndex && !juegoCompletado;
                            return (
                                <button
                                    key={ronda.id}
                                    onClick={() => {
                                        if (resuelto || juegoCompletado) setRondaActualIndex(idx);
                                    }}
                                    className={`px-3 py-1 rounded-full font-black text-xs md:text-sm transition-all ${
                                        esActual
                                            ? "bg-amber-400 text-blue-950 ring-2 ring-amber-500 scale-105"
                                            : resuelto
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                    Ronda {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FEEDBACK POPUP TEMPORAL */}
                {feedback && (
                    <div className={`text-center py-3 px-6 rounded-2xl font-black text-sm md:text-base mb-6 animate-bounce ${
                        feedback.tipo === "exito" ? "bg-sky-100 text-sky-800 border-2 border-sky-400" : "bg-red-100 text-red-800 border-2 border-red-400"
                    }`}>
                        {feedback.mensaje}
                    </div>
                )}

                {/* TARJETA DE CASO ABIERTO / RONDA ACTUAL */}
                {!juegoCompletado ? (
                    <div className="bg-amber-50/60 border-2 border-amber-200 rounded-3xl p-5 md:p-8 max-w-3xl mx-auto shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-amber-200 pb-3">
                            <span className="font-extrabold text-amber-900 text-lg uppercase tracking-wider">
                                📂 Caso Abierto — {rondaActual.titulo}
                            </span>
                            <span className="text-xs font-black bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
                                Encuentra la Mentira 🕵️‍♂️
                            </span>
                        </div>

                        <div className="space-y-3 pt-2">
                            {rondaActual.opciones.map((opcion) => {
                                const seleccionada = respuestasUsuario[rondaActual.id] === opcion.id;
                                return (
                                    <button
                                        key={opcion.id}
                                        onClick={() => handleSeleccionarOpcion(opcion)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-sm md:text-base transition-all flex items-start gap-4 ${
                                            seleccionada
                                                ? "bg-sky-500 text-white border-sky-600 shadow-lg scale-98"
                                                : "bg-white text-gray-800 border-amber-100 hover:border-amber-400 hover:bg-amber-100/50 shadow-xs"
                                        }`}
                                    >
                                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black ${
                                            seleccionada ? "bg-white text-sky-700" : "bg-amber-200 text-amber-900"
                                        }`}>
                                            {opcion.id}
                                        </span>
                                        <span className="pt-1 leading-relaxed">{opcion.texto}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* PANTALLA DE JUEGO COMPLETADO */
                    <div className="space-y-6 max-w-3xl mx-auto pt-4 animate-fade-in">
                        <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-3 shadow-xl">
                            <h2 className="text-2xl md:text-3xl font-black text-sky-900 uppercase">
                                ¡Caso Resuelto, Detective! 🎉
                            </h2>
                            <p className="text-base md:text-lg font-bold text-sky-950">
                                Desenmascaraste todas las mentiras financieras exitosamente.
                            </p>
                        </div>

                        {/* TIP FINANCIERO */}
                        <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-3">
                            <span className="bg-blue-900 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!juegoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !juegoCompletado
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

export default Act07;