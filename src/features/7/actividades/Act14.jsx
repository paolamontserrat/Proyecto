import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act14 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const ejemplos = config.ejemplos || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act14-${rango}-${userId}`;

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
            <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-blue-950 tracking-wide">
                        {config.titulo}
                    </h1>
                    {config.subtitulo && (
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-wider">
                            {config.subtitulo}
                        </h2>
                    )}
                </div>

                {/* LISTA DE EJEMPLOS: 1 POR FILA */}
                <div className="flex flex-col gap-6">
                    {ejemplos.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-6 p-2 ${
                                idx % 2 === 1 ? "sm:flex-row-reverse" : ""
                            }`}
                        >
                            {/* Imagen limpia sin fondo ni tarjeta */}
                            {item.imagen && (
                                <img
                                    src={item.imagen}
                                    alt={`Ejemplo ${idx + 1}`}
                                    className="w-full max-w-[200px] sm:max-w-[240px] h-auto object-contain drop-shadow-md rounded-2xl"
                                />
                            )}

                            {/* Únicamente el texto lleva fondo */}
                            {item.texto && (
                                <div className="bg-sky-100 border-3 border-sky-300 p-6 rounded-3xl shadow-md flex-1 text-center sm:text-left w-full">
                                    <p className="text-lg sm:text-xl font-black text-blue-950 leading-relaxed">
                                        {item.texto}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* BOTÓN CONTINUAR */}
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-5 rounded-full font-black text-2xl bg-amber-400 text-blue-950 shadow-xl hover:scale-105 active:scale-95 transition-all border-b-4 border-amber-600"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act14;