import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
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

            {/* Contenedor Principal (Actividad Impar: Tarjeta Azul Oscura) */}
            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-10 max-w-3xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN */}
                {data?.estacion && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950/80 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <h2 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.estacion}
                            </h2>
                        </div>

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Estación"
                                className="max-h-72 object-contain mx-auto animate-float-slow"
                            />
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: ESQUEMA DE PASOS (1 META -> 2 MEDIOS -> 3 LOGRO) */}
                {data?.pasos && (
                    <div className="space-y-4 max-w-xl mx-auto">
                        {data.pasos.map((paso, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white text-blue-950 p-4 rounded-2xl border-2 border-yellow-400 shadow-md">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl md:text-3xl font-black text-blue-900">
                                        {paso.numero}
                                    </span>
                                    <span className="text-lg md:text-xl font-extrabold uppercase tracking-wider text-blue-950">
                                        {paso.titulo}
                                    </span>
                                </div>
                                <span className="text-2xl font-black text-blue-900">➔</span>
                                {paso.imagen && (
                                    <img
                                        src={paso.imagen}
                                        alt={paso.titulo}
                                        className="h-16 md:h-20 object-contain"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* EXPLICACIÓN */}
                {data?.explicacion && (
                    <p className="text-base md:text-lg font-medium text-blue-100 text-center leading-relaxed max-w-2xl mx-auto">
                        {data.explicacion}
                    </p>
                )}

                {/* SECCIÓN 3: MENSAJE DE COOPERATIVA */}
                {data?.mensajeCooperativa && (
                    <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl space-y-6 text-center">
                        <p className="text-base md:text-lg font-bold leading-relaxed text-blue-900">
                            {data.mensajeCooperativa}
                        </p>

                        {data?.imagenCooperativa && (
                            <img
                                src={data.imagenCooperativa}
                                alt="Caja Popular Alianza"
                                className="max-h-60 object-contain mx-auto"
                            />
                        )}
                    </div>
                )}

                {/* BOTÓN FINALIZAR */}
                <div className="pt-2">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 text-2xl font-black rounded-full shadow-xl bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-102 active:scale-95 transition transform uppercase"
                    >
                        {data?.textoBotonFinalizar || "Continuar"}
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act07;