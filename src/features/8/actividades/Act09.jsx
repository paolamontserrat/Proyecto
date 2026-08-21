import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const opcionesMultiples = config.preguntasOpcionMultiple || [];
    const checklistPreguntas = config.preguntasChecklist || [];

    // Estado local de las respuestas
    const [respuestasOpciones, setRespuestasOpciones] = useState({});
    const [checklistSeleccionadas, setChecklistSeleccionadas] = useState([]);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act9-${rango}-${userId}`;

    // Cargar progreso desde Supabase o LocalStorage
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
                    console.warn("Error al cargar de Supabase", err);
                }
            }

            if (!datosGuardados) {
                const localData = localStorage.getItem(storageKey);
                if (localData) {
                    try {
                        datosGuardados = JSON.parse(localData);
                    } catch (e) {
                        console.error("Error en localStorage", e);
                    }
                }
            }

            if (datosGuardados) {
                if (datosGuardados.respuestasOpciones) setRespuestasOpciones(datosGuardados.respuestasOpciones);
                if (Array.isArray(datosGuardados.checklistSeleccionadas)) setChecklistSeleccionadas(datosGuardados.checklistSeleccionadas);
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    // Evaluación de respuestas correctas
    const esOpcionCorrecta = (preguntaId, opcionId) => {
        const pregunta = opcionesMultiples.find((p) => p.id === preguntaId);
        if (!pregunta) return false;
        const opcion = pregunta.opciones.find((o) => o.id === opcionId);
        return opcion ? !!opcion.esCorrecta : false;
    };

    const todasOpcionesCorrectas =
        opcionesMultiples.length > 0 &&
        opcionesMultiples.every((p) => {
            const respuesta = respuestasOpciones[p.id];
            return respuesta && esOpcionCorrecta(p.id, respuesta);
        });

    const checklistCompleto =
        checklistPreguntas.length > 0 &&
        checklistSeleccionadas.length === checklistPreguntas.length;

    const todoCorrecto = todasOpcionesCorrectas;

    // Persistencia de progreso
    const guardarProgreso = async (nuevasOpciones, nuevoChecklist) => {
        const payload = {
            respuestasOpciones: nuevasOpciones,
            checklistSeleccionadas: nuevoChecklist,
            fechaActualizacion: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: todoCorrecto,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al sincronizar con Supabase", err);
            }
        }
    };

    // Manejadores
    const handleSelectOpcion = (preguntaId, opcionId) => {
        // Bloquea el cambio si la pregunta ya se respondió correctamente
        const respuestaActual = respuestasOpciones[preguntaId];
        if (respuestaActual && esOpcionCorrecta(preguntaId, respuestaActual)) {
            return;
        }

        const actualizadas = { ...respuestasOpciones, [preguntaId]: opcionId };
        setRespuestasOpciones(actualizadas);
        guardarProgreso(actualizadas, checklistSeleccionadas);
    };

    const toggleChecklist = (id) => {
        const actualizadas = checklistSeleccionadas.includes(id)
            ? checklistSeleccionadas.filter(item => item !== id)
            : [...checklistSeleccionadas, id];

        setChecklistSeleccionadas(actualizadas);
        guardarProgreso(respuestasOpciones, actualizadas);
    };

    const handleReiniciar = async () => {
        setRespuestasOpciones({});
        setChecklistSeleccionadas([]);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestasOpciones: {}, checklistSeleccionadas: [] },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar en Supabase", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!todoCorrecto) return;
        await guardarProgreso(respuestasOpciones, checklistSeleccionadas);
        if (onComplete) onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 3s ease-in-out infinite;
                }
            `}</style>

            {/* BARRA DE NAVEGACIÓN */}
            <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto px-2">
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

            {/* CARD ÚNICA PRINCIPAL */}
            <div 
                className="bg-white p-5 sm:p-8 rounded-3xl border-4 border-amber-300 shadow-2xl max-w-3xl mx-auto space-y-6"
                translate="no"
            >
                {/* SECCIÓN 1: DECISIÓN RESPONSABLE */}
                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-blue-900 leading-tight">
                            Elige la decisión responsable.
                        </h2>
                        <p className="text-sm font-extrabold text-blue-950">
                            Lee cada situación y encierra la respuesta correcta.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {opcionesMultiples.map((p) => {
                            const respuestaSeleccionadaId = respuestasOpciones[p.id];
                            const esPreguntaResueltaCorrecta = respuestaSeleccionadaId && esOpcionCorrecta(p.id, respuestaSeleccionadaId);

                            return (
                                <div key={p.id} className="space-y-3">
                                    <p className="font-black text-blue-950 italic text-base sm:text-lg leading-snug">
                                        {p.id}. {p.situacion}
                                    </p>

                                    <div className="space-y-2">
                                        {p.opciones.map((opcion) => {
                                            const seleccionada = respuestaSeleccionadaId === opcion.id;
                                            const esCorrecta = esOpcionCorrecta(p.id, opcion.id);

                                            // Borde dinámico: azul si es correcta, rojo si es errónea, amber si no está seleccionada
                                            let estyleBorde = "border-amber-400";
                                            if (seleccionada) {
                                                estyleBorde = esCorrecta ? "border-blue-600 ring-2 ring-blue-600" : "border-red-500 ring-2 ring-red-500";
                                            }

                                            return (
                                                <button
                                                    key={opcion.id}
                                                    type="button"
                                                    disabled={esPreguntaResueltaCorrecta}
                                                    onClick={() => handleSelectOpcion(p.id, opcion.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-full font-bold text-sm sm:text-base border-2 transition-all ${estyleBorde} ${
                                                        seleccionada
                                                            ? 'bg-amber-400 text-blue-950 shadow-md scale-[1.01]'
                                                            : 'bg-amber-300/80 text-blue-900 hover:bg-amber-300'
                                                    } ${esPreguntaResueltaCorrecta ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {opcion.texto}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SECCIÓN 2: AUTORRESPONSABILIDAD */}
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-sky-300 text-center space-y-2 shadow-sm">
                        <p className="text-base sm:text-lg font-black text-blue-900 italic leading-snug">
                            {config.subtitulo || "Alianzito aprendió que ser responsable con sus decisiones le ayudó a cumplir su meta."}
                        </p>
                        <div className="border-b-4 border-dashed border-blue-900 w-full my-2"></div>
                        <h3 className="text-lg font-black text-blue-950">
                            ¿Cómo practico la autorresponsabilidad?
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-blue-800">
                            Marca las acciones que practiques casi siempre.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {checklistPreguntas.map((item) => {
                            const checked = checklistSeleccionadas.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleChecklist(item.id)}
                                    className={`flex items-center gap-3 p-3.5 rounded-full cursor-pointer transition-all border-2 select-none ${
                                        checked
                                            ? 'bg-blue-900 text-white border-blue-950 shadow-md'
                                            : 'bg-white text-blue-900 border-sky-300 hover:bg-sky-50'
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
                                    <p className="font-extrabold text-xs sm:text-sm leading-tight">
                                        {item.texto}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BOTONES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        type="button"
                        onClick={handleReiniciar}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                        Reiniciar
                    </button>

                    <button
                        type="button"
                        disabled={!todoCorrecto}
                        onClick={handleContinue}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !todoCorrecto
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 cursor-pointer"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;