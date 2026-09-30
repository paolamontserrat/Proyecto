import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones tomadas directamente del JSON prop
    const brujulas = data?.brujulas || [];
    const compromiso = data?.compromiso;
    const fraseFinal = data?.fraseFinal;

    // Estados para las respuestas
    const [accionSeleccionada, setAccionSeleccionada] = useState("");
    const [respuestasPreguntas, setRespuestasPreguntas] = useState({});

    const [actividadCompletada, setActividadCompletada] = useState(false);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO (Supabase + LocalStorage)
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

                    if (progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.accionSeleccionada) setAccionSeleccionada(datos.accionSeleccionada);
                        if (datos.respuestasPreguntas) setRespuestasPreguntas(datos.respuestasPreguntas);
                        if (datos.actividadCompletada !== undefined) setActividadCompletada(datos.actividadCompletada);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.accionSeleccionada) setAccionSeleccionada(parsed.accionSeleccionada);
                        if (parsed.respuestasPreguntas) setRespuestasPreguntas(parsed.respuestasPreguntas);
                        if (parsed.actividadCompletada !== undefined) setActividadCompletada(parsed.actividadCompletada);
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
        if (cargandoProgreso) return;

        const datosAGuardar = {
            accionSeleccionada,
            respuestasPreguntas,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [accionSeleccionada, respuestasPreguntas, actividadCompletada, cargandoProgreso, storageKey]);

    // Manejadores de cambios
    const handleSeleccionarAccion = (opcion) => {
        setAccionSeleccionada(opcion);
        // Si elige "A partir de hoy me comprometo a:", auto-completamos la primera respuesta
        const nuevasRespuestas = {
            ...respuestasPreguntas,
            0: opcion
        };
        setRespuestasPreguntas(nuevasRespuestas);
        verificarCompletado(opcion, nuevasRespuestas);
    };

    const handlePreguntaChange = (index, valor) => {
        const nuevasRespuestas = {
            ...respuestasPreguntas,
            [index]: valor,
        };
        setRespuestasPreguntas(nuevasRespuestas);
        verificarCompletado(accionSeleccionada, nuevasRespuestas);
    };

    const verificarCompletado = (accion, respuestas) => {
        const totalPreguntas = compromiso?.preguntas?.length || 0;
        const respondidas = Object.values(respuestas).filter((val) => val && val.trim() !== "").length;

        if (accion !== "" || respondidas >= totalPreguntas) {
            setActividadCompletada(true);
        }
    };

    const handleReset = () => {
        setAccionSeleccionada("");
        setRespuestasPreguntas({});
        setActividadCompletada(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            accionSeleccionada,
            respuestasPreguntas,
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
                console.warn("Offline, guardado localmente", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo}>
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
            {/* Navegación Superior */}
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

            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-8" translate="no">

                {/* 1. SECCIÓN DE BRÚJULAS FINANCIERAS */}
                <div className="space-y-6">
                    <h1 className="text-2xl md:text-3xl font-black text-blue-950 text-center uppercase tracking-wide">
                        {data?.titulo}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                        {brujulas.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 shadow-sm"
                            >
                                <span className="text-3xl flex-shrink-0">{item.icono}</span>
                                <span className="font-extrabold text-blue-950 text-base md:text-lg">
                                    {item.texto}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Imagen principal interactiva si está definida */}
                    {data?.imagen && (
                        <div className="flex justify-center pt-2">
                            <img
                                src={data.imagen}
                                alt="Ilustración Brújulas"
                                className="w-56 md:w-72 object-contain drop-shadow-xl animate-float-slow"
                            />
                        </div>
                    )}
                </div>

                {/* 2. SECCIÓN DE COMPROMISO Y PREGUNTAS */}
                {compromiso && (
                    <div className="bg-amber-100/90 rounded-3xl p-6 md:p-8 border-4 border-amber-400 text-blue-950 space-y-6 shadow-xl">
                        <p className="font-black text-base md:text-lg leading-relaxed text-center md:text-left">
                            {compromiso.instruccion}
                        </p>

                        {/* Opciones Seleccionables */}
                        {compromiso.opciones && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {compromiso.opciones.map((opcion, idx) => {
                                    const seleccionada = accionSeleccionada === opcion;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSeleccionarAccion(opcion)}
                                            className={`text-left p-3.5 rounded-2xl font-bold text-sm md:text-base transition-all shadow ${
                                                seleccionada
                                                    ? "bg-amber-500 text-blue-950 ring-4 ring-blue-950 scale-102"
                                                    : "bg-white text-blue-950 hover:bg-yellow-100"
                                            }`}
                                        >
                                            • {opcion}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Preguntas de reflexión / Formulario */}
                        {compromiso.preguntas && (
                            <div className="space-y-4 pt-4 border-t border-amber-600/40">
                                {compromiso.preguntas.map((pregLabel, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <label className="block font-black text-sm md:text-base">
                                            {pregLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={respuestasPreguntas[idx] || ""}
                                            onChange={(e) => handlePreguntaChange(idx, e.target.value)}
                                            className="w-full bg-white text-blue-950 px-4 py-3 rounded-full font-semibold text-sm focus:outline-none focus:ring-4 focus:ring-blue-950 shadow"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. FRASE FINAL E IMAGEN DE CIERRE */}
                {fraseFinal && (
                    <div className="bg-blue-950 rounded-3xl p-6 md:p-8 text-white text-center space-y-6 shadow-xl border-4 border-yellow-400">
                        {fraseFinal.imagen2 && (
                            <div className="flex justify-center">
                                <img
                                    src={fraseFinal.imagen2}
                                    alt="Cierre Brújulas"
                                    className="w-48 md:w-64 object-contain drop-shadow-2xl animate-float-slow"
                                />
                            </div>
                        )}
                        <blockquote className="text-base md:text-xl font-black italic text-yellow-300 leading-relaxed max-w-2xl mx-auto">
                            {fraseFinal.fraseFinal}
                        </blockquote>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
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
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
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

export default Act11;