import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
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
    const storageKey = `act3-${rango}-${userId}`;

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

    // Mapeo dinámico de las secciones según el JSON recibido
    const secCuenta = secciones.find((s) => s.id === "cuenta_ahorro") || {};
    const secSubcuenta = secciones.find((s) => s.id === "subcuenta_creciendo_juntos") || {};

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
                {/* ENCABEZADO Y BIENVENIDA */}
                <div className="flex flex-col items-center text-center space-y-4">
                    {config.imagen && (
                        <div className="relative w-full max-w-md h-48 sm:h-56 flex justify-center items-center">
                            <img
                                src={config.imagen}
                                alt={config.titulo}
                                className="h-44 sm:h-52 object-contain animate-float-slow select-none"
                            />
                        </div>
                    )}

                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide break-words">
                        {config.titulo}
                    </h1>

                    {config.subtitulo && (
                        <p className="text-blue-900 font-bold text-base sm:text-xl max-w-2xl leading-relaxed break-words">
                            {config.subtitulo}
                        </p>
                    )}
                </div>

                {/* SECCIÓN 1: CUENTA DE AHORRO (CLUB AMIGOS DE ALIANZITO) */}
                {secCuenta.id && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 bg-sky-50 p-5 sm:p-6 rounded-3xl border-2 border-sky-200">
                            {secCuenta.imagen && (
                                <img
                                    src={secCuenta.imagen}
                                    alt={secCuenta.tipo}
                                    className="w-36 sm:w-48 h-auto object-contain animate-float-slow select-none shrink-0"
                                />
                            )}
                            <div className="space-y-3 text-center md:text-left">
                                <h2 className="text-xl sm:text-2xl font-black text-blue-900 uppercase">
                                    {secCuenta.tipo}
                                </h2>
                                <p className="text-gray-700 font-medium text-sm sm:text-base leading-relaxed break-words">
                                    {secCuenta.descripcion}
                                </p>
                            </div>
                        </div>

                        {/* Bloque del Ejemplo */}
                        {secCuenta.ejemplo && (
                            <div className="bg-blue-900 text-white p-5 sm:p-6 rounded-3xl text-center space-y-2 shadow-lg">
                                <h3 className="text-amber-400 font-black text-lg sm:text-xl uppercase">
                                    Ejemplo
                                </h3>
                                <p className="font-semibold text-sm sm:text-base leading-relaxed max-w-2xl mx-auto break-words">
                                    "{secCuenta.ejemplo}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: SUBCUENTA CRECIENDO JUNTOS */}
                {secSubcuenta.id && (
                    <div className="bg-gradient-to-b from-sky-50 to-amber-50 p-5 sm:p-8 rounded-3xl border-2 border-amber-300 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl sm:text-3xl font-black text-blue-950 uppercase">
                                {secSubcuenta.tipo}
                            </h2>
                        </div>

                        <p className="text-gray-800 font-semibold text-sm sm:text-lg text-center leading-relaxed break-words max-w-3xl mx-auto">
                            {secSubcuenta.descripcion}
                        </p>

                        {/* Lista de características */}
                        {secSubcuenta.caracteristicas && secSubcuenta.caracteristicas.length > 0 && (
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-amber-200 shadow-sm max-w-2xl mx-auto">
                                <h3 className="font-extrabold text-blue-900 text-base sm:text-lg mb-3">
                                    Características principales:
                                </h3>
                                <ul className="space-y-2">
                                    {secSubcuenta.caracteristicas.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-700 font-medium text-sm sm:text-base">
                                            <span className="text-amber-500 font-bold">✓</span>
                                            <span className="break-words">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Imágenes de metas / apoyo */}
                        {secSubcuenta.ejemplosMetas && secSubcuenta.ejemplosMetas.length > 0 && (
                            <div className="flex justify-center pt-2">
                                {secSubcuenta.ejemplosMetas.map((meta, idx) => (
                                    <img
                                        key={idx}
                                        src={meta.imagen}
                                        alt={`Ejemplo meta ${idx + 1}`}
                                        className="w-full max-w-md h-auto object-contain rounded-2xl drop-shadow-md"
                                    />
                                ))}
                            </div>
                        )}
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

export default Act05;