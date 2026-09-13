import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const [decisionActualIndex, setDecisionActualIndex] = useState(0);
    const [respuestas, setRespuestas] = useState({}); // { 1: { seleccion: 'INTELIGENTE', esCorrecta: true } }
    const [mostrarFeedback, setMostrarFeedback] = useState(false);
    const [ultimaSeleccion, setUltimaSeleccion] = useState(null);
    const [juegoTerminado, setJuegoTerminado] = useState(false);

    const seccionResultadoRef = useRef(null);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act05-${rango}-${userId}`;

    // Cargar progreso guardado
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

                    if (progreso?.datos_actividad) {
                        const { respuestasGuardadas, terminado } = progreso.datos_actividad;
                        if (respuestasGuardadas) setRespuestas(respuestasGuardadas);
                        if (terminado) {
                            setJuegoIniciado(true);
                            setJuegoTerminado(true);
                            setDecisionActualIndex(config.actividad?.decisiones?.length || 0);
                        }
                        return;
                    }
                } catch (err) {
                    console.warn("Cargando desde LocalStorage...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestas) setRespuestas(parsed.respuestas);
                    if (parsed.terminado) {
                        setJuegoIniciado(true);
                        setJuegoTerminado(true);
                        setDecisionActualIndex(config.actividad?.decisiones?.length || 0);
                    }
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const decisiones = config.actividad?.decisiones || [];
    const totalDecisiones = decisiones.length;
    const decisionActual = decisiones[decisionActualIndex];

    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
    };

    const handleClasificar = (tipoElegido) => {
        if (mostrarFeedback) return;

        const esCorrecta = tipoElegido === decisionActual.tipoCorrecto;
        setUltimaSeleccion(tipoElegido);
        setMostrarFeedback(true);

        const nuevasRespuestas = {
            ...respuestas,
            [decisionActual.id]: {
                seleccion: tipoElegido,
                esCorrecta
            }
        };
        setRespuestas(nuevasRespuestas);
    };

    const handleSiguienteDecision = () => {
        setMostrarFeedback(false);
        setUltimaSeleccion(null);

        const siguienteIndex = decisionActualIndex + 1;
        if (siguienteIndex < totalDecisiones) {
            setDecisionActualIndex(siguienteIndex);
        } else {
            setJuegoTerminado(true);
            setTimeout(() => {
                seccionResultadoRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        }
    };

    const aciertos = Object.values(respuestas).filter((r) => r.esCorrecta).length;

    const handleReset = async () => {
        setJuegoIniciado(false);
        setDecisionActualIndex(0);
        setRespuestas({});
        setMostrarFeedback(false);
        setUltimaSeleccion(null);
        setJuegoTerminado(false);

        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        const payload = {
            respuestas,
            aciertos,
            totalDecisiones,
            terminado: true,
            completado: true
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando progreso en Supabase", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fadeInDown 0.5s ease-out forwards;
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

            {/* Tarjeta Principal Vertical */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8 max-w-4xl mx-auto mb-10" translate="no">

                {/* ENCABEZADO Y REGLA CON ALIANZITO */}
                <div className="bg-sky-50 p-5 md:p-6 rounded-3xl border-2 border-sky-100 text-center space-y-3 relative">
                    <span className="bg-amber-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {config.imagenes?.alianzito && (
                            <img
                                src={config.imagenes.alianzito}
                                alt="Alianzito"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg animate-float-slow"
                            />
                        )}
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="font-extrabold text-blue-900 text-xl md:text-3xl uppercase tracking-wide">
                                {config.regla?.numero}: {config.regla?.titulo}
                            </h1>
                            <p className="text-amber-600 font-extrabold text-base md:text-lg">
                                "{config.regla?.subtitulo}"
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-700 font-medium text-sm md:text-base leading-relaxed max-w-2xl mx-auto pt-2">
                        {config.regla?.descripcion}
                    </p>
                </div>

                {/* BLOQUE IMPORTANCIA */}
                {config.importancia && (
                    <div className="bg-amber-50/80 p-5 rounded-3xl border border-amber-200 text-center space-y-1">
                        <span className="text-amber-800 font-black text-sm uppercase tracking-wide">
                            📌 {config.importancia.titulo}
                        </span>
                        <p className="text-gray-800 font-bold text-base md:text-lg">
                            {config.importancia.texto}
                        </p>
                    </div>
                )}

                {/* BANNER DE LA ACTIVIDAD */}
                <div className="bg-sky-50 border-2 border-sky-200 p-5 rounded-3xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {config.imagenes?.billete && (
                            <img
                                src={config.imagenes.billete}
                                alt="Ilustración"
                                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-bounce-gentle animate-float-slow"
                            />
                        )}
                        <div>
                            <h2 className="text-blue-900 font-black text-lg md:text-xl uppercase">
                                🧺 {config.actividad?.titulo}
                            </h2>
                            <p className="text-gray-600 font-bold text-xs md:text-sm">
                                {config.actividad?.indicacion}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTÓN PREVIO PARA INICIAR */}
                {!juegoIniciado && !juegoTerminado && (
                    <div className="bg-sky-50/80 p-8 rounded-3xl border-3 border-sky-200 text-center space-y-5 animate-fade-in">
                        <h3 className="text-2xl font-black text-blue-900">
                            ¿Listo para clasificar las decisiones?
                        </h3>
                        <p className="text-gray-700 font-bold text-base max-w-lg mx-auto">
                            Ayuda a Alianzito a separar las decisiones en el Canasto de la Luz (Inteligentes) y el Canasto de la Oscuridad (Impulsivas).
                        </p>
                        <button
                            onClick={handleIniciarJuego}
                            className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            🚀 ¡Iniciar Actividad!
                        </button>
                    </div>
                )}

                {/* ZONA DE JUEGO (CANASTOS Y DECISIÓN ACTUAL) */}
                {juegoIniciado && !juegoTerminado && decisionActual && (
                    <div className="space-y-6 animate-fade-in">
                        
                        <div className="flex justify-between items-center bg-sky-50 px-5 py-2.5 rounded-full border border-sky-200">
                            <span className="bg-blue-900 text-white font-black px-4 py-1 rounded-full text-xs md:text-sm">
                                Situación {decisionActualIndex + 1} de {totalDecisiones}
                            </span>
                            <span className="text-xs font-extrabold text-amber-700">
                                Protagonista: {decisionActual.persona}
                            </span>
                        </div>

                        {/* SITUACIÓN ACTUAL */}
                        <div className="bg-amber-50/90 border-3 border-amber-300 p-6 rounded-3xl text-center space-y-3 shadow-md">
                            <span className="text-xs font-black text-amber-800 uppercase tracking-widest">
                                📝 Caso a evaluar
                            </span>
                            <h3 className="text-xl md:text-2xl font-black text-blue-950 leading-snug">
                                "{decisionActual.descripcion}"
                            </h3>
                        </div>

                        {/* BOTONES / CANASTOS DE CLASIFICACIÓN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* CANASTO IZQUIERDA: LUZ / INTELIGENTE */}
                            <button
                                onClick={() => handleClasificar("INTELIGENTE")}
                                disabled={mostrarFeedback}
                                className={`p-6 rounded-3xl border-3 flex flex-col items-center justify-center space-y-3 shadow-lg transition-all ${
                                    ultimaSeleccion === "INTELIGENTE"
                                    ? ultimaSeleccion === decisionActual.tipoCorrecto
                                        ? "bg-amber-100 border-amber-400 ring-4 ring-amber-300 scale-102"
                                        : "bg-amber-100 border-red-400 ring-4 ring-red-300 scale-102"
                                    : "bg-amber-50 hover:bg-amber-100 border-amber-300 hover:scale-102 active:scale-98"
                                } ${mostrarFeedback && ultimaSeleccion !== "INTELIGENTE" ? "opacity-50" : ""}`}
                            >
                                <span className="text-4xl">🧺 ☀️</span>
                                <div className="text-center">
                                    <h4 className="font-black text-amber-800 text-lg md:text-xl uppercase">
                                        Canasto de la Luz
                                    </h4>
                                    <p className="text-xs font-extrabold text-amber-600">
                                        (Decisión Inteligente)
                                    </p>
                                </div>
                            </button>

                            {/* CANASTO DERECHA: OSCURIDAD / IMPULSIVA */}
                            <button
                                onClick={() => handleClasificar("IMPULSIVA")}
                                disabled={mostrarFeedback}
                                className={`p-6 rounded-3xl border-3 flex flex-col items-center justify-center space-y-3 shadow-lg transition-all ${
                                    ultimaSeleccion === "IMPULSIVA"
                                    ? ultimaSeleccion === decisionActual.tipoCorrecto
                                        ? "bg-sky-100 border-sky-400 ring-4 ring-sky-300 scale-102"
                                        : "bg-sky-100 border-red-400 ring-4 ring-red-300 scale-102"
                                    : "bg-sky-50 hover:bg-sky-100 border-sky-300 hover:sky-102 active:sky-98"
                                } ${mostrarFeedback && ultimaSeleccion !== "IMPULSIVA" ? "opacity-50" : ""}`}
                            >
                                <span className="text-4xl">🧺 🌙</span>
                                <div className="text-center">
                                    <h4 className="font-black text-sky-900 text-lg md:text-xl uppercase">
                                        Canasto de la Oscuridad
                                    </h4>
                                    <p className="text-xs font-extrabold text-sky-600">
                                        (Decisión Impulsiva)
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* DESPLEGABLE CON FEEDBACK DE LA DECISIÓN */}
                        {mostrarFeedback && (
                            <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 space-y-4 animate-fade-in text-center shadow-inner">
                                <div className={`inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                    ultimaSeleccion === decisionActual.tipoCorrecto 
                                        ? "bg-sky-100 text-sky-900" 
                                        : "bg-amber-100 text-amber-900"
                                }`}>
                                    {ultimaSeleccion === decisionActual.tipoCorrecto ? "🎉 ¡Clasificación Correcta!" : "💡 Reflexión"}
                                </div>

                                <p className="text-gray-800 font-bold text-base md:text-lg leading-relaxed">
                                    {decisionActual.explicacion}
                                </p>

                                <button
                                    onClick={handleSiguienteDecision}
                                    className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-black text-lg rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
                                >
                                    {decisionActualIndex + 1 < totalDecisiones ? "Siguiente Situación ➔" : "Ver Resultados Finales ➔"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN FINAL (RESULTADOS Y TIP FINANCIERO) */}
                {juegoTerminado && (
                    <div ref={seccionResultadoRef} className="space-y-8 animate-fade-in pt-4 border-t-2 border-sky-100">

                        {/* Tarjeta de Mensaje de Alianzito */}
                        <div className={`p-6 rounded-3xl text-center space-y-4 shadow-xl border-4 ${
                            aciertos >= 4 
                                ? "bg-sky-50 border-sky-400 text-sky-950" 
                                : "bg-amber-50 border-amber-400 text-amber-950"
                        }`}>
                            <div className="flex justify-center">
                                {config.imagenes?.alianzito && (
                                    <img
                                        src={config.imagenes.alianzito}
                                        alt="Alianzito"
                                        className="w-28 h-28 object-contain drop-shadow"
                                    />
                                )}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-black uppercase">
                                {aciertos >= 4 ? "¡Excelente Trabajo!" : "¡Buen Esfuerzo!"}
                            </h2>

                            <p className="text-base md:text-lg font-bold max-w-xl mx-auto">
                                {aciertos >= 4 ? config.mensajesFinales?.excelente : config.mensajesFinales?.regular}
                            </p>

                            <span className="inline-block bg-white/80 px-4 py-2 rounded-2xl border border-gray-200 font-black text-blue-900 text-sm md:text-base">
                                Clasificaste correctamente {aciertos} de {totalDecisiones} situaciones.
                            </span>
                        </div>

                        {/* Tip Financiero */}
                        <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-3">
                            <span className="bg-blue-900 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>

                        {/* Habilidad Desbloqueada */}
                        <div className="bg-sky-50 border-2 border-sky-300 p-5 rounded-3xl text-center space-y-2 shadow-inner">
                            <span className="text-xs font-black text-sky-600 uppercase tracking-widest">
                                🔓 HABILIDAD DESBLOQUEADA
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-sky-800">
                                {config.tipFinanciero?.habilidad}
                            </h2>
                        </div>
                    </div>
                )}

                {/* ACCIONES FIJAS (REINICIAR Y CONTINUAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleFinalizar}
                        disabled={!juegoTerminado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !juegoTerminado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act05;