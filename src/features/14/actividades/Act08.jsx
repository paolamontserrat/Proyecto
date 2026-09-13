import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const rutas = config.rutas || [];
    const imagenes = config.imagenes || [];

    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [completado, setCompletado] = useState(false);

    // Persistencia
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) {
                        if (progreso.completada || progreso.datos_actividad?.completado) {
                            setCompletado(true);
                            const rutaExitosa = rutas.find(r => r.esCorrecto);
                            if (rutaExitosa) setRutaSeleccionada(rutaExitosa.id);
                            return;
                        }
                    }
                } catch (err) {
                    console.warn("Error cargando progreso desde Supabase", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.completado) {
                        setCompletado(true);
                        setRutaSeleccionada(parsed.rutaId);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, rutas, storageKey, userId]);

    const handleSeleccionarRuta = (ruta) => {
        if (completado) return;

        setRutaSeleccionada(ruta.id);

        if (ruta.esCorrecto) {
            setFeedback({
                tipo: "exito",
                mensaje: ruta.retroalimentacion,
            });
            setCompletado(true);

            const datosProgreso = {
                rutaId: ruta.id,
                completado: true,
            };

            localStorage.setItem(storageKey, JSON.stringify(datosProgreso));
        } else {
            setFeedback({
                tipo: "error",
                mensaje: ruta.retroalimentacion,
            });
        }
    };

    const handleReset = () => {
        setRutaSeleccionada(null);
        setFeedback(null);
        setCompletado(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!completado) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { rutaId: rutaSeleccionada, completado: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, progreso guardado localmente", err);
            }
        }
        onComplete();
    };

    if (!rutas.length) {
        return (
            <LayoutActividad fondo={config.fondo}>
                <div className="text-center py-12">
                    <p className="text-gray-500 font-bold text-xl">Cargando mapa de rutas...</p>
                </div>
            </LayoutActividad>
        );
    }

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
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
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-azul shadow-2xl relative overflow-visible" translate="no">

                {/* ENCABEZADO DE REGLA */}
                <div className="bg-amber-50 p-5 md:p-6 rounded-3xl border-2 border-amber-100 text-center space-y-3 relative mb-6">
                    <span className="bg-sky-400 text-yellow-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {imagenes[0] && (
                            <img
                                src={imagenes[0]}
                                alt="Alianzito Explorador"
                                className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg animate-float-slow"
                            />
                        )}
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="font-extrabold text-yellow-500 text-xl md:text-3xl uppercase tracking-wide">
                                {config.regla?.numero}: {config.regla?.titulo}
                            </h1>
                            <p className="text-blue-800 font-extrabold text-base md:text-lg">
                                "{config.regla?.subtitulo}"
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-700 font-medium text-sm md:text-base leading-relaxed max-w-2xl mx-auto pt-2">
                        {config.regla?.descripcion}
                    </p>
                </div>

                {/* INDICACIÓN DE ACTIVIDAD */}
                <div className="text-center mb-6 max-w-2xl mx-auto space-y-2">
                    {imagenes[1] && (
                            <img
                                src={imagenes[1]}
                                alt="Ilustración"
                                className="w-28 h-28 md:w-32 md:h-32 object-contain animate-bounce-gentle animate-float-slow justify-center mx-auto mb-2"
                            />
                    )}
                    <h2 className="text-xl md:text-2xl font-black text-yellow-950 uppercase">
                        {config.actividad?.titulo}
                    </h2>
                    <p className="text-gray-600 font-semibold text-sm md:text-base">
                        {config.actividad?.indicacion}
                    </p>
                </div>

                {/* FEEDBACK DE RUTA */}
                {feedback && (
                    <div className={`max-w-2xl mx-auto text-center py-4 px-6 rounded-2xl font-black text-sm md:text-base mb-6 animate-fade-in ${
                        feedback.tipo === "exito"
                            ? "bg-amber-100 text-amber-900 border-2 border-amber-400"
                            : "bg-sky-100 text-sky-900 border-2 border-sky-400"
                    }`}>
                        {feedback.mensaje}
                    </div>
                )}

                {/* RUTAS Y DESTINOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
                    {rutas.map((ruta, idx) => {
                        const esSeleccionada = rutaSeleccionada === ruta.id;
                        const esCorrectaYCompletada = completado && ruta.esCorrecto;

                        return (
                            <button
                                key={ruta.id}
                                onClick={() => handleSeleccionarRuta(ruta)}
                                disabled={completado}
                                className={`p-5 rounded-3xl border-4 text-left transition-all flex flex-col justify-between relative overflow-hidden shadow-md ${
                                    esCorrectaYCompletada
                                        ? "bg-amber-500 border-amber-600 text-white scale-102 ring-4 ring-amber-300"
                                        : esSeleccionada && !ruta.esCorrecto
                                            ? "bg-red-50 border-red-400 text-red-950"
                                            : "bg-amber-50/70 border-amber-200 text-yellow-950 hover:bg-sky-50 hover:border-sky-400 hover:scale-101"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                        esCorrectaYCompletada
                                            ? "bg-white text-amber-800"
                                            : "bg-yellow-500 text-blue-800"
                                    }`}>
                                        Ruta #{idx + 1}
                                    </span>
                                    <span className="text-2xl">
                                        {esCorrectaYCompletada ? "🎯" : "🚩"}
                                    </span>
                                </div>

                                <p className="font-extrabold text-base md:text-lg leading-snug">
                                    "{ruta.texto}"
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* TIP FINANCIERO CUANDO SE COMPLETA */}
                {completado && (
                    <div className="space-y-6 max-w-3xl mx-auto pt-4 animate-fade-in border-t-2 border-amber-100">
                        <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-2 shadow-xl">
                            <h2 className="text-2xl md:text-3xl font-black text-sky-900 uppercase">
                                ¡Camino Encontrado! 🌟
                            </h2>
                            <p className="text-base md:text-lg font-bold text-sky-950 max-w-xl mx-auto">
                                Has llevado a Alianzito por la ruta que garantiza sus metas y cuida su dinero.
                            </p>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 space-y-3">
                            <span className="bg-yellow-500 text-blue-800 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!completado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !completado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;