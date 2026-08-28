import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    // Registrar la visualización/lectura
    useEffect(() => {
        const registrarLectura = async () => {
            localStorage.setItem(storageKey, JSON.stringify({ leido: true }));

            if (userId !== "anon" && config.id) {
                try {
                    await supabase.from("progreso_actividades").upsert(
                        {
                            usuario_id: userId,
                            actividad_id: config.id,
                            datos_actividad: { leido: true },
                            completada: true,
                        },
                        { onConflict: "usuario_id,actividad_id" }
                    );
                } catch (err) {
                    console.warn("Error al registrar lectura en Supabase", err);
                }
            }
        };

        registrarLectura();
    }, [config.id, userId, storageKey]);

    const handleContinue = async () => {
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { completado: true },
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

    const secciones = config.secciones || [];

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación superior */}
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

            {/* Tarjeta principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative space-y-8" translate="no">
                
                {/* Encabezado Principal */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-3xl md:text-5xl tracking-wide uppercase">
                        {config.titulo}
                    </h1>
                    {config.subtitulo && (
                        <p className="text-purple-900 font-black mt-2 text-lg md:text-2xl">
                            {config.subtitulo}
                        </p>
                    )}
                </div>

                {/* Imagen de Portada Informativa */}
                {config.imagenPortada && (
                    <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-lg border-2 border-sky-300">
                        <img 
                            src={config.imagenPortada} 
                            alt="Valor Cooperativo Igualdad" 
                            className="w-full h-auto object-cover max-h-96"
                        />
                    </div>
                )}

                {/* Render de Secciones Lectura */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {secciones.map((sec) => (
                        <div key={sec.id} className="bg-sky-50/60 p-5 md:p-8 rounded-3xl border-2 border-sky-300 shadow-sm space-y-4">
                            <h2 className="font-extrabold text-blue-900 text-xl md:text-3xl">
                                {sec.titulo}
                            </h2>

                            {sec.descripcion && (
                                <p className="text-gray-800 font-medium text-base md:text-xl leading-relaxed">
                                    {sec.descripcion}
                                </p>
                            )}

                            {sec.subtituloPuntos && (
                                <p className="text-blue-950 font-bold text-base md:text-lg">
                                    {sec.subtituloPuntos}
                                </p>
                            )}

                            {sec.puntos && (
                                <ul className="list-disc list-inside space-y-2 text-gray-800 font-semibold text-base md:text-lg pl-2">
                                    {sec.puntos.map((pt, i) => (
                                        <li key={i}>{pt}</li>
                                    ))}
                                </ul>
                            )}

                            {/* Bloques Especiales para Sección Cooperativa */}
                            {sec.bloque1 && (
                                <div className="bg-blue-900 text-white p-5 rounded-2xl space-y-2 mt-4">
                                    <h3 className="font-bold text-alianza-amarillo text-lg md:text-xl">{sec.bloque1.subtitulo}</h3>
                                    <ul className="list-disc list-inside space-y-1 font-medium text-base md:text-lg">
                                        {sec.bloque1.puntos.map((p, idx) => (
                                            <li key={idx}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {sec.bloque2 && (
                                <div className="bg-blue-900 text-white p-5 rounded-2xl space-y-2 mt-2">
                                    <h3 className="font-bold text-alianza-amarillo text-lg md:text-xl">{sec.bloque2.subtitulo}</h3>
                                    <ul className="list-disc list-inside space-y-1 font-medium text-base md:text-lg">
                                        {sec.bloque2.puntos.map((p, idx) => (
                                            <li key={idx}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {sec.imagen && (
                                <div className="pt-2 rounded-2xl overflow-hidden">
                                    <img src={sec.imagen} alt={sec.titulo} className="w-full h-auto rounded-2xl shadow-md max-h-96 object-cover" />
                                </div>
                            )}

                            {sec.pieDePagina && (
                                <p className="text-blue-900 font-extrabold text-center text-lg md:text-xl pt-2">
                                    {sec.pieDePagina}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Botón de Continuar Centrado */}
                <div className="flex justify-center max-w-xs mx-auto mt-8">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 rounded-full font-black text-xl shadow-lg bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95 transition-all"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;