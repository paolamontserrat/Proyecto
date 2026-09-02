import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const preguntas = config.preguntas || [];
    const TIEMPO_INICIAL = config.tiempoPorPregunta || 10;

    const [indiceActual, setIndiceActual] = useState(0);
    const [respuestas, setRespuestas] = useState({});
    const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_INICIAL);
    const [pantallaFinal, setPantallaFinal] = useState(false);
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

    const timerRef = useRef(null);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.respuestas) {
                        setRespuestas(progreso.datos_actividad.respuestas);
                        if (progreso.completada) {
                            setPantallaFinal(true);
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
                    if (parsed.completado) setPantallaFinal(true);
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    // Lógica del Temporizador de 10 segundos por pregunta
    useEffect(() => {
        if (pantallaFinal || opcionSeleccionada !== null) return;

        setTiempoRestante(TIEMPO_INICIAL);

        timerRef.current = setInterval(() => {
            setTiempoRestante((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleRespuesta(null); // Tiempo agotado
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [indiceActual, pantallaFinal, opcionSeleccionada]);

    const handleRespuesta = (valor) => {
        clearInterval(timerRef.current);
        setOpcionSeleccionada(valor);

        const preguntaActual = preguntas[indiceActual];
        const esCorrecta = valor === preguntaActual.respuestaCorrecta;

        const nuevasRespuestas = {
            ...respuestas,
            [preguntaActual.id]: {
                seleccion: valor,
                esCorrecta,
                tiempoAgotado: valor === null
            }
        };

        setRespuestas(nuevasRespuestas);

        setTimeout(() => {
            setOpcionSeleccionada(null);
            if (indiceActual < preguntas.length - 1) {
                setIndiceActual((prev) => prev + 1);
            } else {
                guardarFinalizacion(nuevasRespuestas);
            }
        }, 1500);
    };

    const guardarFinalizacion = async (respuestasFinales) => {
        setPantallaFinal(true);

        const payload = { respuestas: respuestasFinales, completado: true };
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
    };

    const handleReiniciar = async () => {
        setIndiceActual(0);
        setRespuestas({});
        setPantallaFinal(false);
        setOpcionSeleccionada(null);
        setTiempoRestante(TIEMPO_INICIAL);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: {}, completado: false },
                        completada: false
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar progreso", err);
            }
        }
    };

    const preguntaActual = preguntas[indiceActual];
    const aciertos = Object.values(respuestas).filter((r) => r.esCorrecta).length;

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes pulse-fast {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 0.6s infinite;
                }
            `}</style>

            {/* Navegación superior */}
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

            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-6 max-w-3xl mx-auto" translate="no">
                
                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-3xl uppercase tracking-wide">
                        {config.titulo || "Zona de Crítica: ¿Es Solidaridad o no?"}
                    </h1>
                    <p className="text-gray-600 font-bold text-sm md:text-base">
                        {config.instrucciones}
                    </p>
                </div>

                {!pantallaFinal && preguntaActual ? (
                    <div className="space-y-6">
                        {/* Barra de estado: Pregunta x de N y Temporizador */}
                        <div className="flex justify-between items-center bg-sky-50 p-4 rounded-2xl border border-sky-200">
                            <span className="font-extrabold text-blue-900 text-base md:text-lg">
                                Pregunta {indiceActual + 1} de {preguntas.length}
                            </span>

                            {/* Reloj de 10 segundos */}
                            <div className={`flex items-center gap-2 font-black text-xl px-4 py-1 rounded-full ${
                                tiempoRestante <= 3
                                    ? "bg-red-500 text-white animate-pulse-fast"
                                    : "bg-yellow-400 text-blue-950"
                            }`}>
                                <span>⏱</span>
                                <span>{tiempoRestante}s</span>
                            </div>
                        </div>

                        {/* Tarjeta de la Afirmación */}
                        <div className="bg-amber-400/90 text-blue-950 p-6 rounded-3xl font-extrabold text-lg md:text-2xl text-center shadow-md leading-relaxed min-h-[140px] flex items-center justify-center">
                            "{preguntaActual.afirmacion}"
                        </div>

                        {/* Botones de Respuesta */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={() => handleRespuesta(true)}
                                disabled={opcionSeleccionada !== null}
                                className={`py-5 rounded-2xl font-black text-xl md:text-2xl shadow-lg transition-all ${
                                    opcionSeleccionada === true
                                        ? preguntaActual.respuestaCorrecta === true
                                            ? "bg-blue-500 text-white scale-105"
                                            : "bg-red-500 text-white"
                                        : "bg-blue-900 hover:bg-blue-950 text-white hover:scale-102 active:scale-98"
                                }`}
                            >
                                VERDADERO
                            </button>

                            <button
                                onClick={() => handleRespuesta(false)}
                                disabled={opcionSeleccionada !== null}
                                className={`py-5 rounded-2xl font-black text-xl md:text-2xl shadow-lg transition-all ${
                                    opcionSeleccionada === false
                                        ? preguntaActual.respuestaCorrecta === false
                                            ? "bg-blue-500 text-white scale-105"
                                            : "bg-red-500 text-white"
                                        : "bg-sky-400 hover:bg-sky-500 text-blue-950 hover:scale-102 active:scale-98"
                                }`}
                            >
                                FALSO
                            </button>
                        </div>

                        {/* Mensaje de retroalimentación inmediata */}
                        {opcionSeleccionada !== null && (
                            <div className="text-center font-black text-lg animate-bounce">
                                {opcionSeleccionada === preguntaActual.respuestaCorrecta ? (
                                    <span className="text-blue-600">¡Correcto! 👏</span>
                                ) : (
                                    <span className="text-red-500">
                                        {opcionSeleccionada === null ? "¡Se agotó el tiempo! ⌛" : "¡Incorrecto! ❌"}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Pantalla de Resultados */
                    <div className="text-center space-y-6 py-6">
                        <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-3">
                            <h2 className="text-2xl md:text-3xl font-black text-blue-900">
                                ¡Reto Completado! 🎉
                            </h2>
                            <p className="text-xl font-bold text-gray-700">
                                Obtuviste <span className="text-amber-600 text-3xl font-black">{aciertos}</span> de{" "}
                                <span className="text-blue-900 text-3xl font-black">{preguntas.length}</span> aciertos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={handleReiniciar}
                                className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md transition-all"
                            >
                                Reiniciar
                            </button>

                            <button
                                onClick={onComplete}
                                className="py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98 shadow-lg transition-all"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </LayoutActividad>
    );
};

export default Act09;