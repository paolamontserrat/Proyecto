import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para las respuestas de texto
    const [respEscuela, setRespEscuela] = useState("");
    const [respCasa, setRespCasa] = useState("");
    const [respDinero, setRespDinero] = useState("");
    const [error, setError] = useState("");

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act06-${rango}-${userId}`;

    // Cargar datos guardados previamente
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (parsed.respEscuela) setRespEscuela(parsed.respEscuela);
                if (parsed.respCasa) setRespCasa(parsed.respCasa);
                if (parsed.respDinero) setRespDinero(parsed.respDinero);
            } catch (e) {
                console.error("Error al cargar progreso local", e);
            }
        }
    }, []);

    // Validar en tiempo real si el usuario está escribiendo respuestas muy cortas
    useEffect(() => {
        setError("");
        if (respEscuela && respEscuela.trim().length < 5) {
            setError("Por favor, explica detalladamente cómo eres responsable en la escuela.");
            return;
        }
        if (respCasa && respCasa.trim().length < 5) {
            setError("Por favor, escribe de forma más completa tu responsabilidad en casa.");
            return;
        }
        if (respDinero && respDinero.trim().length < 5) {
            setError("Por favor, describe con más detalle cómo eres responsable con tu dinero.");
            return;
        }
    }, [respEscuela, respCasa, respDinero]);

    // El formulario está listo si todos los campos están respondidos sin errores
    const formularioValido =
        respEscuela.trim() !== "" &&
        respCasa.trim() !== "" &&
        respDinero.trim() !== "" &&
        !error;

    // Sincronizar y guardar el progreso
    const guardarProgreso = async (datos) => {
        localStorage.setItem(storageKey, JSON.stringify(datos));

        if (userId !== "anon" && data.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: data.id,
                            datos_actividad: datos,
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

    const handleReset = () => {
        setRespEscuela("");
        setRespCasa("");
        setRespDinero("");
        setError("");
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!formularioValido) {
            setError("Por favor, responde todas las preguntas antes de continuar.");
            return;
        }

        const datosCompletos = {
            respEscuela,
            respCasa,
            respDinero,
        };

        await guardarProgreso(datosCompletos);
        onComplete();
    };

    return (
        <LayoutActividad fondo={data.fondo}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación superior básica */}
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
                    className="text-center font-extrabold text-blue-900 mb-10"
                    style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.3rem)" }}
                >
                    {data.titulo || "Alianzito ayúdanos a completar:"}
                </h1>

                {/* Contenedor de Formularios con las Imágenes Reales y Animación */}
                <div className="space-y-8 max-w-3xl mx-auto">
                    
                    {/* Sección 1: Escuela (Imagen 22.png a la izquierda) */}
                    {data.secciones?.escuela && (
                        <div>
                            <h2 className="text-xl font-bold text-blue-900 mb-3 text-center md:text-left">
                                {data.secciones.escuela.titulo}
                            </h2>
                            <div className="relative flex flex-col md:flex-row items-center bg-gray-50 border-2 border-gray-200 rounded-3xl p-4 shadow-inner gap-4 min-h-[140px] overflow-visible">
                                <img
                                    src={`${data.secciones.escuela.imagen}`}
                                    alt="Responsabilidad Escuela"
                                    className="w-24 h-auto object-contain select-none md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2 animate-float filter drop-shadow-md"
                                />
                                <textarea
                                    value={respEscuela}
                                    onChange={(e) => setRespEscuela(e.target.value)}
                                    placeholder={data.secciones.escuela.placeholder}
                                    className="w-full h-24 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none font-semibold text-gray-700 text-base md:pl-28 leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sección 2: Casa (Imagen 10.png a la derecha y más grande) */}
                    {data.secciones?.casa && (
                        <div>
                            <h2 className="text-xl font-bold text-blue-900 mb-3 text-center md:text-left">
                                {data.secciones.casa.titulo}
                            </h2>
                            <div className="relative flex flex-col md:flex-row-reverse items-center bg-gray-50 border-2 border-gray-200 rounded-3xl p-4 shadow-inner gap-4 min-h-[140px] overflow-visible">
                                <img
                                    src={`${data.secciones.casa.imagen}`}
                                    alt="Responsabilidad Casa"
                                    className="w-38 h-auto object-contain select-none md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 animate-float filter drop-shadow-md"
                                />
                                <textarea
                                    value={respCasa}
                                    onChange={(e) => setRespCasa(e.target.value)}
                                    placeholder={data.secciones.casa.placeholder}
                                    className="w-full h-24 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none font-semibold text-gray-700 text-base md:pr-40 leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sección 3: Dinero (Imagen 23.png a la izquierda y más grande) */}
                    {data.secciones?.dinero && (
                        <div>
                            <h2 className="text-xl font-bold text-blue-900 mb-3 text-center md:text-left">
                                {data.secciones.dinero.titulo}
                            </h2>
                            <div className="relative flex flex-col md:flex-row items-center bg-gray-50 border-2 border-gray-200 rounded-3xl p-4 shadow-inner gap-4 min-h-[140px] overflow-visible">
                                <img
                                    src={`${data.secciones.dinero.imagen}`}
                                    alt="Responsabilidad Dinero"
                                    className="w-32 h-auto object-contain select-none md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2 animate-float filter drop-shadow-md"
                                />
                                <textarea
                                    value={respDinero}
                                    onChange={(e) => setRespDinero(e.target.value)}
                                    placeholder={data.secciones.dinero.placeholder}
                                    className="w-full h-24 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none font-semibold text-gray-700 text-base md:pl-36 leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Banner de error interactivo */}
                {error && (
                    <div className="max-w-3xl mx-auto mt-6 bg-red-100 border-l-8 border-red-500 text-red-900 p-4 rounded-xl font-bold text-lg">
                        ⚠️ {error}
                    </div>
                )}

                {/* Fila de Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-3xl mx-auto">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!formularioValido}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !formularioValido
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