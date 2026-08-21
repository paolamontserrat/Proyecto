import React, { useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const secciones = config.secciones || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act6-${rango}-${userId}`;

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
                className="bg-white p-4 sm:p-6 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-10 min-w-0 box-border overflow-hidden"
                translate="no"
            >
                {/* TARJETA INTERNA 1: INTRODUCCIÓN */}
                {secciones.introduccion && (
                    <div className=" p-6 sm:p-8 rounded-3xl text-center space-y-4">
                        <p className="text-xl sm:text-2xl font-black text-sky-900">
                            {secciones.introduccion.titulo}
                        </p>
                        <div className="bg-amber-400 text-blue-950 font-black text-xl sm:text-3xl md:text-4xl py-3 px-4 sm:px-6 rounded-2xl sm:rounded-full inline-block shadow-sm max-w-full break-words leading-tight">
                            {secciones.introduccion.subtitulo}
                        </div>
                        {secciones.introduccion.imagen && (
                            <div className="flex justify-center pt-4">
                                <img
                                    src={secciones.introduccion.imagen}
                                    alt="Alianzito Cooperativa"
                                    className="max-h-80 object-contain rounded-2xl animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* TARJETA INTERNA 2: ¿QUÉ ES LA AUTORRESPONSABILIDAD? */}
                {secciones.queEs && (
                    <div className="bg-amber-100/90 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-md space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {secciones.queEs.imagen && (
                                <img
                                    src={secciones.queEs.imagen}
                                    alt="Alianzito Sentado"
                                    className="w-40 sm:w-48 object-contain animate-bounce-gentle"
                                />
                            )}
                            <div className="text-center md:text-left space-y-2 flex-1">
                                <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                                    {secciones.queEs.pregunta}
                                </h2>
                                <p className="text-lg font-extrabold text-blue-950 italic">
                                    {secciones.queEs.definicion}
                                </p>
                            </div>
                        </div>

                        {/* LISTA DE PUNTOS CLAVE */}
                        <div className="bg-blue-900 text-white p-6 rounded-2xl space-y-3 shadow-inner">
                            {secciones.queEs.puntos?.map((item, idx) => (
                                <p key={idx} className="text-base sm:text-lg">
                                    <span className="font-black text-amber-300">{item.destacado} </span>
                                    <span>{item.texto}</span>
                                    {item.destacado2 && (
                                        <span className="font-black text-amber-300">{item.destacado2}</span>
                                    )}
                                    {item.texto2 && <span>{item.texto2}</span>}
                                </p>
                            ))}
                        </div>

                        <p className="text-base sm:text-lg font-black text-blue-950 text-center bg-sky-50 p-4 rounded-xl border border-sky-200">
                            {secciones.queEs.conclusion}
                        </p>
                    </div>
                )}

                {/* TARJETA INTERNA 3: DECISIONES Y EJEMPLOS */}
                {secciones.decisiones && (
                    <div className="bg-sky-100/90 p-6 sm:p-8 rounded-3xl border-2 border-sky-300 shadow-md space-y-6 text-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                                {secciones.decisiones.titulo}
                            </h2>
                            <p className="text-lg sm:text-xl font-bold text-blue-950">
                                {secciones.decisiones.descripcion}
                            </p>
                            <p className="text-lg font-black text-sky-800">
                                {secciones.decisiones.subtitulo}
                            </p>
                        </div>

                        {/* LISTA DE EJEMPLOS CON IMÁGENES CIRCULARES */}
                        <div className="space-y-4 max-w-xl mx-auto text-left">
                            {secciones.decisiones.ejemplos?.map((ejemplo) => (
                                <div
                                    key={ejemplo.id}
                                    className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-sky-500"
                                >
                                    <img
                                        src={ejemplo.imagen}
                                        alt={ejemplo.texto}
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-sky-300 flex-shrink-0"
                                    />
                                    <p className="font-black text-base sm:text-lg text-blue-950">
                                        {ejemplo.texto}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="text-base sm:text-lg font-black text-blue-900 bg-amber-50 p-4 rounded-xl border border-amber-200">
                            {secciones.decisiones.conclusion}
                        </p>
                    </div>
                )}

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

export default Act06;