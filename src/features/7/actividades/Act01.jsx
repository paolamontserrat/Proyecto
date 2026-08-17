import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const secciones = config.secciones || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act1-${rango}-${userId}`;

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

    // Mapeo seguro de secciones según el JSON
    const sec1 = secciones.find((s) => s.id === "bienvenida") || {};
    const sec2 = secciones.find((s) => s.id === "definicion") || {};
    const sec3 = secciones.find((s) => s.id === "proceso") || {};
    const sec4 = secciones.find((s) => s.id === "resumen") || {};

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
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Tarjeta Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-10 min-w-0 box-border overflow-hidden"
                translate="no"
            >
                {/* SECCIÓN 1: BIENVENIDA */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-full max-w-md h-56 sm:h-64 flex justify-center items-center">
                        {sec1.imagenes?.[0] && (
                            <img
                                src={sec1.imagenes[0].url}
                                alt={sec1.imagenes[0].alt}
                                className="h-48 sm:h-56 object-contain z-10 animate-float-slow select-none"
                            />
                        )}
                        {sec1.imagenes?.[1] && (
                            <img
                                src={sec1.imagenes[1].url}
                                alt={sec1.imagenes[1].alt}
                                className="absolute top-2 left-4 w-16 sm:w-20 object-contain animate-bounce-gentle"
                            />
                        )}
                        {sec1.imagenes?.[2] && (
                            <img
                                src={sec1.imagenes[2].url}
                                alt={sec1.imagenes[2].alt}
                                className="absolute bottom-2 left-8 w-16 sm:w-20 object-contain animate-bounce-gentle"
                            />
                        )}
                        {sec1.imagenes?.[3] && (
                            <img
                                src={sec1.imagenes[3].url}
                                alt={sec1.imagenes[3].alt}
                                className="absolute top-4 right-4 w-20 sm:w-24 object-contain animate-bounce-gentle"
                            />
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide break-words">
                        {sec1.titulo}
                    </h1>

                    <p className="text-blue-900 font-bold text-base sm:text-xl max-w-xl leading-relaxed break-words">
                        {sec1.preguntaInicial}
                    </p>

                    <p className="text-gray-700 font-medium text-sm sm:text-lg max-w-xl leading-relaxed break-words">
                        {sec1.introduccion}
                    </p>
                </div>
                {/* SECCIÓN 2: DEFINICIÓN Y EJEMPLO */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-sky-50 p-4 sm:p-6 rounded-3xl border-2 border-sky-200">
                        {sec2.imagenes?.[0] && (
                            <img
                                src={sec2.imagenes[0].url}
                                alt={sec2.imagenes[0].alt}
                                className="w-40 sm:w-52 h-auto object-contain animate-float-slow select-none shrink-0"
                            />
                        )}
                        <div className="space-y-3 text-center md:text-left">
                            <div className="inline-block bg-amber-400 text-blue-950 font-black px-4 py-1.5 rounded-2xl text-base sm:text-lg shadow">
                                {sec2.preguntaClave}
                            </div>
                            <p className="text-blue-900 font-extrabold text-base sm:text-xl leading-snug break-words">
                                {sec2.concepto}
                            </p>
                        </div>
                    </div>

                    {/* Bloque Azul del Ejemplo */}
                    <div className="bg-blue-900 text-white p-5 sm:p-8 rounded-3xl text-center space-y-4 shadow-lg">
                        <h2 className="text-amber-400 font-black text-lg sm:text-2xl uppercase">
                            {sec2.ejemploTitulo}
                        </h2>
                        <p className="font-semibold text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto break-words">
                            {sec2.ejemploTexto}
                        </p>
                        {sec2.imagenes?.[1] && (
                            <div className="flex justify-center pt-2">
                                <img
                                    src={sec2.imagenes[1].url}
                                    alt={sec2.imagenes[1].alt}
                                    className="h-16 sm:h-20 object-contain drop-shadow"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 3: PROCESO */}
                <div className="bg-gradient-to-b from-sky-50 to-amber-50 p-5 sm:p-8 rounded-3xl border-2 border-amber-300 text-center space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                        {sec3.imagenes?.[0] && (
                            <img
                                src={sec3.imagenes[0].url}
                                alt={sec3.imagenes[0].alt}
                                className="w-56 sm:w-72 h-auto object-contain drop-shadow-md select-none"
                            />
                        )}
                        {sec3.imagenes?.[1] && (
                            <img
                                src={sec3.imagenes[1].url}
                                alt={sec3.imagenes[1].alt}
                                className="w-full max-w-md h-auto object-contain"
                            />
                        )}
                    </div>

                    <p className="text-blue-950 font-black text-base sm:text-2xl max-w-2xl mx-auto leading-snug break-words">
                        {sec3.explicacion}
                    </p>
                </div>

                {/* SECCIÓN 4: RESUMEN Y PASOS */}
                <div className="bg-sky-50 p-5 sm:p-8 rounded-3xl border-3 border-sky-300 text-center space-y-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900 uppercase">
                            {sec4.tituloResumen}
                        </h2>
                        <p className="text-blue-800 font-bold text-sm sm:text-lg mt-1 break-words">
                            {sec4.subtituloResumen}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        {sec4.imagenes?.[0] && (
                            <img
                                src={sec4.imagenes[0].url}
                                alt={sec4.imagenes[0].alt}
                                className="w-full max-w-lg h-auto object-contain"
                            />
                        )}
                        {sec4.imagenes?.[1] && (
                            <img
                                src={sec4.imagenes[1].url}
                                alt={sec4.imagenes[1].alt}
                                className="w-44 sm:w-52 h-auto object-contain animate-float-slow"
                            />
                        )}
                    </div>
                </div>

                {/* BOTÓN CONTINUAR */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-lg sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act01;