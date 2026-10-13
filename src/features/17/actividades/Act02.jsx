import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const [respuestas, setRespuestas] = useState({});
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
    const storageKey = `act02-${rango}-${userId}`;

    // 1. Cargar datos de LocalStorage / Supabase
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
                        if (datos.respuestas) setRespuestas(datos.respuestas);
                        if (datos.actividadCompletada !== undefined) {
                            setActividadCompletada(datos.actividadCompletada);
                        }

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.respuestas) setRespuestas(parsed.respuestas);
                        if (parsed.actividadCompletada !== undefined) {
                            setActividadCompletada(parsed.actividadCompletada);
                        }
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

    // 2. Guardar en LocalStorage cada cambio
    useEffect(() => {
        if (cargandoProgreso) return;

        const datosAGuardar = {
            respuestas,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [respuestas, actividadCompletada, cargandoProgreso, storageKey]);

    const handleSeleccionarOpcion = (preguntaId, opcion) => {
        const nuevasRespuestas = {
            ...respuestas,
            [preguntaId]: opcion,
        };
        setRespuestas(nuevasRespuestas);

        const totalPreguntas = data?.preguntas?.length || 0;
        if (Object.keys(nuevasRespuestas).length >= totalPreguntas) {
            setActividadCompletada(true);
        }
    };

    const handleReset = () => {
        setRespuestas({});
        setActividadCompletada(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            respuestas,
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

    const getEstilosBoton = (color, seleccionado) => {
        if (!seleccionado) {
            return "bg-white text-blue-950 border-blue-900/30 hover:bg-amber-100";
        }

        switch (color) {
            case "rojo":
                return "bg-red-600 text-white border-red-800 scale-102 ring-4 ring-red-400";
            case "amarillo":
                return "bg-amber-500 text-blue-950 border-amber-700 scale-102 ring-4 ring-amber-300 font-black";
            case "verde":
                return "bg-emerald-600 text-white border-emerald-800 scale-102 ring-4 ring-emerald-400";
            default:
                return "bg-blue-950 text-white";
        }
    };

    const getIconoSemaforo = (color) => {
        switch (color) {
            case "rojo":
                return "🔴";
            case "amarillo":
                return "🟡";
            case "verde":
                return "🟢";
            default:
                return "⚪";
        }
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

            {/* CONTENEDOR PRINCIPAL ÁMBAR CON BORDE AZUL */}
            <div className="bg-amber-400/95 p-6 md:p-10 rounded-3xl border-4 border-alianza-azul shadow-2xl space-y-8 max-w-3xl mx-auto text-blue-950 backdrop-blur-md" translate="no">

                {/* Título e Instrucción */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl md:text-3xl font-black text-blue-950 uppercase tracking-wide drop-shadow-sm">
                        {data?.titulo}
                    </h1>
                    {data?.instruccion && (
                        <p className="text-base md:text-lg font-bold text-blue-900 max-w-2xl mx-auto">
                            {data.instruccion}
                        </p>
                    )}
                </div>

                {/* Preguntas tipo Check */}
                <div className="space-y-6">
                    {data?.preguntas?.map((preg) => {
                        const respSeleccionada = respuestas[preg.id];

                        return (
                            <div
                                key={preg.id}
                                className="bg-amber-50 p-5 md:p-6 rounded-2xl border-3 border-blue-950 shadow-md space-y-4"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    {preg.imagen && (
                                        <img
                                            src={preg.imagen}
                                            alt={`Icono pregunta ${preg.id}`}
                                            className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-full border-2 border-blue-950 bg-white p-1 shadow-sm"
                                        />
                                    )}
                                    <h3 className="font-extrabold text-lg md:text-xl text-blue-950 text-center md:text-left flex-1">
                                        {preg.pregunta}
                                    </h3>
                                </div>

                                {/* Opciones Semaforizadas */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {preg.opciones.map((opc, idx) => {
                                        const seleccionado = respSeleccionada?.texto === opc.texto;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSeleccionarOpcion(preg.id, opc)}
                                                className={`py-3 px-4 rounded-xl font-black text-sm md:text-base border-2 transition-all shadow ${getEstilosBoton(
                                                    opc.color,
                                                    seleccionado
                                                )}`}
                                            >
                                                {getIconoSemaforo(opc.color)} {opc.texto}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Leyenda del semáforo seleccionada */}
                                {respSeleccionada && (
                                    <div className="mt-2 p-3 rounded-xl bg-blue-950 text-white border border-blue-900 text-center animate-fade-in shadow">
                                        <p className="font-extrabold text-sm md:text-base text-amber-300">
                                            Sugerencia: "{data?.mensajesSemaforo?.[respSeleccionada.color]}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Texto / Reflexión Final (Aparece cuando ya se respondió todo) */}
                {actividadCompletada && data?.textoFinal && (
                    <div className="bg-blue-950 text-white p-6 rounded-2xl border-4 border-amber-300 space-y-3 font-medium shadow-xl">
                        <h4 className="font-black text-lg md:text-xl text-amber-300 uppercase border-b border-blue-800 pb-2">
                            Al final:
                        </h4>
                        {data.textoFinal.map((parrafo, idx) => (
                            <p key={idx} className="text-sm md:text-base leading-relaxed text-blue-100">
                                {parrafo}
                            </p>
                        ))}
                    </div>
                )}

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!actividadCompletada}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all uppercase ${
                            !actividadCompletada
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul border-2 border-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act02;