import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const paginas = config.paginas || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act07-${rango}-${userId}`;

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

    // Guardar progreso automáticamente al entrar al cómic
    useEffect(() => {
        guardar();
    }, [config.id]);

    // Re-intentar guardar si vuelve el internet
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
            {/* Barra de navegación superior */}
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
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                
                {/* Título Principal */}
                <h1
                    className="text-center font-extrabold text-blue-900 mb-8"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
                >
                    {config.titulo || "¡Hora del Cómic! Lee la siguiente historia:"}
                </h1>

                {/* Contenedor del Cómic*/}
                <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
                    {paginas.map((imagen, index) => (
                        <div 
                            key={index} 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-2 shadow-sm overflow-hidden"
                        >
                            <img
                                src={`${imagen}`}
                                alt={`Capítulo del Cómic - Parte ${index + 1}`}
                                className="w-full h-auto object-contain rounded-xl select-none"
                                loading="lazy" 
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-10 max-w-md mx-auto">
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

export default Act07;