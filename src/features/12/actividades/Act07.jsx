import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const intro = config.seccionIntro || {};
    const vivir = config.seccionVivir || {};
    const puntos = config.puntosClave || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act07-${rango}-${userId}`;

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
                console.warn("Error en Supabase, guardado en fallback", err);
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

            {/* Contenedor Principal */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10 max-w-4xl mx-auto" translate="no">
                
                {/* TÍTULO PRINCIPAL DE LA ACTIVIDAD */}
                <div className="text-center">
                    <span className="bg-blue-900 text-yellow-400 font-black text-xl md:text-3xl px-6 py-2 rounded-full inline-block shadow-md uppercase tracking-wide">
                        {config.titulo || "VALOR COOPERATIVO: SOLIDARIDAD"}
                    </span>
                </div>

                {/* SECCIÓN 1: ¿Qué es la Solidaridad de verdad? */}
                <div className="space-y-4">
                    <h2 className="text-blue-900 font-black text-2xl md:text-3xl">
                        {intro.titulo || "¿Qué es la Solidaridad de verdad?"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-sky-50/70 p-5 rounded-3xl border-2 border-sky-100">
                        {intro.imagen_manos && (
                            <div className="md:col-span-5 flex justify-center">
                                <img
                                    src={intro.imagen_manos}
                                    alt="Equipo trabajando en conjunto"
                                    className="rounded-2xl shadow-md border-2 border-white object-cover max-h-56 w-full animate-float-slow"
                                />
                            </div>
                        )}
                        <div className={`${intro.imagen_manos ? "md:col-span-7" : "md:col-span-12"}`}>
                            <p className="text-gray-800 font-medium text-base md:text-lg leading-relaxed">
                                {intro.descripcion}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: ¿Cómo se vive en Caja Popular Cerano? */}
                <div className="space-y-4 pt-4 border-t-2 border-sky-100">
                    <h2 className="text-blue-950 font-black text-xl md:text-2xl">
                        {vivir.titulo}
                    </h2>
                    <p className="text-gray-700 font-semibold text-base md:text-lg">
                        {vivir.descripcion}
                    </p>

                    {vivir.imagen_banco_vs && (
                        <div className="flex justify-center py-2">
                            <img
                                src={vivir.imagen_banco_vs}
                                alt="Banco vs Cooperativa"
                                className="w-full max-w-2xl object-contain drop-shadow"
                            />
                        </div>
                    )}
                </div>

                {/* SECCIÓN 3: PUNTOS CLAVE (Puzle / Red) */}
                <div className="space-y-8 pt-4 border-t-2 border-sky-100">
                    {puntos.map((punto, index) => (
                        <div
                            key={index}
                            className="bg-sky-50/50 p-6 rounded-3xl border-2 border-sky-200 shadow-sm space-y-4"
                        >
                            <div className="space-y-2">
                                <h3 className="text-blue-900 font-extrabold text-lg md:text-xl flex items-start gap-2">
                                    <span className="text-blue-600 font-black">{punto.numero}.</span>
                                    <span>
                                        <span className="text-blue-900 font-black">{punto.titulo}</span>{" "}
                                        <span className="text-gray-800 font-medium">{punto.descripcion}</span>
                                    </span>
                                </h3>
                            </div>

                            {punto.imagen && (
                                <div className="flex justify-center pt-2">
                                    <img
                                        src={punto.imagen}
                                        alt={punto.titulo}
                                        className="w-full max-w-lg object-contain drop-shadow animate-float-slow"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* BOTÓN CONTINUAR */}
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

export default Act07;