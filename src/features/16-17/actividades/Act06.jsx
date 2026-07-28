import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act6 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const puntos = config.puntos || [];

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

        localStorage.setItem(`act6-${rango}-${userId}`, JSON.stringify({ completada: true }));
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
                    animation: float-slow 4s ease-in-out infinite;
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-10" translate="no">
                
                {/* Banner Encabezado */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "¿Qué significa cumplir 18?"}
                    </h1>
                </div>

                {/* Lista de Puntos en Zig-Zag */}
                <div className="space-y-8 relative">
                    
                    {/* PUNTO 1: Dejas de ser menor de edad */}
                    {puntos[0] && (
                        <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                {/* Círculo Imagen Izquierda */}
                                <div className="md:col-span-5 flex justify-center">
                                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white border-4 border-sky-400 p-3 shadow-lg flex items-center justify-center animate-float-slow overflow-hidden">
                                        <img 
                                            src={puntos[0].imagen} 
                                            alt={puntos[0].texto} 
                                            className="w-full h-full object-contain select-none"
                                        />
                                    </div>
                                </div>
                                {/* Texto Derecha */}
                                <div className="md:col-span-7 flex items-center">
                                    <div className="bg-white border-l-8 border-sky-500 p-5 rounded-r-2xl shadow-md w-full">
                                        <h3 className="text-xl md:text-2xl font-black text-sky-950">
                                            {puntos[0].texto}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PUNTO 2: Te conviertes en adulto legal en México */}
                    {puntos[1] && (
                        <div className="bg-sky-50 rounded-3xl p-6 border-2 border-sky-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                {/* Texto Izquierda */}
                                <div className="md:col-span-7 order-2 md:order-1 flex items-center">
                                    <div className="bg-white border-r-8 md:border-r-0 md:border-l-8 border-amber-500 p-5 rounded-l-2xl md:rounded-l-none md:rounded-r-2xl shadow-md w-full">
                                        <h3 className="text-xl md:text-2xl font-black text-amber-950">
                                            {puntos[1].texto}
                                        </h3>
                                    </div>
                                </div>
                                {/* Círculo Imagen Derecha */}
                                <div className="md:col-span-5 order-1 md:order-2 flex justify-center">
                                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white border-4 border-amber-400 p-3 shadow-lg flex items-center justify-center animate-float-slow overflow-hidden">
                                        <img 
                                            src={puntos[1].imagen} 
                                            alt={puntos[1].texto} 
                                            className="w-full h-full object-contain select-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PUNTO 3: Ya eres responsable de tus decisiones */}
                    {puntos[2] && (
                        <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                {/* Círculo Imagen Izquierda */}
                                <div className="md:col-span-5 flex justify-center">
                                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white border-4 border-blue-600 p-3 shadow-lg flex items-center justify-center animate-float-slow overflow-hidden">
                                        <img 
                                            src={puntos[2].imagen} 
                                            alt={puntos[2].texto} 
                                            className="w-full h-full object-contain select-none"
                                        />
                                    </div>
                                </div>
                                {/* Texto Derecha */}
                                <div className="md:col-span-7 flex items-center">
                                    <div className="bg-white border-l-8 border-blue-600 p-5 rounded-r-2xl shadow-md w-full">
                                        <h3 className="text-xl md:text-2xl font-black text-blue-950">
                                            {puntos[2].texto}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Frase de Reflexión Final */}
                {config.fraseFinal && (
                    <div className="bg-gradient-to-r from-sky-900 to-blue-950 text-amber-300 p-6 rounded-2xl text-center shadow-lg border-2 border-amber-400">
                        <p className="text-lg md:text-2xl font-black italic tracking-wide">
                            {config.fraseFinal}
                        </p>
                    </div>
                )}

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

export default Act6;