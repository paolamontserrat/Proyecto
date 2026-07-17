import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const puntos = config.puntos || [];

    // --- SISTEMA DE GUARDADO DE PROGRESO (Idéntico a Act01, Act05 y Act09) ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act10-${rango}-${userId}`;

    const guardar = async () => {
        localStorage.setItem(storageKey, JSON.stringify({}));

        if (userId !== "anon" && config.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: config.id,
                            datos_actividad: {},
                            completada: true,
                        },
                        {
                            onConflict: "usuario_id,actividad_id",
                        }
                    );
            } catch {
                console.warn("Offline, se sincroniza después");
            }
        }
    };

    // Guardar progreso al cargar el componente[cite: 2]
    useEffect(() => {
        guardar();
    }, [config.id]);

    // Intentar re-guardar si se recupera conexión a internet[cite: 2]
    useEffect(() => {
        const handleOnline = () => guardar();
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [config.id]);

    const handleContinue = async () => {
        await guardar();
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3.5s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta de Contenido Principal */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                
                <div className="max-w-3xl mx-auto flex flex-col items-center">
                    
                    <h1 
                        className="text-center font-black text-blue-900 mb-6 uppercase tracking-wider" 
                        style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
                    >
                        {config.titulo || "Un joven honesto:"}
                    </h1>

                    <div className="w-full bg-blue-50/60 border-2 border-blue-100 rounded-3xl p-6 md:p-8 mb-8">
                        <ul className="space-y-4">
                            {puntos.map((punto, index) => (
                                <li 
                                    key={index} 
                                    className="flex items-center font-bold text-gray-800 text-lg md:text-xl"
                                >
                                    <span className="text-yellow-400 text-3xl mr-4 select-none">✨</span>
                                    {punto}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {config.fraseDestacada && (
                        <div className="w-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 text-white text-center shadow-md mb-8">
                            <p className="text-xl md:text-2xl font-black italic tracking-wide">
                                "{config.fraseDestacada}"
                            </p>
                        </div>
                    )}

                    {config.imagen && (
                        <div className="w-full flex justify-center py-4 mb-4">
                            <img
                                src={`${config.imagen}`}
                                alt="Ilustración jóvenes honestos"
                                className="w-64 md:w-80 h-auto object-contain select-none animate-float filter drop-shadow-xl"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-6 max-w-md mx-auto">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-98 shadow-lg transition-all"
                    >
                        Comenzar Actividad
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act10;