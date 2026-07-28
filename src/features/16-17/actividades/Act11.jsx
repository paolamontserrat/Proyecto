import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const credito = config.seccionCredito || {};
    const ahorro = config.seccionAhorro || {};

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

        localStorage.setItem(`act11-${rango}-${userId}`, JSON.stringify({ completada: true }));
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

            {/* Contenedor Principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-5xl mx-auto space-y-12" translate="no">
                
                {/* SECCIÓN 1: TIPS DE CRÉDITO */}
                <div className="space-y-6">
                    {/* Header con Personaje (11.png) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-blue-900 to-sky-700 text-white p-5 md:p-6 rounded-2xl shadow-md gap-4 relative overflow-hidden">
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-wider text-center sm:text-left z-10">
                            {credito.titulo || "Tips financieros para pedir un crédito"}
                        </h1>
                        {config.personajeHeader && (
                            <img 
                                src={config.personajeHeader} 
                                alt="Alianzito Guía" 
                                className="w-24 md:w-32 h-auto object-contain animate-float-slow shrink-0 z-10 select-none drop-shadow-md"
                            />
                        )}
                    </div>

                    {/* Tarjetas Crédito: 2 arriba y la 3ra centrada abajo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {credito.tarjetas?.map((card, idx) => (
                            <div 
                                key={card.id}
                                className={`bg-amber-50/70 rounded-3xl p-6 border-2 border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                                    idx === 2 ? "sm:col-span-2 sm:w-3/4 lg:w-2/3 sm:mx-auto" : ""
                                }`}
                            >
                                <div className="space-y-3">
                                    <h3 className="text-lg md:text-xl font-black text-blue-950 text-center leading-snug">
                                        {card.encabezado}
                                    </h3>
                                    <p className="text-sm md:text-base font-semibold text-gray-700 text-center leading-relaxed">
                                        {card.contenido}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECCIÓN 2: VENTAJAS DE AHORRAR */}
                <div className="space-y-6 pt-2">
                    {/* Header Ahorro */}
                    <div className="bg-amber-500 text-white p-4 md:p-5 rounded-2xl shadow-md text-center">
                        <h2 className="text-xl md:text-3xl font-black uppercase tracking-wider">
                            {ahorro.titulo || "Ventajas de ahorrar:"}
                        </h2>
                    </div>

                    {/* Tarjetas Ahorro: 2 arriba y la 3ra centrada abajo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {ahorro.tarjetas?.map((card, idx) => (
                            <div 
                                key={card.id}
                                className={`bg-sky-50/70 rounded-3xl p-6 border-2 border-sky-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                                    idx === 2 ? "sm:col-span-2 sm:w-3/4 lg:w-2/3 sm:mx-auto" : ""
                                }`}
                            >
                                <div className="space-y-3">
                                    <h3 className="text-lg md:text-xl font-black text-amber-950 text-center leading-snug">
                                        {card.encabezado}
                                    </h3>
                                    <p className="text-sm md:text-base font-semibold text-gray-700 text-center leading-relaxed">
                                        {card.contenido}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botón Continuar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Actividad
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act11;