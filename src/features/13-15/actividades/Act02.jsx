import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const pasos = data?.pasos || [];

    const getUser = () => {
        try {
        return JSON.parse(localStorage.getItem("usuario"));
        } catch {
        return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act02-${rango}-${userId}`;

    const guardar = async () => {
        localStorage.setItem(storageKey, JSON.stringify({}));

        if (userId !== "anon" && data?.id) {
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

    useEffect(() => {
        guardar();
    }, [data?.id]);

    useEffect(() => {
        const handleOnline = () => guardar();
        window.addEventListener("online", handleOnline);
        return () => {
        window.removeEventListener("online", handleOnline);
        };
    }, [data?.id]);

    const handleContinue = async () => {
        await guardar();
        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        
        {/* Barra de navegación superior */}
        <div className="flex justify-between mb-6">
            <button
            onClick={onBack}
            className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
            >
            ← Regresar
            </button>
            <button
            onClick={() => navigate(`/dashboard/${rango}`)}
            className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
            >
            🏠 Inicio
            </button>
        </div>

        {/* Tarjeta de Contenido Principal */}
            <div
                className="bg-white p-5 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl"
                translate="no"
            >
                {/* Titulo Principal */}
                <h1
                    className="text-center font-extrabold text-blue-900 mb-12 uppercase tracking-wide"
                    style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
                >
                    {data?.titulo}
                </h1>

                {pasos.map((paso) => {
                    const contenido = paso.contenido || {};
                    const tieneImagen = !!paso.imagen;
                    const alternarColumnas = paso.id % 2 === 0;

                    return (
                        <div
                            key={paso.id}
                            className="mb-16 last:mb-6 pb-6 last:pb-0"
                        >
                            <div className={`grid grid-cols-1 ${tieneImagen ? "lg:grid-cols-12" : "grid-cols-1"} gap-8 items-center`}>
                                
                                {/* Columna de Información */}
                                <div className={`space-y-6 ${tieneImagen ? "lg:col-span-7" : ""} ${tieneImagen && alternarColumnas ? "lg:order-2" : ""}`}>
                                    
                                    {/* Encabezado con Número Gigante */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-5xl md:text-7xl font-black text-sky-500 select-none leading-none">
                                            {paso.id}
                                        </span>
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 leading-tight">
                                            {contenido.tituloSecundario}
                                        </h2>
                                    </div>

                                    {/* Descripción */}
                                    <p className="text-xl text-gray-700 font-medium leading-relaxed">
                                        {contenido.descripcion}
                                    </p>

                                    {/* Bloque Destacado de Ejemplos */}
                                    {contenido.subtitulo && (
                                        <div className="bg-sky-50 border-2 border-sky-100 text-blue-950 rounded-3xl p-6 md:p-8 shadow-inner">
                                            <h3 className="text-xl font-bold text-sky-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <span>🪙</span> {contenido.subtitulo}
                                            </h3>

                                            <div className="space-y-3">
                                                {contenido.puntos?.map((punto, index) => (
                                                    <div key={index} className="flex items-start bg-white/60 p-3 rounded-xl border border-sky-100/50">
                                                        <span className="text-yellow-500 text-2xl mr-3 select-none">
                                                            ⭐
                                                        </span>
                                                        <p className="text-lg md:text-xl font-semibold text-gray-800">{punto}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Columna de la Imagen Animada */}
                                {tieneImagen && (
                                    <div className={`w-full flex justify-center items-center lg:col-span-5 ${alternarColumnas ? "lg:order-1" : ""}`}>
                                        <div className="relative p-2">
                                            {/* Sombra de fondo abstracta */}
                                            <div className="absolute inset-0 bg-yellow-200 rounded-full blur-3xl opacity-30 transform -translate-y-4"></div>
                                            <img
                                                src={paso.imagen}
                                                alt={contenido.tituloSecundario || "Ilustración del paso"}
                                                className="w-64 md:w-80 object-contain animate-float filter drop-shadow-lg relative z-10" // Cambiado a animate-float
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mensaje final */}
                            {contenido.mensajeFinal && (
                                <div className="bg-amber-50 border-l-8 border-yellow-400 rounded-2xl p-6 text-xl font-bold text-blue-900 mt-8 shadow-sm">
                                    {contenido.mensajeFinal.split('\n').map((linea, index) => (
                                        <p key={index} className="mb-2 last:mb-0">{linea}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Boton de Continuar */}
                <button
                    onClick={handleContinue}
                    className="w-full mt-6 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98 shadow-lg transition-all duration-200"
                >
                    Comenzar actividad
                </button>
            </div>
        </LayoutActividad>
    );
};

export default Act02;