import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const diferenciasTotales = config.diferencias || [
        { id: 1, x: 51, y: 12, radio: 6 },
        { id: 2, x: 45, y: 28, radio: 5 },
        { id: 3, x: 62, y: 48, radio: 6 },
        { id: 4, x: 40, y: 87, radio: 6 },
        { id: 5, x: 30, y: 76, radio: 6 }
    ];

    const [diferenciasEncontradas, setDiferenciasEncontradas] = useState([]);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act14-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.diferenciasEncontradas) {
                        setDiferenciasEncontradas(progreso.datos_actividad.diferenciasEncontradas);
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.diferenciasEncontradas) {
                        setDiferenciasEncontradas(parsed.diferenciasEncontradas);
                    }
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Manejar clics sobre la imagen para detectar diferencias
    const handleImageClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;

        diferenciasTotales.forEach((dif) => {
            if (diferenciasEncontradas.includes(dif.id)) return;

            // Calcular distancia en porcentaje
            const dx = clickX - dif.x;
            const dy = clickY - dif.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia <= (dif.radio || 7)) {
                const nuevas = [...diferenciasEncontradas, dif.id];
                setDiferenciasEncontradas(nuevas);
                localStorage.setItem(storageKey, JSON.stringify({ diferenciasEncontradas: nuevas }));
            }
        });
    };

    const handleReset = () => {
        setDiferenciasEncontradas([]);
        localStorage.removeItem(storageKey);
    };

    const completado = diferenciasEncontradas.length === diferenciasTotales.length;

    const handleContinue = async () => {
        if (!completado) return;

        const estadoGuardar = {
            diferenciasEncontradas,
            completado: true,
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-6" translate="no">

                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "ACTIVIDAD 14: ENCUENTRA LAS 5 DIFERENCIAS"}
                    </h1>
                    <p className="text-gray-700 font-bold text-base md:text-lg">
                        {config.subtitulo || "Observa con atención ambas imágenes y toca las diferencias."}
                    </p>
                    <div className="inline-block bg-amber-400 text-blue-950 px-6 py-2 rounded-full font-black text-lg shadow">
                        Diferencias encontradas: {diferenciasEncontradas.length} / {diferenciasTotales.length}
                    </div>
                </div>

                {/* Contenedor de Imágenes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-center">

                    {/* Imagen Original */}
                    <div className="flex flex-col items-center space-y-2">
                        <span className="bg-blue-900 text-white font-extrabold px-4 py-1 rounded-full text-sm">
                            Imagen 1 (Original)
                        </span>
                        <div className="relative rounded-2xl overflow-hidden border-4 border-blue-900 shadow-md w-full bg-black">
                            <img
                                src={config.imagenOriginal || "/images/14/33.jpg"}
                                alt="Imagen Original"
                                className="w-full h-auto object-contain select-none"
                            />
                        </div>
                    </div>

                    {/* Imagen Modificada Interactiva */}
                    <div className="flex flex-col items-center space-y-2">
                        <span className="bg-amber-500 text-white font-extrabold px-4 py-1 rounded-full text-sm">
                            Imagen 2 (Toca aquí las diferencias)
                        </span>
                        <div
                            onClick={handleImageClick}
                            className="relative rounded-2xl overflow-hidden border-4 border-amber-400 shadow-md w-full cursor-pointer bg-black select-none"
                        >
                            <img
                                src={config.imagenModificada || "/images/14/34.jpg"}
                                alt="Imagen Modificada"
                                className="w-full h-auto object-contain pointer-events-none"
                            />

                            {/* Marcas de diferencias encontradas */}
                            {diferenciasTotales.map((dif) => {
                                if (!diferenciasEncontradas.includes(dif.id)) return null;
                                return (
                                    <div
                                        key={dif.id}
                                        style={{
                                            left: `${dif.x}%`,
                                            top: `${dif.y}%`,
                                            width: `${(dif.radio || 6) * 2}%`,
                                            height: `${(dif.radio || 6) * 2}%`,
                                        }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 rounded-full bg-red-500/30 animate-bounce pointer-events-none"
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Botones de Acción (Reiniciar y Completar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
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
                        Finalizar 🎉
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act11;