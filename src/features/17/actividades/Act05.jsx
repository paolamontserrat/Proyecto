import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act05-${rango}-${userId}`;

    // Finalizar y avanzar a la siguiente actividad
    const handleContinue = async () => {
            const payload = { leido: true, fecha: new Date().toISOString() };
    
            if (userId !== "anon" && data?.id) {
                try {
                    await supabase
                        .from("progreso_actividades")
                        .upsert(
                            {
                                usuario_id: userId,
                                actividad_id: data.id,
                                datos_actividad: payload,
                                completada: true,
                            },
                            {
                                onConflict: "usuario_id,actividad_id",
                            }
                        );
                } catch (err) {
                    console.warn("Offline, guardado localmente", err);
                }
            }
    
            localStorage.setItem(storageKey, JSON.stringify(payload));
            onComplete();
        };

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
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

            {/* Contenedor Principal Informativo (Pares/Tarjetas Blancas) */}
            <div className="bg-blue-900 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl text-white space-y-8 max-w-3xl mx-auto" translate="no">

                {/* Prefacio Informativo */}
                {data?.prefacio && (
                    <p className="text-base md:text-xl font-bold text-center leading-relaxed text-yellow-300">
                        {data.prefacio}
                    </p>
                )}

                {/* Sección Estación / Título */}
                {data?.estacion && (
                    <div className="space-y-6 text-center">
                        <h2 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                            {data.estacion}
                        </h2>

                        {data?.descripcionEstacion && (
                            <p className="text-base md:text-lg font-medium text-white leading-relaxed max-w-2xl mx-auto">
                                {data.descripcionEstacion}
                            </p>
                        )}

                        {data?.imagenEstacion && (
                            <div className="flex justify-center my-4">
                                <img
                                    src={data.imagenEstacion}
                                    alt="Caja Popular Cerano"
                                    className="max-h-80 object-contain animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Botón único de Continuar al final */}
                <button
                    onClick={handleContinue}
                    className="w-full py-4 rounded-full font-black text-xl bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-102 active:scale-98 shadow-xl transition-all uppercase"
                >
                    Continuar
                </button>

            </div>
        </LayoutActividad>
    );
};

export default Act05;