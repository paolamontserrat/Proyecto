import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const escenas = config.escenas || [];
    const [completado, setCompletado] = useState(false);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

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

                    if (progreso?.completada) {
                        setCompletado(true);
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
                    if (parsed.completado) setCompletado(true);
                } catch (e) {
                    console.error("Error al cargar en LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleContinue = async () => {
        setCompletado(true);
        localStorage.setItem(storageKey, JSON.stringify({ completado: true }));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { completado: true },
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* Título */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "HISTORIA"}
                    </h1>
                </div>

                {/* Lista de todas las imágenes/escenas en una sola página */}
                <div className="space-y-6 max-w-3xl mx-auto">
                    {escenas.map((imgSrc, index) => (
                        <div
                            key={index}
                            className="bg-sky-50 p-4 md:p-6 rounded-3xl border-2 border-sky-200 shadow-md flex flex-col items-center gap-3 transition hover:shadow-lg"
                        >
                            <img
                                src={imgSrc}
                                alt={`Escena ${index + 1}`}
                                className="w-full h-auto rounded-2xl shadow-sm border border-sky-200 object-contain"
                            />
                        </div>
                    ))}
                </div>

                {/* Botón Finalizar */}
                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act12;