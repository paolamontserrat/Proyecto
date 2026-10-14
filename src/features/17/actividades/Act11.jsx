import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estado para las respuestas de la Actividad de Relacionar Conceptos
    const [respuestasConceptos, setRespuestasConceptos] = useState({});

    // Estado para las respuestas de la Simulación de Fraude
    const [respuestaMensaje, setRespuestaMensaje] = useState(null);
    const [respuestaLlamada, setRespuestaLlamada] = useState(null);

    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const d = progreso.datos_actividad;
                        if (d.respuestasConceptos) setRespuestasConceptos(d.respuestasConceptos);
                        if (d.respuestaMensaje !== undefined) setRespuestaMensaje(d.respuestaMensaje);
                        if (d.respuestaLlamada !== undefined) setRespuestaLlamada(d.respuestaLlamada);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.respuestasConceptos) setRespuestasConceptos(d.respuestasConceptos);
                        if (d.respuestaMensaje !== undefined) setRespuestaMensaje(d.respuestaMensaje);
                        if (d.respuestaLlamada !== undefined) setRespuestaLlamada(d.respuestaLlamada);
                    }
                }
            } catch (err) {
                console.warn("Error cargando progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Manejar selección en la actividad de conceptos
    const handleSeleccionarConcepto = (preguntaId, opcion) => {
        const nuevasRespuestas = { ...respuestasConceptos, [preguntaId]: opcion };
        setRespuestasConceptos(nuevasRespuestas);

        localStorage.setItem(
            storageKey,
            JSON.stringify({
                respuestasConceptos: nuevasRespuestas,
                respuestaMensaje,
                respuestaLlamada,
            })
        );
    };

    // Manejar respuesta del mensaje
    const handleRespuestaMensaje = (opcId) => {
        setRespuestaMensaje(opcId);
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                respuestasConceptos,
                respuestaMensaje: opcId,
                respuestaLlamada,
            })
        );
    };

    // Manejar respuesta de la llamada
    const handleRespuestaLlamada = (opcId) => {
        setRespuestaLlamada(opcId);
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                respuestasConceptos,
                respuestaMensaje,
                respuestaLlamada: opcId,
            })
        );
    };

    // Reiniciar todas las respuestas
    const handleReset = () => {
        setRespuestasConceptos({});
        setRespuestaMensaje(null);
        setRespuestaLlamada(null);
        localStorage.removeItem(storageKey);
    };

    // Finalizar y guardar en Supabase
    const handleContinue = async () => {
        const datosAGuardar = {
            respuestasConceptos,
            respuestaMensaje,
            respuestaLlamada,
            completada: true,
        };

        if (userId !== "anon" && data?.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: data.id,
                        datos_actividad: datosAGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

        onComplete();
    };

    // Validaciones de completitud
    const totalPreguntasConceptos = data?.actividadRelacionar?.preguntas?.length || 10;
    const conceptosCorrectos = data?.actividadRelacionar?.preguntas?.every(
        (p) => respuestasConceptos[p.id] === p.respuestaCorrecta
    );

    const fraudeCorrecto =
        respuestaMensaje === data?.simulacionFraude?.mensajeTexto?.respuestaCorrecta &&
        respuestaLlamada === data?.simulacionFraude?.llamada?.respuestaCorrecta;

    const todoCompletado =
        Object.keys(respuestasConceptos).length === totalPreguntasConceptos &&
        conceptosCorrectos &&
        fraudeCorrecto;

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6">
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

            {/* Contenedor Principal (Actividad Par: Tarjeta Clara/Blanca) */}
            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-10 max-w-4xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN */}
                {data?.titulo && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-900 text-yellow-300 px-6 py-3 rounded-full border-2 border-yellow-400 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Protege tu vida financiera"
                                className="max-h-72 object-contain mx-auto animate-float-slow"
                            />
                        )}
                    </div>
                )}

                {/* REFLEXIÓN */}
                {data?.reflexion && (
                    <div className="bg-white text-blue-900 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl space-y-6">
                        <p className="text-base md:text-lg font-medium leading-relaxed whitespace-pre-line text-blue-900">
                            {data.reflexion}
                        </p>

                        {data?.imagenReflexion && (
                            <div className="flex justify-center">
                                <img
                                    src={data.imagenReflexion}
                                    alt="Cuidado de datos"
                                    className="max-h-52 object-contain animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: RELACIONA CONCEPTOS (OPCIÓN MÚLTIPLE) */}
                {data?.actividadRelacionar && (
                    <div className="space-y-6">
                        <div className="bg-blue-950 text-white p-6 rounded-3xl border-4 border-yellow-400 shadow-xl text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase">
                                {data.actividadRelacionar.titulo}
                            </h2>
                            <p className="text-sm md:text-base font-semibold text-blue-100">
                                {data.actividadRelacionar.instrucciones}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {data.actividadRelacionar.preguntas?.map((preg, idx) => {
                                const seleccion = respuestasConceptos[preg.id];
                                const esCorrecto = seleccion === preg.respuestaCorrecta;

                                return (
                                    <div key={preg.id} className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl space-y-4 shadow">
                                        <p className="font-bold text-base md:text-lg text-blue-950">
                                            {idx + 1}. "{preg.definicion}"
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {preg.opciones?.map((opc, opcIdx) => {
                                                const selected = seleccion === opc;
                                                return (
                                                    <button
                                                        key={opcIdx}
                                                        type="button"
                                                        onClick={() => handleSeleccionarConcepto(preg.id, opc)}
                                                        className={`p-3 rounded-xl font-bold text-xs md:text-sm transition-all shadow ${
                                                            selected
                                                                ? esCorrecto
                                                                    ? "bg-amber-600 text-white ring-4 ring-amber-300"
                                                                    : "bg-red-600 text-white ring-4 ring-red-300"
                                                                : "bg-cyan-600 text-white hover:bg-cyan-700"
                                                        }`}
                                                    >
                                                        {opc}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {seleccion && (
                                            <p className={`text-xs font-bold text-center ${esCorrecto ? "text-amber-700" : "text-red-600"}`}>
                                                {esCorrecto ? "¡Correcto! Perfecta relación." : "Opción incorrecta. Revisa el concepto e inténtalo de nuevo."}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 3: SIMULACIÓN DE FRAUDE */}
                {data?.simulacionFraude && (
                    <div className="space-y-6">
                        <div className="bg-blue-900 text-yellow-300 p-4 rounded-2xl border-4 border-yellow-400 text-center shadow-lg">
                            <h2 className="text-2xl font-black uppercase">
                                {data.simulacionFraude.titulo}
                            </h2>
                        </div>

                        {/* CASO 1: MENSAJE DE TEXTO */}
                        {data.simulacionFraude.mensajeTexto && (
                            <div className="bg-blue-50 border-2 border-amber-300 p-6 rounded-3xl space-y-4 shadow-md">
                                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                                    <span>💬</span>
                                    <span>{data.simulacionFraude.mensajeTexto.remitente}</span>
                                </div>
                                <p className="bg-white p-4 rounded-2xl border border-blue-200 text-amber-950 font-bold italic shadow-inner">
                                    {data.simulacionFraude.mensajeTexto.texto}
                                </p>
                                <p className="font-extrabold text-blue-950">
                                    {data.simulacionFraude.mensajeTexto.pregunta}
                                </p>
                                <div className="space-y-2">
                                    {data.simulacionFraude.mensajeTexto.opciones?.map((opc) => {
                                        const selected = respuestaMensaje === opc.id;
                                        const isRight = opc.id === data.simulacionFraude.mensajeTexto.respuestaCorrecta;
                                        return (
                                            <button
                                                key={opc.id}
                                                type="button"
                                                onClick={() => handleRespuestaMensaje(opc.id)}
                                                className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all border-2 shadow ${
                                                    selected
                                                        ? isRight
                                                            ? "bg-amber-600 text-white border-amber-700 font-black"
                                                            : "bg-red-600 text-white border-red-700"
                                                        : "bg-white text-blue-950 border-blue-200 hover:border-blue-500"
                                                }`}
                                            >
                                                {opc.texto}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CASO 2: LLAMADA SOSPECHOSA */}
                        {data.simulacionFraude.llamada && (
                            <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-3xl space-y-4 shadow-md">
                                <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase">
                                    <span>📞</span>
                                    <span>{data.simulacionFraude.llamada.remitente}</span>
                                </div>
                                <p className="bg-amber-200/70 p-4 rounded-2xl border border-amber-400 text-amber-950 font-bold italic shadow-inner">
                                    {data.simulacionFraude.llamada.texto}
                                </p>
                                <p className="font-extrabold text-blue-950">
                                    {data.simulacionFraude.llamada.pregunta}
                                </p>
                                <div className="flex gap-4">
                                    {data.simulacionFraude.llamada.opciones?.map((opc) => {
                                        const selected = respuestaLlamada === opc.id;
                                        const isRight = opc.id === data.simulacionFraude.llamada.respuestaCorrecta;
                                        return (
                                            <button
                                                key={opc.id}
                                                type="button"
                                                onClick={() => handleRespuestaLlamada(opc.id)}
                                                className={`flex-1 py-3 rounded-xl font-black text-lg uppercase transition-all border-2 shadow ${
                                                    selected
                                                        ? isRight
                                                            ? "bg-blue-600 text-white border-blue-700"
                                                            : "bg-red-600 text-white border-red-700"
                                                        : "bg-cyan-600 text-white hover:bg-cyan-700"
                                                }`}
                                            >
                                                {opc.texto}
                                            </button>
                                        );
                                    })}
                                </div>

                                {respuestaLlamada === data.simulacionFraude.llamada.respuestaCorrecta && (
                                    <div className="bg-blue-100 border border-blue-400 text-blue-900 p-4 rounded-2xl font-bold text-center animate-bounce-gentle">
                                        {data.simulacionFraude.llamada.retroalimentacion}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 4: TIP FINANCIERO */}
                {todoCompletado && data?.tipFinanciero && (
                    <div className="bg-blue-900 text-white p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {data.tipFinanciero.imagen && (
                            <img
                                src={data.tipFinanciero.imagen}
                                alt="Tip Financiero"
                                className="max-h-44 object-contain"
                            />
                        )}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-yellow-300 uppercase">
                                {data.tipFinanciero.titulo}
                            </h3>
                            <p className="text-base md:text-lg font-medium text-blue-100 leading-relaxed">
                                {data.tipFinanciero.mensaje}
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y FINALIZAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!todoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !todoCompletado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act11;