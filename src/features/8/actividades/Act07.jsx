import React, { useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const secciones = config.secciones || {};
    const historia = secciones.historia || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act7-${rango}-${userId}`;

    // Cargar progreso guardado desde Supabase o LocalStorage
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) return;
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleContinue = async () => {
        const payload = { leido: true, fechaCompleto: new Date().toISOString() };

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
                console.warn("Offline, progreso guardado localmente", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
            `}</style>

            {/* NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* CONTENEDOR PRINCIPAL ÚNICO (CARD GLOBAL) */}
            <div
                className="bg-white p-5 sm:p-8 rounded-3xl border-4 border-amber-300 shadow-2xl max-w-3xl mx-auto space-y-6"
                translate="no"
            >
                <h1 className="text-2xl sm:text-4xl font-black text-center text-blue-900 italic">
                    {historia.titulo || "“Alianzito y su meta de ahorro”"}
                </h1>

                {/* SECUENCIA DE LA HISTORIA */}
                <div className="space-y-6">
                    {historia.pasos?.map((paso) => (
                        <div
                            key={paso.id}
                            className="bg-sky-100/90 p-6 rounded-3xl border-3 border-sky-200 shadow-md flex flex-col items-center space-y-4 text-center"
                        >
                            {/* IMAGEN ÚNICA */}
                            {paso.imagen && (
                                <img
                                    src={paso.imagen}
                                    alt={paso.texto}
                                    className="max-h-64 sm:max-h-72 object-contain rounded-2xl shadow-sm animate-float-slow"
                                />
                            )}

                            {/* DOS IMÁGENES PARALELAS (PASO CON MÚLTIPLES IMÁGENES) */}
                            {paso.imagenes && (
                                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                    {paso.imagenes.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`${paso.texto} ${idx + 1}`}
                                            className="w-full max-h-48 object-contain rounded-2xl shadow-sm animate-float-slow"
                                        />
                                    ))}
                                </div>
                            )}

                            <p className="text-lg sm:text-xl font-black text-blue-900 italic">
                                {paso.texto}
                            </p>
                        </div>
                    ))}
                </div>

                {/* BOTÓN CONTINUAR */}
                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-lg sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act07;