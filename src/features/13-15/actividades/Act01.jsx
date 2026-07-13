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
            {/* Título Principal del paso actual */}
            <h1
            className="text-center font-extrabold text-blue-900 mb-10"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
            >
            {data?.titulo}
            </h1>

            {/* Iteramos los sub-pasos agrupados en esta pantalla */}
            {pasos.map((paso) => {
            const contenido = paso.contenido || {};
            return (
                <div
                key={paso.id}
                className="mb-8 last:mb-4"
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

                {/* Descripción */}
                <p className="text-xl text-gray-800 mb-6">
                    {contenido.descripcion}
                </p>

                {/* Bloque Destacado Azul */}
                <div className="bg-sky-600 text-white rounded-3xl p-6 md:p-8 mb-6">
                    <h3 className="text-2xl font-bold italic mb-4">
                    {contenido.subtitulo}
                    </h3>

                    <div className="space-y-3">
                    {contenido.puntos?.map((punto, index) => (
                        <div key={index} className="flex items-start">
                        <span className="text-yellow-300 text-2xl mr-3 select-none">
                            ✔
                        </span>
                        <p className="text-xl">{punto}</p>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Imagen si existe */}
                {paso.imagen && (
                    <div className="w-full flex justify-center mb-6">
                    <img
                        src={paso.imagen}
                        alt={contenido.tituloSecundario || "Ilustración"}
                        className="w-64 md:w-80 object-contain"
                    />
                    </div>
                )}

                {/* Mensaje Final */}
                {contenido.mensajeFinal && (
                    <div className="bg-yellow-100 border-l-8 border-yellow-400 rounded-xl p-5 text-xl font-semibold text-blue-900">
                    {contenido.mensajeFinal}
                    </div>
                )}
                </div>
            );
            })}

            {/* Botón de continuar al siguiente paso del contenedor */}
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