import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const info = config.seccionInformativa || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

    const handleContinue = async () => {
        const payload = {
            completado: true,
            fechaCompleto: new Date().toISOString(),
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
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
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-5xl mx-auto space-y-10" translate="no">
                <h1 className="text-3xl sm:text-4xl font-black text-blue-950 text-center tracking-wide">
                    {config.titulo}
                </h1>

                {/* 1. CONCEPTO PRINCIPAL */}
                <div className="space-y-6 text-center max-w-3xl mx-auto">
                    <p className="text-xl sm:text-2xl font-black text-blue-900 leading-relaxed">
                        {info.introduccion}
                    </p>

                    {/* Tarjeta de Lista de Significado */}
                    <div className="bg-yellow-200 border-3 border-yellow-400 p-6 rounded-3xl shadow-md text-left max-w-2xl mx-auto space-y-3">
                        <h2 className="text-xl sm:text-2xl font-black text-blue-950 text-center">
                            Significa:
                        </h2>
                        <ul className="space-y-3 text-blue-950 font-extrabold text-lg sm:text-xl pl-2">
                            {info.significa?.map((punto, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-xl">⭐</span>
                                    <span>{punto}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-lg sm:text-xl font-bold text-blue-950 leading-relaxed bg-sky-50 border-2 border-sky-200 p-5 rounded-2xl">
                        {info.notaFormasAyuda}
                    </p>

                    {/* Imagen Ilustrativa Principal con Animación Flotante Suave */}
                    {info.imagenIlustrativa && (
                        <div className="flex justify-center pt-2">
                            <img
                                src={info.imagenIlustrativa}
                                alt="Ayuda mutua"
                                className="w-72 sm:w-96 h-auto object-contain drop-shadow-md rounded-2xl animate-float-slow hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    )}
                </div>

                {/* 2. EJEMPLOS (GRID DE 2 COLUMNAS ANIMADAS) */}
                <div className="space-y-8 text-center">
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                            {info.preguntaReflexiva}
                        </h2>
                        {info.subtituloEjemplos && (
                            <p className="text-xl font-extrabold text-amber-600">
                                {info.subtituloEjemplos}
                            </p>
                        )}
                    </div>

                    {/* GRID CON EFECTO HOVER Y ZOOM EN IMÁGENES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {info.ejemplos?.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-sky-50 p-4 sm:p-6 rounded-3xl border-3 border-sky-200 shadow-lg flex justify-center items-center animate-float-slow"
                            >
                                {item.imagen && (
                                    <img
                                        src={item.imagen}
                                        alt={`Ejemplo ${idx + 1}`}
                                        className="w-full max-w-xs sm:max-w-sm h-auto object-contain drop-shadow-sm rounded-2xl"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* BANNER CONCLUSIÓN CON ALIANZITO ANIMADO */}
                    <div className="bg-amber-100 border-3 border-amber-400 p-6 rounded-3xl max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 shadow-md">
                        {info.imagenAlianzito && (
                            <img
                                src={info.imagenAlianzito}
                                alt="Alianzito ayuda mutua"
                                className="w-48 sm:w-64 h-auto object-contain drop-shadow-sm transition-transform duration-300 animate-bounce-gentle"
                            />
                        )}
                        {info.conclusion && (
                            <div className="space-y-3 flex-1 text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-black text-blue-950 leading-relaxed">
                                    {info.conclusion}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* BOTÓN CONTINUAR */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleContinue}
                            className="w-full sm:w-2/3 py-5 rounded-full font-black text-2xl bg-amber-400 text-blue-950 shadow-xl hover:scale-105 active:scale-95 transition-all border-b-4 border-amber-600"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act12;