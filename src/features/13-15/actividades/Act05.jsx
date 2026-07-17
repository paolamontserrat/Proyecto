import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Emojis dinámicos para los marcadores de puntos
    const emojisSecciones = {
        escuela: "🏫",
        casa: "🏠",
        cajaPopular: "🏦"
    };

    // --- SISTEMA DE GUARDADO DE PROGRESO ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act05-${rango}-${userId}`;

    const guardar = async () => {
        localStorage.setItem(storageKey, JSON.stringify({}));

        if (userId !== "anon" && data.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: data.id,
                            datos_actividad: {},
                            completada: true,
                        },
                        {
                            onConflict: "usuario_id,actividad_id",
                        }
                    );
            } catch {
                console.warn("Offline, se sincroniza después");
            }
        }
    };

    // Guardar progreso al cargar el componente
    useEffect(() => {
        guardar();
    }, [data.id]);

    useEffect(() => {
        const handleOnline = () => guardar();
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [data.id]);

    const handleContinue = async () => {
        await guardar();
        onComplete();
    };

    return (
        <LayoutActividad fondo={data.fondo}>
            {/* Navegación superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta de Contenido Principal */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                
                {/* Título Principal */}
                <h1 
                    className="text-center font-black text-amber-500 mb-6 uppercase tracking-wider" 
                    style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                    {data.titulo || "RESPONSABILIDAD"}
                </h1>

                {/* Bloque de Introducción */}
                {data.introduccion && (
                    <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
                        <p className="text-xl md:text-2xl font-bold text-blue-900 leading-relaxed">
                            {data.introduccion.definicion}
                        </p>
                        <p className="text-lg md:text-xl font-extrabold text-sky-600">
                            {data.introduccion.concepto}
                        </p>
                    </div>
                )}

                {/* Cuadrícula de Secciones Informativas */}
                <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                    
                    {/* Tarjeta: Escuela */}
                    {data.secciones?.escuela && (
                        <div className="bg-blue-50/70 border-2 border-blue-200 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {data.secciones.escuela.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {data.secciones.escuela.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        {/* El emoji de la escuela reemplaza al punto tradicional */}
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.escuela}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-blue-900 text-white p-4 rounded-2xl text-center font-extrabold text-base md:text-lg shadow-sm">
                                {data.secciones.escuela.cierre}
                            </div>
                        </div>
                    )}

                    {/* Tarjeta: Casa */}
                    {data.secciones?.casa && (
                        <div className="bg-orange-50/50 border-2 border-orange-100 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {data.secciones.casa.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {data.secciones.casa.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        {/* El emoji de la casa reemplaza al punto tradicional */}
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.casa}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-amber-600 text-white p-4 rounded-2xl text-center font-extrabold text-base md:text-lg shadow-sm">
                                {data.secciones.casa.cierre}
                            </div>
                        </div>
                    )}

                    {/* Tarjeta: Caja Popular */}
                    {data.secciones?.cajaPopular && (
                        <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {data.secciones.cajaPopular.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {data.secciones.cajaPopular.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        {/* El emoji del banco reemplaza al punto tradicional */}
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.cajaPopular}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            
                            {/* Bloque de Cierres Especiales */}
                            <div className="bg-emerald-700 text-white p-5 rounded-2xl space-y-3 shadow-sm text-center">
                                {data.secciones.cajaPopular.cierres?.map((cierre, index) => (
                                    <p 
                                        key={index} 
                                        className={`font-extrabold text-base md:text-lg ${
                                            index > 0 ? "border-t border-white/20 pt-2" : ""
                                        }`}
                                    >
                                        {cierre}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Botón de Finalización de Lectura */}
                <div className="flex justify-center mt-10 max-w-md mx-auto">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-98 shadow-lg transition-all"
                    >
                        Comenzar Actividad
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act05;