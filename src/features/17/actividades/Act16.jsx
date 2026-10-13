import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act16 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";

    // Finalizar Módulo y guardar en Supabase
    const handleContinue = async () => {
        if (userId !== "anon" && data?.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: data.id,
                        datos_actividad: { completada: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

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
                    className="bg-blue-900 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal (Actividad Par: Tarjeta Clara/Blanca) */}
            <div className="bg-white/95 p-6 md:p-10 rounded-3xl border-4 border-blue-900 shadow-2xl space-y-10 max-w-4xl mx-auto text-blue-950 backdrop-blur-md" translate="no">

                {data?.titulo && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>
                    </div>
                )}

                {/* SECCIÓN 1: INTRODUCCIÓN */}
                {data?.introduccion && (
                    <div className="bg-amber-50 border-4 border-amber-300 p-6 md:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row items-center gap-6">
                        <div className="space-y-4 flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black text-blue-900 uppercase">
                                {data.introduccion.titulo}
                            </h1>
                            <p className="text-base md:text-lg font-semibold text-slate-700 leading-relaxed">
                                {data.introduccion.mensaje}
                            </p>
                            {data.introduccion.imagenEdificio && (
                                <img
                                    src={data.introduccion.imagenEdificio}
                                    alt="Caja Popular Cerano"
                                    className="max-h-24 object-contain mx-auto md:mx-0 pt-2"
                                />
                            )}
                        </div>

                        {data.introduccion.imagenPersonaje && (
                            <img
                                src={data.introduccion.imagenPersonaje}
                                alt="Pensando en tu futuro"
                                className="max-h-64 object-contain animate-float-slow"
                            />
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: REQUISITOS PARA SER SOCIO */}
                {data?.requisitos && (
                    <div className="space-y-6">
                        <div className="bg-blue-900 text-white p-5 rounded-2xl border-2 border-yellow-400 text-center shadow-md">
                            <h2 className="text-lg md:text-2xl font-bold uppercase">
                                {data.requisitos.titulo}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {data.requisitos.lista?.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-yellow-400 text-blue-950 p-4 rounded-2xl border-4 border-yellow-500 shadow-md space-y-3 flex flex-col items-center text-center"
                                >
                                    {req.imagen && (
                                        <img
                                            src={req.imagen}
                                            alt={req.nombre}
                                            className="max-h-48 object-contain rounded-xl border-2 border-blue-900/20 bg-white p-2 w-full"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 3: BENEFICIOS DE SER SOCIO */}
                {data?.beneficios && (
                    <div className="space-y-6">
                        <div className="bg-blue-950 text-white p-6 rounded-3xl border-4 border-yellow-400 shadow-xl text-center">
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase">
                                {data.beneficios.titulo}
                            </h2>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6">
                            {data.beneficios.lista?.map((ben) => (
                                <div
                                    key={ben.id}
                                    className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl shadow flex flex-col items-center text-center space-y-3 w-full sm:w-[calc(50%-1.5rem)] md:w-[calc(33.333%-1.5rem)] max-w-xs"
                                >
                                    <span className="bg-yellow-400 text-blue-950 text-xs font-black uppercase px-3 py-1 rounded-full border border-yellow-500 shadow-sm">
                                        {ben.nombre}
                                    </span>
                                    {ben.imagen && (
                                        <img
                                            src={ben.imagen}
                                            alt={ben.nombre}
                                            className="max-h-56 object-contain rounded-xl"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTÓN ÚNICO DE FINALIZAR MÓDULO */}
                <div className="pt-4">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 text-2xl font-black rounded-full shadow-xl bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-102 active:scale-95 transition transform uppercase"
                    >
                        Finalizar Aventura
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act16;