import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onComplete, onBack, rango }) => {
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

    const handleContinue = async () => {
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
                console.warn("Offline, guardado localmente", err);
            }
        }

        localStorage.setItem(`act10-${rango}-${userId}`, JSON.stringify({ completada: true }));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
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
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-5xl mx-auto space-y-8" translate="no">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-blue-900 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "Beneficios"}
                    </h1>
                </div>

                {/* Grid de 9 Imágenes (3x3) con mayor separación entre columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-8 md:gap-x-12 lg:gap-x-16 justify-items-center items-center py-6">
                    {imagenes.map((imgUrl, index) => (
                        <div 
                            key={index} 
                            className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-56 lg:h-56 rounded-full flex items-center justify-center p-1 hover:scale-105 transition-transform animate-float-slow"
                        >
                            <img 
                                src={imgUrl} 
                                alt={`Beneficio ${index + 1}`} 
                                className="w-full h-full object-contain select-none drop-shadow-md"
                            />
                        </div>
                    ))}
                </div>

                {/* Botón Continuar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act10;