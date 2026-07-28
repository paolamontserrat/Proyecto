import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const compromisosList = config.compromisos || [];
    const preguntasList = config.preguntasEvaluacion || [];

    // Estado local para checkboxes y firma
    const [checksCompromisos, setChecksCompromisos] = useState({});
    const [firma, setFirma] = useState("");
    const [checksPreguntas, setChecksPreguntas] = useState({});

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

    // Cargar progreso guardado desde Supabase o LocalStorage
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso, error } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) {
                        const datosNube = progreso.datos_actividad?.respuestas;
                        if (datosNube) {
                            setChecksCompromisos(datosNube.checksCompromisos || {});
                            setFirma(datosNube.firma || "");
                            setChecksPreguntas(datosNube.checksPreguntas || {});
                            localStorage.setItem(storageKey, JSON.stringify({ respuestas: datosNube }));
                            return;
                        }
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }

            // Fallback LocalStorage
            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestas) {
                        setChecksCompromisos(parsed.respuestas.checksCompromisos || {});
                        setFirma(parsed.respuestas.firma || "");
                        setChecksPreguntas(parsed.respuestas.checksPreguntas || {});
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Guardar cambios en el estado y almacenamiento
    const actualizarProgreso = (nuevosCompromisos, nuevaFirma, nuevasPreguntas) => {
        const respuestasData = {
            checksCompromisos: nuevosCompromisos,
            firma: nuevaFirma,
            checksPreguntas: nuevasPreguntas
        };
        localStorage.setItem(storageKey, JSON.stringify({ respuestas: respuestasData }));
    };

    const handleToggleCompromiso = (id) => {
        const actualizados = { ...checksCompromisos, [id]: !checksCompromisos[id] };
        setChecksCompromisos(actualizados);
        actualizarProgreso(actualizados, firma, checksPreguntas);
    };

    const handleFirmaChange = (e) => {
        const valor = e.target.value;
        setFirma(valor);
        actualizarProgreso(checksCompromisos, valor, checksPreguntas);
    };

    const handleTogglePregunta = (index) => {
        const actualizados = { ...checksPreguntas, [index]: !checksPreguntas[index] };
        setChecksPreguntas(actualizados);
        actualizarProgreso(checksCompromisos, firma, actualizados);
    };

    // Validación para habilitar el botón "Continuar"
    const estaCompleto = () => {
        const todosCompromisos = compromisosList.length > 0 && compromisosList.every(c => checksCompromisos[c.id]);
        const firmaLlenada = firma.trim().length > 0;
        return todosCompromisos && firmaLlenada;
    };

    const handleContinue = async () => {
        if (!estaCompleto()) return;

        const respuestasData = {
            checksCompromisos,
            firma,
            checksPreguntas
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: respuestasData },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado localmente", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4.5s ease-in-out infinite;
                }
            `}</style>

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

            {/* Contenedor Principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-amber-300 shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* BLOQUE 1: Hoja Estilo Libreta */}
                <div className="bg-slate-100/95 border-l-8 border-l-amber-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                    {/* Anillas simuladas de libreta */}
                    <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-amber-900 rounded-full border border-amber-950"></div>
                        ))}
                    </div>

                    <div className="pl-6 space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl md:text-3xl font-black text-blue-950 uppercase italic tracking-wide">
                                “Mi compromiso con mi historial”
                            </h2>
                            <p className="text-lg md:text-xl font-bold text-gray-800">
                                Cuando cumpla 18 me comprometo a:
                            </p>
                        </div>

                        {/* Checklist de Compromisos */}
                        <div className="space-y-4 max-w-xl mx-auto">
                            {compromisosList.map((comp) => (
                                <label 
                                    key={comp.id} 
                                    className="flex items-center gap-4 bg-white/80 p-3 rounded-xl border border-gray-300 hover:bg-white cursor-pointer transition shadow-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!checksCompromisos[comp.id]}
                                        onChange={() => handleToggleCompromiso(comp.id)}
                                        className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 cursor-pointer shrink-0"
                                    />
                                    <span className="text-base md:text-lg font-bold text-gray-800 leading-snug">
                                        {comp.texto}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* Firma del Joven */}
                        <div className="pt-4 max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3">
                            <span className="font-extrabold text-blue-950 text-lg shrink-0">
                                Firma del joven:
                            </span>
                            <input
                                type="text"
                                value={firma}
                                onChange={handleFirmaChange}
                                placeholder="Escribe tu nombre aquí..."
                                className="w-full bg-transparent border-b-2 border-gray-800 focus:border-amber-600 font-bold text-blue-900 text-lg px-2 py-1 outline-none text-center sm:text-left"
                            />
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: Regla de Oro y Preguntas */}
                <div className="space-y-6">
                    <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-md">
                        <p className="font-black text-lg md:text-xl text-center leading-relaxed">
                            {config.mensajeReglaOro}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Preguntas con Círculos Selección */}
                        <div className="md:col-span-7 space-y-3">
                            {preguntasList.map((pregunta, idx) => (
                                <div 
                                    className="flex items-center gap-4 bg-amber-400/80 hover:bg-amber-400 p-3 rounded-2xl cursor-pointer transition shadow-sm border border-amber-300"
                                >
                                    <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shrink-0 transition-colors ${
                                        checksPreguntas[idx] ? "bg-white text-amber-600" : "bg-white/40"
                                    }`}>
                                        {checksPreguntas[idx] && <span className="font-black text-sm">✓</span>}
                                    </div>
                                    <span className="font-extrabold text-blue-950 text-base md:text-lg leading-tight">
                                        {pregunta}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Personaje (9.png) + Globo de Texto */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
                            <img 
                                src={config.personaje} 
                                alt="Alianzito Reflexivo" 
                                className="w-44 md:w-52 h-auto object-contain animate-float-slow select-none drop-shadow-xl"
                            />

                            <div className="bg-sky-100 border-4 border-sky-400 p-4 rounded-3xl text-center shadow-lg transform -rotate-1">
                                <p className="font-black text-amber-500 text-base md:text-lg leading-snug">
                                    Si no puedes responder con claridad,{" "}
                                    <span className="text-sky-600 uppercase block">aún no es momento.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón Continuar */}
                <div className="pt-2 text-center">
                    <button
                        onClick={handleContinue}
                        disabled={!estaCompleto()}
                        className={`w-full md:w-2/3 py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompleto()
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        {estaCompleto() ? "Terminar" : "Acepta los compromisos y firma para continuar"}
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act12;