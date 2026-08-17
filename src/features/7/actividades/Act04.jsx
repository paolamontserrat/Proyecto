import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
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
    const storageKey = `act4-${rango}-${userId}`;

    // Cargar progreso previo
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

    // Mapeo seguro de las secciones del cuento/historia
    const secInicio = secciones.find((s) => s.id === "inicio_historia") || {};
    const secConflicto = secciones.find((s) => s.id === "conflicto") || {};
    const secDecision = secciones.find((s) => s.id === "decision") || {};
    const secLogro = secciones.find((s) => s.id === "logro") || {};
    const secConclusion = secciones.find((s) => s.id === "conclusion") || {};

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
            `}</style>

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

            {/* Contenedor Tarjeta Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-10 min-w-0 box-border overflow-hidden"
                translate="no"
            >
                {/* ENCABEZADO */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide">
                        {config.titulo}
                    </h1>
                    {config.subtitulo && (
                        <p className="text-blue-900 font-bold text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
                            {config.subtitulo}
                        </p>
                    )}
                </div>

                {/* HISTORIA - PASOS DE SOFÍA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Paso 1: El Sueño */}
                    {secInicio.id && (
                        <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-200 flex flex-col items-center text-center space-y-3">
                            <h2 className="text-xl font-black text-blue-900 uppercase">
                                {secInicio.titulo}
                            </h2>
                            {secInicio.imagen && (
                                <img
                                    src={secInicio.imagen}
                                    alt={secInicio.titulo}
                                    className="w-48 sm:w-56 h-auto object-contain rounded-2xl animate-float-slow select-none"
                                />
                            )}
                            <p className="text-gray-800 font-bold text-base sm:text-lg">
                                {secInicio.texto}
                            </p>
                        </div>
                    )}

                    {/* Paso 2: La Tentación */}
                    {secConflicto.id && (
                        <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-200 flex flex-col items-center text-center space-y-3">
                            <h2 className="text-xl font-black text-amber-600 uppercase">
                                {secConflicto.titulo}
                            </h2>
                            {secConflicto.imagen && (
                                <img
                                    src={secConflicto.imagen}
                                    alt={secConflicto.titulo}
                                    className="w-48 sm:w-56 h-auto object-contain rounded-2xl animate-float-slow select-none"
                                />
                            )}
                            <p className="text-gray-800 font-bold text-base sm:text-lg">
                                {secConflicto.texto}
                            </p>
                        </div>
                    )}

                    {/* Paso 3: Decisión de Ahorrar */}
                    {secDecision.id && (
                        <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-200 flex flex-col items-center text-center space-y-3">
                            <h2 className="text-xl font-black text-blue-900 uppercase">
                                {secDecision.titulo}
                            </h2>
                            {secDecision.imagen && (
                                <img
                                    src={secDecision.imagen}
                                    alt={secDecision.titulo}
                                    className="w-48 sm:w-56 h-auto object-contain rounded-2xl animate-float-slow select-none"
                                />
                            )}
                            <p className="text-gray-800 font-bold text-base sm:text-lg">
                                {secDecision.texto}
                            </p>
                            {secDecision.subtexto && (
                                <p className="text-blue-900 font-medium text-sm sm:text-base italic">
                                    {secDecision.subtexto}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Paso 4: Logro */}
                    {secLogro.id && (
                        <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-200 flex flex-col items-center text-center space-y-3">
                            <h2 className="text-xl font-black text-emerald-700 uppercase">
                                {secLogro.titulo}
                            </h2>
                            {secLogro.imagen && (
                                <img
                                    src={secLogro.imagen}
                                    alt={secLogro.titulo}
                                    className="w-48 sm:w-56 h-auto object-contain rounded-2xl animate-float-slow select-none"
                                />
                            )}
                            <p className="text-gray-800 font-bold text-base sm:text-lg">
                                {secLogro.texto}
                            </p>
                        </div>
                    )}
                </div>

                {/* SECCIÓN CONCLUSIÓN / CÓMO LO LOGRÓ */}
                {secConclusion.id && (
                    <div className="bg-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            {secConclusion.imagen && (
                                <img
                                    src={secConclusion.imagen}
                                    alt="Mascota informativo"
                                    className="w-32 sm:w-40 h-auto object-contain animate-float-slow shrink-0"
                                />
                            )}
                            <div className="space-y-4 text-center md:text-left">
                                <h2 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase">
                                    {secConclusion.pregunta}
                                </h2>
                                <div className="space-y-2">
                                    {secConclusion.puntosClave?.map((punto, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-amber-400 text-blue-950 font-black px-4 py-2 rounded-xl text-base sm:text-lg shadow"
                                        >
                                            {punto}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

export default Act04;