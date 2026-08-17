import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
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
    const storageKey = `act9-${rango}-${userId}`;

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
                console.warn("Error guardando avance en Supabase", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-5 sm:p-8 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-6 box-border"
                translate="no"
            >
                {/* SECCIÓN DEL PERSONAJE Y PREGUNTA */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
                    {config.personaje && (
                        <img
                            src={config.personaje}
                            alt="Personaje"
                            className="w-32 sm:w-40 md:w-48 object-contain"
                        />
                    )}
                    <div className="bg-sky-50 border-4 border-sky-300 p-4 sm:p-6 rounded-3xl relative shadow-md text-center md:text-left">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-950">
                            {config.titulo || "¿Qué pasa si tengo una meta?"}
                        </h1>
                    </div>
                </div>

                {/* SUBTÍTULO */}
                <h2 className="text-xl sm:text-2xl font-black text-blue-900 text-center uppercase tracking-wide">
                    {config.subtitulo || "Cuando tenemos una meta:"}
                </h2>

                {/* TARJETAS CON INFORMACIÓN */}
                <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
                    {puntos.map((texto, index) => (
                        <div
                            key={index}
                            className="bg-yellow-300 border-2 border-yellow-400 p-4 sm:p-5 rounded-2xl shadow-md text-center hover:scale-101 transition-transform"
                        >
                            <p className="text-blue-950 font-black text-base sm:text-lg md:text-xl leading-snug">
                                {texto}
                            </p>
                        </div>
                    ))}
                </div>

                {/* BOTÓN CONTINUAR */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 md:w-1/2 py-4 rounded-full font-black text-xl bg-amber-400 text-blue-950 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-amber-500"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act09;