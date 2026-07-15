import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
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
    const storageKey = `act01-${rango}-${userId}`;

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
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta de Contenido Principal */}
            <div
                className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl"
                translate="no"
            >
                {/* Título Principal */}
                <h1
                    className="text-center font-extrabold text-blue-900 mb-10"
                    style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
                >
                    {data?.titulo}
                </h1>

                {/* Iteramos los sub-pasos */}
                {pasos.map((paso) => {
                    const contenido = paso.contenido || {};
                    const tieneImagen = !!paso.imagen;

                    return (
                        <div
                            key={paso.id}
                            className="mb-12 last:mb-4 border-b last:border-0 pb-6 last:pb-0 border-gray-100"
                        >
                            {/* Encabezado del Sub-paso */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-yellow-400 flex items-center justify-center font-black text-2xl text-blue-900">
                                    {paso.id}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                                    {contenido.tituloSecundario}
                                </h2>
                            </div>

                            {/* Contenedor de Columnas (Se activa si hay imagen) */}
                            <div className={`grid grid-cols-1 ${tieneImagen ? "md:grid-cols-2" : ""} gap-8 items-center`}>
                                
                                {/* Columna Izquierda: Información */}
                                <div className="space-y-6">
                                    {/* Descripción */}
                                    <p className="text-xl text-gray-800">
                                        {contenido.descripcion}
                                    </p>

                                    {/* Bloque Destacado Azul */}
                                    <div className="bg-sky-600 text-white rounded-3xl p-6 md:p-8">
                                        <h3 className="text-2xl font-bold italic mb-4">
                                            {contenido.subtitulo}
                                        </h3>

                                        <div className="space-y-3">
                                            {contenido.puntos?.map((punto, index) => (
                                                <div key={index} className="flex items-start">
                                                    {/* Nuevo icono: Estrella brillante */}
                                                    <span className="text-yellow-300 text-2xl mr-3 select-none">
                                                        ⭐
                                                    </span>
                                                    <p className="text-xl">{punto}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha: Imagen Animada (Solo renderiza si existe) */}
                                {tieneImagen && (
                                    <div className="w-full flex justify-center items-center p-4">
                                        <img
                                            src={paso.imagen}
                                            alt={contenido.tituloSecundario || "Ilustración"}
                                            className="w-64 md:w-80 object-contain animate-float filter drop-shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Mensaje Final abajo de las columnas */}
                            {contenido.mensajeFinal && (
                                <div className="bg-yellow-100 border-l-8 border-yellow-400 rounded-xl p-5 text-xl font-semibold text-blue-900 mt-6">
                                    {contenido.mensajeFinal}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Botón de continuar */}
                <button
                    onClick={handleContinue}
                    className="w-full mt-4 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98 shadow-md transition-all"
                >
                    Continuar
                </button>
            </div>
        </LayoutActividad>
    );
};

export default Act01;