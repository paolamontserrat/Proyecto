import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const seccionInter = config.seccionInteractiva || {};
    const preguntas = seccionInter.preguntas || [
        {
            id: "meta",
            enunciado: "Mi meta para este año es:",
            tipo: "text",
            placeholder: "Escribe tu meta aquí..."
        },
        {
            id: "importancia",
            enunciado: "¿Por qué es importante?",
            tipo: "text",
            placeholder: "Explica por qué es importante..."
        },
        {
            id: "dinero",
            enunciado: "¿Cuánto dinero necesito?",
            tipo: "number",
            placeholder: "Monto en $"
        },
        {
            id: "ahorro_mensual",
            enunciado: "¿Cuánto debo ahorrar al mes para lograrlo?",
            tipo: "number",
            placeholder: "Monto en $"
        }
    ];

    const [respuestas, setRespuestas] = useState({
        meta: "",
        importancia: "",
        dinero: "",
        ahorro_mensual: ""
    });

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act3-${rango}-${userId}`;

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
                    if (parsed.respuestas) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleInputChange = (id, valor) => {
        const nuevasRespuestas = { ...respuestas, [id]: valor };
        setRespuestas(nuevasRespuestas);
        localStorage.setItem(storageKey, JSON.stringify({ respuestas: nuevasRespuestas }));
    };

    // Validar que todas las preguntas contengan alguna respuesta válida
    const esValido = preguntas.every((p) => {
        const val = respuestas[p.id];
        return val !== undefined && val !== null && String(val).trim() !== "";
    });

    const handleReset = () => {
        const estadoInicial = {
            meta: "",
            importancia: "",
            dinero: "",
            ahorro_mensual: ""
        };
        setRespuestas(estadoInicial);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!esValido) return;

        const estadoGuardar = {
            respuestas,
            completado: true,
        };

        if (userId !== "anon" && config.id) {
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
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "DISEÑA TU PROYECTO PERSONAL"}
                    </h1>
                </div>

                {/* Formulario Interactivo */}
                <div className="max-w-2xl mx-auto space-y-6 pt-2">
                    <h2 className="text-xl md:text-2xl font-black text-blue-950">
                        {seccionInter.tituloPrincipal || "Diseña tu proyecto personal:"}
                    </h2>

                    <div className="space-y-5">
                        {preguntas.map((preg) => (
                            <div key={preg.id} className="space-y-2">
                                <label className="block font-bold text-blue-900 text-base md:text-lg">
                                    {preg.enunciado}
                                </label>
                                {preg.tipo === "number" ? (
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={respuestas[preg.id] || ""}
                                            onChange={(e) => handleInputChange(preg.id, e.target.value)}
                                            placeholder={preg.placeholder || "0"}
                                            className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-amber-400 outline-none font-bold text-blue-950 text-base md:text-lg bg-sky-50/50"
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        rows={2}
                                        value={respuestas[preg.id] || ""}
                                        onChange={(e) => handleInputChange(preg.id, e.target.value)}
                                        placeholder={preg.placeholder || "Escribe tu respuesta..."}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-amber-400 outline-none font-semibold text-blue-950 text-base bg-sky-50/50 resize-none"
                                    />
                                )}
                            </div>
                        ))}
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
                        disabled={!esValido}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esValido
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