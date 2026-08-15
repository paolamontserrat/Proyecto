import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const menor = config.seccionMenor || {};
    const mayor = config.seccionMayor || {};

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

        localStorage.setItem(`act8-${rango}-${userId}`, JSON.stringify({ completada: true }));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(1deg); }
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
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-900 to-sky-700 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "¿Qué pasa cuando cumples 18?"}
                    </h1>
                </div>

                {/* BLOQUE 1: Menor de edad (Club Amig@s de Alianzito) */}
                <div className="bg-amber-50 rounded-3xl p-6 md:p-8 border-3 border-amber-300 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Logo Club (4.png) */}
                        <div className="md:col-span-5 flex justify-center">
                            <img 
                                src={menor.logo} 
                                alt="Club Amigos de Alianzito" 
                                className="w-full max-w-[220px] md:max-w-[260px] h-auto object-contain drop-shadow-md select-none animate-float-slow"
                            />
                        </div>

                        {/* Texto Explicativo */}
                        <div className="md:col-span-7">
                            <div className="bg-white border-l-8 border-amber-400 p-5 rounded-r-2xl shadow-sm">
                                <p className="text-base md:text-lg font-bold text-gray-800 leading-relaxed">
                                    {menor.texto}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* BLOQUE 2: Mayor de edad & Aportación Social */}
                <div className="bg-sky-50 rounded-3xl p-6 md:p-8 border-3 border-sky-300 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Explicación Mayor de Edad */}
                        <div className="md:col-span-7 space-y-4 order-2 md:order-1">
                            <div className="bg-sky-600 text-white p-5 rounded-2xl shadow-md">
                                <p className="font-black text-lg md:text-xl leading-snug">
                                    {mayor.subtitulo}
                                </p>
                            </div>

                            <div className="bg-white border-2 border-dashed border-sky-300 p-5 rounded-2xl shadow-inner space-y-2">
                                <p className="text-base md:text-lg font-bold text-gray-800 leading-relaxed">
                                    Para hacerlo, necesitas cubrir un certificado de aportación que tiene un valor de{" "}
                                    <strong className="text-emerald-600 font-black text-xl">$1,000.00</strong> y que también es conocido{" "}
                                    <strong className="text-amber-500 font-black uppercase">como parte social.</strong>
                                </p>
                            </div>
                        </div>

                        {/* Personaje Socio (21.png) */}
                        <div className="md:col-span-5 flex justify-center order-1 md:order-2">
                            <img 
                                src={mayor.imagen} 
                                alt="Nuevo Socio Caja ALIANZA" 
                                className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                            />
                        </div>

                    </div>
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

export default Act08;