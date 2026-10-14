import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, rango }) => {
    const navigate = useNavigate();

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act01-${rango}-${userId}`;

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

    const secciones = data?.secciones || [];

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>
            {/* Navegación superior */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal */}
            <div className="bg-blue-900 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl text-white space-y-8 max-w-3xl mx-auto" translate="no">

                {/* Título Principal */}
                {data?.titulo && (
                    <h1 className="text-2xl md:text-3xl font-black text-yellow-300 text-center leading-snug tracking-wide uppercase drop-shadow-md">
                        {data.titulo}
                    </h1>
                )}

                {/* Renderizado Dinámico de Secciones */}
                {secciones.map((sec) => (
                    <div key={sec.id} className="space-y-6">
                        
                        {/* Párrafos descriptivos */}
                        {sec.parrafos && (
                            <div className="space-y-4 text-base md:text-lg font-medium text-blue-100 leading-relaxed bg-blue-950/60 p-6 rounded-2xl border border-blue-700/60 shadow-inner">
                                {sec.parrafos.map((parrafo, idx) => (
                                    <p key={idx}>{parrafo}</p>
                                ))}
                            </div>
                        )}

                        {/* Pregunta o Cierre */}
                        {sec.preguntaFinal && (
                            <p className="text-xl md:text-2xl font-black text-yellow-300 text-center pt-2">
                                {sec.preguntaFinal}
                            </p>
                        )}

                        {/* Ilustración */}
                        {sec.imagen && (
                            <div className="flex justify-center pt-2">
                                <img
                                    src={sec.imagen}
                                    alt="Rumbo a la aventura"
                                    className="w-full max-w-md rounded-2xl border-4 border-yellow-400 shadow-2xl object-cover hover:scale-102 transition-transform duration-300 animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                ))}

                {/* Botón Continuar */}
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

export default Act01;