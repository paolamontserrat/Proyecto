import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const pasos = config.pasos || [];
    const seccionMeta = config.seccionMeta || {};

    const [miMeta, setMiMeta] = useState("");

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act7-${rango}-${userId}`;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad?.miMeta) {
                        setMiMeta(progreso.datos_actividad.miMeta);
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleReset = () => {
        setMiMeta("");
    };

    const esValido = miMeta.trim().length > 0;

    const handleContinue = async () => {
        if (!esValido) return;

        const payload = {
            miMeta: miMeta.trim(),
            fechaCompleto: new Date().toISOString(),
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando avance en Supabase", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8 min-w-0 box-border"
                translate="no"
            >
                {/* ENCABEZADO */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide">
                        {config.titulo}
                    </h1>
                    {config.subtitulo && (
                        <span className="inline-block bg-blue-900 text-amber-400 px-6 py-2 rounded-full font-black text-lg sm:text-2xl shadow-md">
                            {config.subtitulo}
                        </span>
                    )}
                </div>

                {/* SECUENCIA DE PASOS */}
                <div className="space-y-6">
                    {pasos.map((paso) => (
                        <div
                            key={paso.numero}
                            className={`p-4 sm:p-6 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-center gap-6 shadow-sm ${
                                paso.numero === 5
                                    ? "bg-blue-900 border-blue-900 text-white"
                                    : "bg-sky-50 border-sky-200"
                            }`}
                        >
                            {paso.imagen && (
                                <img
                                    src={paso.imagen}
                                    alt={`Paso ${paso.numero}`}
                                    className="w-40 sm:w-48 h-auto object-contain shrink-0"
                                />
                            )}
                            <div
                                className={`flex-1 space-y-2 ${
                                    paso.numero === 5 ? "text-center" : "text-center md:text-left"
                                }`}
                            >
                                <span className="inline-block px-4 py-1 rounded-full font-black text-base sm:text-lg bg-amber-400 text-blue-950">
                                    Paso {paso.numero}
                                </span>
                                <p
                                    className={`font-bold text-lg sm:text-2xl leading-relaxed ${
                                        paso.numero === 5 ? "text-amber-300" : "text-blue-900"
                                    }`}
                                >
                                    {paso.texto}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SECCIÓN MENCIONA TU META */}
                {seccionMeta && (
                    <div className="bg-sky-50 p-6 sm:p-8 rounded-3xl border-2 border-sky-200 text-center space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900 uppercase">
                            {seccionMeta.titulo}
                        </h2>

                        <div className="space-y-4">
                            <textarea
                                rows={3}
                                placeholder={seccionMeta.placeholder || "Escribe tu meta aquí..."}
                                value={miMeta}
                                onChange={(e) => setMiMeta(e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-sky-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-blue-950 font-bold text-base sm:text-xl shadow-inner outline-none transition-all bg-white resize-none"
                            />
                        </div>

                        {seccionMeta.imagen && (
                            <div className="flex justify-center pt-2">
                                <img
                                    src={seccionMeta.imagen}
                                    alt="Alianzito corriendo hacia la meta"
                                    className="w-full max-w-sm h-auto object-contain rounded-2xl"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* BOTONES DE REINICIAR Y CONTINUAR (GRID) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-10">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esValido}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-amber-400 text-blue-950 hover:scale-102 active:scale-98 cursor-pointer"
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