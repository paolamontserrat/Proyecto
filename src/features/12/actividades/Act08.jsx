import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const pasos = config.pasos || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    const handleContinue = async () => {
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { leido: true, completado: true },
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase, aplicando fallback local", err);
            }
        }
        localStorage.setItem(storageKey, JSON.stringify({ leido: true }));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 3.5s ease-in-out infinite;
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

            {/* Tarjeta Contenedora Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10 max-w-4xl mx-auto" translate="no">
                
                {/* Título */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl uppercase tracking-wide">
                        {config.titulo || "Caso de Estudio: El Torneo de la Secundaria"}
                    </h1>
                </div>

                {/* Pasos / Cronología de la historia */}
                <div className="space-y-10">
                    {pasos.map((paso, index) => (
                        <div
                            key={paso.id || index}
                            className="bg-sky-50/60 p-5 md:p-7 rounded-3xl border-2 border-sky-100 shadow-sm space-y-6"
                        >
                            {/* Imagen representativa */}
                            {paso.imagen && (
                                <div className="overflow-hidden rounded-2xl shadow-md border-2 border-white max-h-[420px] flex justify-center items-center bg-gray-100">
                                    <img
                                        src={paso.imagen}
                                        alt={`Paso ${index + 1}`}
                                        className="w-full object-cover h-auto max-h-[420px]"
                                    />
                                </div>
                            )}

                            {/* Texto descriptivo */}
                            <div className="space-y-3">
                                <p className="text-gray-800 font-semibold text-base md:text-xl leading-relaxed text-center md:text-left">
                                    {paso.texto}
                                </p>

                                {/* Conclusión destacada si existe */}
                                {paso.conclusion && (
                                    <div className="bg-blue-900 text-yellow-300 p-4 rounded-2xl text-center font-extrabold text-lg md:text-xl shadow-inner mt-4">
                                        {paso.conclusion}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón de Acción */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98 shadow-lg transition-all mx-auto block"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;