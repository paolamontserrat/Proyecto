import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const preguntas = config.preguntas || [];
    const retroalimentaciones = config.retroalimentaciones || [];

    const [seleccionadas, setSeleccionadas] = useState([]);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act8-${rango}-${userId}`;

    // Obtener la retroalimentación basada en el conteo actual
    const getRetroalimentacion = (count) => {
        return (
            retroalimentaciones.find((r) => count >= r.min && count <= r.max) ||
            retroalimentaciones[0]
        );
    };

    const resultadoActual = getRetroalimentacion(seleccionadas.length);

    // Cargar progreso guardado desde Supabase o LocalStorage
    useEffect(() => {
        const cargarProgreso = async () => {
            let datosGuardados = null;

            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso, error } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (!error && progreso?.datos_actividad) {
                        datosGuardados = progreso.datos_actividad;
                    }
                } catch (err) {
                    console.warn("Error cargando de Supabase, intentando local", err);
                }
            }

            if (!datosGuardados) {
                const localData = localStorage.getItem(storageKey);
                if (localData) {
                    try {
                        datosGuardados = JSON.parse(localData);
                    } catch (e) {
                        console.error("Error al parsear localStorage", e);
                    }
                }
            }

            if (datosGuardados && Array.isArray(datosGuardados.seleccionadas)) {
                setSeleccionadas(datosGuardados.seleccionadas);
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    // Función unificada para guardar localmente y en Supabase
    const guardarProgreso = async (nuevasSeleccionadas) => {
        const retro = getRetroalimentacion(nuevasSeleccionadas.length);
        const payload = {
            seleccionadas: nuevasSeleccionadas,
            resultado: retro?.titulo || null,
            fechaActualizacion: new Date().toISOString()
        };

        // Guardar LocalStorage
        localStorage.setItem(storageKey, JSON.stringify(payload));

        // Guardar Supabase
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error sincronizando con Supabase:", err);
            }
        }
    };

    // Alternar selección de opciones
    const toggleSeleccion = (id) => {
        const nuevasSeleccionadas = seleccionadas.includes(id)
            ? seleccionadas.filter((item) => item !== id)
            : [...seleccionadas, id];

        setSeleccionadas(nuevasSeleccionadas);
        guardarProgreso(nuevasSeleccionadas);
    };

    const handleContinue = async () => {
        await guardarProgreso(seleccionadas);
        if (onComplete) {
            onComplete();
        }
    };

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
            `}</style>

            {/* NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* CONTENEDOR PRINCIPAL DOS COLUMNAS */}
            <div 
                className="bg-white p-5 sm:p-8 rounded-3xl border-4 border-amber-300 shadow-2xl max-w-3xl mx-auto space-y-6"
                translate="no"
            >
                
                {/* COLUMNA IZQUIERDA: CHECKLIST DE PREGUNTAS */}
                <div className="md:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300 shadow-2xl space-y-4">
                    <div className="text-center space-y-1">
                        <h1 className="text-xl sm:text-2xl font-black text-blue-900 italic">
                            {config.titulo || "¿Qué tan buen ahorrador eres?"}
                        </h1>
                        <p className="text-sm sm:text-base font-extrabold text-blue-950">
                            <span className="text-blue-900 font-black">Instrucciones: </span>
                            {config.instrucciones || "Marca las acciones que haces casi siempre."}
                        </p>
                    </div>

                    {/* LISTA DE OPCIONES */}
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {preguntas.map((item) => {
                            const checked = seleccionadas.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleSeleccion(item.id)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border-2 select-none ${
                                        checked
                                            ? 'bg-blue-900 text-white border-blue-950 shadow-md scale-[1.01]'
                                            : 'bg-sky-50 text-blue-950 border-sky-200 hover:bg-sky-100'
                                    }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            checked
                                                ? 'bg-amber-400 border-white text-blue-950 font-black'
                                                : 'bg-white border-sky-300'
                                        }`}
                                    >
                                        {checked && '✓'}
                                    </div>
                                    <p className="font-extrabold text-sm sm:text-base leading-snug">
                                        {item.texto}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMNA DERECHA: RESULTADO INTERACTIVO EN TIEMPO REAL */}
                <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border-4 border-amber-300 shadow-2xl text-center space-y-4 md:sticky md:top-6">
                    
                    {/* ENCABEZADO Y NIVEL */}
                    <div className="bg-blue-950 text-white p-4 rounded-2xl shadow-md border-2 border-amber-300 space-y-1">
                        <span className="bg-amber-400 text-blue-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            {seleccionadas.length} de {preguntas.length} seleccionadas
                        </span>
                        {resultadoActual?.subtitulo && (
                            <p className="text-lg font-black text-amber-400 uppercase tracking-wide mt-1">
                                {resultadoActual.subtitulo}
                            </p>
                        )}
                        <h2 className="text-xl font-black text-amber-300">
                            {resultadoActual?.titulo}
                        </h2>
                    </div>

                    {/* IMAGÉN DINÁMICA DE ALIANZITO */}
                    {resultadoActual?.imagen && (
                        <div className="flex justify-center py-1">
                            <img
                                key={resultadoActual.imagen} // Fuerza la animación al cambiar de imagen
                                src={resultadoActual.imagen}
                                alt="Alianzito Estado"
                                className="max-h-48 object-contain animate-float-slow transition-all duration-300"
                            />
                        </div>
                    )}

                    {/* MENSAJE DINÁMICO */}
                    <div className="space-y-1 bg-sky-50 p-3 rounded-xl border border-sky-200">
                        <p className="text-xs font-black text-blue-900 uppercase">Alianzito dice:</p>
                        <p className="text-sm font-bold text-blue-950 italic">
                            {resultadoActual?.mensaje}
                        </p>
                    </div>

                    {/* PREMIO / MEDALLA EN TIEMPO REAL */}
                    {resultadoActual?.premioTexto && (
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-center gap-3 shadow-sm">
                            {resultadoActual.premioImagen && (
                                <img
                                    src={resultadoActual.premioImagen}
                                    alt={resultadoActual.premioTexto}
                                    className="w-10 h-10 object-contain animate-float-slow"
                                />
                            )}
                            <p className="font-extrabold text-xs text-blue-900 text-left">
                                Premio desbloqueado: <br />
                                <span className="font-black text-amber-600 text-sm">{resultadoActual.premioTexto}</span>
                            </p>
                        </div>
                    )}

                    {/* BOTÓN DE COMPLETAR/CONTINUAR */}
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full py-3.5 rounded-full font-black text-base shadow-lg transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer mt-2"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;