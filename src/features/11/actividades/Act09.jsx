import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const imagenes = config.imagenes || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

    // Registrar lectura de la historieta
    useEffect(() => {
        const registrarLectura = async () => {
            localStorage.setItem(storageKey, JSON.stringify({ leido: true }));

            if (userId !== "anon" && config.id) {
                try {
                    await supabase.from("progreso_actividades").upsert(
                        {
                            usuario_id: userId,
                            actividad_id: config.id,
                            datos_actividad: { leido: true },
                            completada: true,
                        },
                        { onConflict: "usuario_id,actividad_id" }
                    );
                } catch (err) {
                    console.warn("Error al registrar lectura en Supabase", err);
                }
            }
        };

        registrarLectura();
    }, [config.id, userId, storageKey]);

    const handleContinue = async () => {
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
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative space-y-6" translate="no">
                
                {/* Encabezado */}
                <div className="text-center mb-4">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-3xl md:text-5xl tracking-wide uppercase">
                        {config.titulo || "HISTORIETA"}
                    </h1>
                </div>

                {/* Galería de la historieta */}
                <div className="max-w-3xl mx-auto space-y-6">
                    {imagenes.map((imgSrc, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden bg-sky-50/50">
                            <img
                                src={imgSrc}
                                alt={`Viñeta ${idx + 1}`}
                                className="w-full h-auto object-contain loading-lazy"
                            />
                        </div>
                    ))}
                </div>

                {/* Botón de Continuar Centrado */}
                <div className="flex justify-center max-w-xs mx-auto mt-8">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-full font-black text-xl shadow-lg bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95 transition-all"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;