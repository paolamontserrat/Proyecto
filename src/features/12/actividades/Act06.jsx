import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const situaciones = config.situaciones || [];
    const columnas = config.columnas || ["Decisión buena", "Decisión mala"];

    // Respuestas seleccionadas por el usuario: { [situacionId]: "Decisión buena" | "Decisión mala" }
    const [respuestas, setRespuestas] = useState({});

    // --- Persistencia de Datos (Supabase + LocalStorage) ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act06-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar
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
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ respuestas: progreso.datos_actividad.respuestas })
                        );
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }

            // Fallback a LocalStorage
            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestas) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleSelectOption = async (id, columna) => {
        const nuevasRespuestas = { ...respuestas, [id]: columna };
        setRespuestas(nuevasRespuestas);
        localStorage.setItem(storageKey, JSON.stringify({ respuestas: nuevasRespuestas }));

        // Guardado en tiempo real
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: nuevasRespuestas, completado: false },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando avance temporal en Supabase", err);
            }
        }
    };

    const estaCompletoYCorrecto = () => {
        if (situaciones.length === 0) return false;
        return situaciones.every(
            (sit) => respuestas[sit.id] === sit.respuestaCorrecta
        );
    };

    const handleReset = async () => {
        setRespuestas({});
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: {}, completado: false },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar en Supabase", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!estaCompletoYCorrecto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas, completado: true },
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

    return (
        <LayoutActividad fondo={config.fondo}>
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

            {/* Tarjeta principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative" translate="no">
                
                {/* Título e Instrucciones */}
                <div className="text-center mb-6">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo}
                    </h1>
                    <p className="text-gray-700 font-bold mt-2 text-base md:text-lg">
                        {config.instrucciones}
                    </p>
                </div>

                {/* Tabla de clasificación */}
                <div className="max-w-4xl mx-auto overflow-x-auto bg-sky-50/50 p-3 md:p-6 rounded-3xl border-2 border-sky-100 shadow-inner">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="p-3 font-extrabold text-blue-950 text-base md:text-xl">
                                    Situación:
                                </th>
                                {columnas.map((col) => (
                                    <th key={col} className="p-3 text-center font-black text-purple-900 text-base md:text-xl italic w-28 md:w-36">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {situaciones.map((sit) => {
                                const seleccionUsuario = respuestas[sit.id];
                                const esCorrecto = seleccionUsuario === sit.respuestaCorrecta;

                                return (
                                    <tr key={sit.id} className="bg-white rounded-2xl shadow-sm hover:shadow transition">
                                        <td className="p-3 md:p-4 rounded-l-2xl font-bold text-gray-800 text-sm md:text-base border-y border-l border-gray-100 italic">
                                            {sit.texto}
                                        </td>
                                        {columnas.map((col, idx) => {
                                            const estaSeleccionado = seleccionUsuario === col;
                                            const esUltimaColumna = idx === columnas.length - 1;

                                            let colorBoton = "bg-lime-200 border-lime-300 hover:bg-lime-300";

                                            if (estaSeleccionado) {
                                                if (esCorrecto) {
                                                    colorBoton = "bg-blue-500 border-blue-600 text-white";
                                                } else {
                                                    colorBoton = "bg-red-500 border-red-600 text-white";
                                                }
                                            }

                                            return (
                                                <td
                                                    key={col}
                                                    className={`p-3 text-center border-y border-gray-100 ${
                                                        esUltimaColumna ? "rounded-r-2xl border-r" : ""
                                                    }`}
                                                >
                                                    <button
                                                        onClick={() => handleSelectOption(sit.id, col)}
                                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 font-black text-lg md:text-xl inline-flex items-center justify-center transition-all shadow-sm ${colorBoton}`}
                                                    >
                                                        {estaSeleccionado ? "X" : ""}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estaCompletoYCorrecto()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompletoYCorrecto()
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
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

export default Act06;