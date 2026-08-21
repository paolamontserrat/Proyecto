import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const comparativo = config.comparativo || {
        titulo: "¿Dónde está más seguro mi dinero?",
        columnaCasa: {
            titulo: "Guardado en casa",
            puntos: ["Puede perderse", "No genera beneficios", "No hay control"]
        },
        columnaCaja: {
            titulo: "Guardado en Caja Popular Cerano",
            puntos: ["Está registrado", "Puede generar rendimientos", "Puedes revisar tu ahorro"]
        }
    };

    const conclusion = config.conclusion || {
        titulo: "CONCLUSIÓN",
        texto: "En casa mi dinero puede correr riesgos.\nEn la Caja mi dinero está protegido, registrado y puede crecer.\nSer inteligente no es esconder el dinero.\nEs saber dónde está más seguro."
    };

    // Estado para almacenar las 5 respuestas escritas por el usuario
    const [respuestas, setRespuestas] = useState(["", "", "", "", ""]);

    // --- Persistencia de Datos (Supabase + LocalStorage) ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act06-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar
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

                    if (progreso?.datos_actividad?.respuestas) {
                        setRespuestas(progreso.datos_actividad.respuestas);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ respuestas: progreso.datos_actividad.respuestas })
                        );
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }

            // Fallback al LocalStorage
            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (Array.isArray(parsed.respuestas) && parsed.respuestas.length === 5) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Manejar el cambio en cada uno de los inputs
    const handleInputChange = (index, value) => {
        const nuevasRespuestas = [...respuestas];
        nuevasRespuestas[index] = value;
        setRespuestas(nuevasRespuestas);

        localStorage.setItem(storageKey, JSON.stringify({ respuestas: nuevasRespuestas }));
    };

    // Validar que los 5 campos tengan texto escrito (sin contar espacios vacíos)
    const estanTodasCompletas = respuestas.every((res) => res.trim().length > 0);

    const handleReset = () => {
        const vacio = ["", "", "", "", ""];
        setRespuestas(vacio);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!estanTodasCompletas) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas, completado: true },
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

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Botones superiores de navegación */}
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

            {/* Contenedor principal de la actividad */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* Título y Subtítulo */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-2xl md:text-4xl">
                        {config.titulo || "Actividad detective financiero"}
                    </h1>
                    <p className="text-gray-600 font-semibold mt-2 text-lg">
                        {config.subtitulo || "Identifica cinco ventajas de ahorrar en la Caja."}
                    </p>
                </div>

                {/* SECCIÓN 1: Cuadro Comparativo */}
                <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-4 md:p-6 shadow-sm max-w-4xl mx-auto">
                    <h2 className="text-center text-xl md:text-2xl font-black text-sky-900 mb-6 bg-sky-200/60 py-2 px-4 rounded-full">
                        {comparativo.titulo}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna: Guardado en casa */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-red-500 font-black text-2xl mb-2">❌</span>
                            <h3 className="font-bold text-amber-900 text-lg md:text-xl text-center mb-4 border-b-2 border-amber-200 pb-2 w-full">
                                {comparativo.columnaCasa?.titulo}
                            </h3>
                            <div className="space-y-3 w-full">
                                {comparativo.columnaCasa?.puntos?.map((punto, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-xl border border-amber-200 text-amber-950 font-semibold text-center text-sm md:text-base shadow-sm">
                                        {punto}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Columna: Guardado en Caja Popular */}
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-emerald-600 font-black text-2xl mb-2">🛡️</span>
                            <h3 className="font-bold text-emerald-900 text-lg md:text-xl text-center mb-4 border-b-2 border-emerald-200 pb-2 w-full">
                                {comparativo.columnaCaja?.titulo}
                            </h3>
                            <div className="space-y-3 w-full">
                                {comparativo.columnaCaja?.puntos?.map((punto, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-xl border border-emerald-200 text-emerald-950 font-semibold text-center text-sm md:text-base shadow-sm">
                                        {punto}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: Campos para escribir 5 ventajas */}
                <div className="max-w-3xl mx-auto bg-amber-50/50 border-2 border-amber-100 p-6 rounded-3xl">
                    <h3 className="text-blue-900 font-extrabold text-xl mb-4 text-center">
                        Escribe aquí 5 ventajas que identificaste:
                    </h3>

                    <div className="space-y-3">
                        {respuestas.map((res, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="bg-alianza-amarillo text-blue-900 font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 shadow-sm">
                                    {index + 1}
                                </span>
                                <input
                                    type="text"
                                    value={res}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    placeholder={`Ventaja ${index + 1}...`}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-medium text-gray-800 shadow-inner transition-all bg-white"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECCIÓN 3: Conclusión */}
                <div className="bg-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-lg max-w-3xl mx-auto text-center border-4 border-sky-400">
                    <h3 className="text-yellow-400 font-black text-2xl mb-3 tracking-wider">
                        {conclusion.titulo}
                    </h3>
                    <p className="text-base md:text-lg font-medium whitespace-pre-line leading-relaxed text-blue-50">
                        {conclusion.texto}
                    </p>
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estanTodasCompletas}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estanTodasCompletas
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act06;