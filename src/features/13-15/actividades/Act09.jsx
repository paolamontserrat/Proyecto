import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const emojisSecciones = {
        escuela: "🏫",
        casa: "🏠",
        cajaPopular: "🏦"
    };

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

    const guardar = async () => {
        localStorage.setItem(storageKey, JSON.stringify({}));

        if (userId !== "anon" && config.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: config.id,
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
    }, [config.id]);

    // Intentar re-guardar si se recupera conexión a internet
    useEffect(() => {
        const handleOnline = () => guardar();
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [config.id]);

    const handleContinue = async () => {
        await guardar();
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
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
                
                {/* Titulo Principal */}
                <h1 
                    className="text-center font-black text-blue-900 mb-6 uppercase tracking-wider" 
                    style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                    {config.titulo || "HONESTIDAD"}
                </h1>

                {/* Bloque de Introducción */}
                {config.introduccion && (
                    <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
                        <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                            {config.introduccion.definicion}
                        </p>
                        <p className="text-lg md:text-xl font-extrabold text-sky-600">
                            {config.introduccion.concepto}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                    
                    {/* Tarjeta: Escuela */}
                    {config.secciones?.escuela && (
                        <div className="bg-sky-50/70 border-2 border-sky-100 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {config.secciones.escuela.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {config.secciones.escuela.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.escuela}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-blue-900 text-white p-4 rounded-2xl text-center font-extrabold text-base md:text-lg shadow-sm">
                                {config.secciones.escuela.cierre}
                            </div>
                        </div>
                    )}

                    {/* Tarjeta: Casa */}
                    {config.secciones?.casa && (
                        <div className="bg-orange-50/50 border-2 border-orange-100 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {config.secciones.casa.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {config.secciones.casa.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.casa}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-amber-600 text-white p-4 rounded-2xl text-center font-extrabold text-base md:text-lg shadow-sm">
                                {config.secciones.casa.cierre}
                            </div>
                        </div>
                    )}

                    {/* Tarjeta: Caja Popular */}
                    {config.secciones?.cajaPopular && (
                        <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-black text-amber-600 mb-4 text-center">
                                {config.secciones.cajaPopular.titulo}
                            </h2>
                            <ul className="space-y-3 mb-5 pl-2">
                                {config.secciones.cajaPopular.puntos?.map((punto, index) => (
                                    <li key={index} className="flex items-start font-semibold text-gray-700 text-base md:text-lg">
                                        <span className="mr-3 text-xl select-none">{emojisSecciones.cajaPopular}</span>
                                        {punto}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-emerald-700 text-white p-4 rounded-2xl text-center font-extrabold text-base md:text-lg shadow-sm">
                                {config.secciones.cajaPopular.cierre}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-10 max-w-md mx-auto">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-98 shadow-lg transition-all"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;