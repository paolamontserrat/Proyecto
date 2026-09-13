import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const presupuestoInicial = config.actividad?.presupuestoInicial || 800;

    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const [eventoActualIndex, setEventoActualIndex] = useState(0);
    const [respuestas, setRespuestas] = useState({}); // { 1: true/false, 2: true/false... }
    const [timeLeft, setTimeLeft] = useState(10);
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
    const storageKey = `act02-${rango}-${userId}`;

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
                            setEventoActualIndex(config.actividad?.eventos?.length || 0);
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
                        setEventoActualIndex(config.actividad?.eventos?.length || 0);
                    }
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const eventos = config.actividad?.eventos || [];
    const totalEventos = eventos.length;

    // Lógica del Temporizador (Inicia solo si juegoIniciado === true)
    useEffect(() => {
        if (!juegoIniciado || juegoTerminado || eventoActualIndex >= totalEventos) return;

        setTimeLeft(10);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Selección automática en 'SÍ' por default si expira el tiempo
                    handleRespuesta(eventos[eventoActualIndex].id, true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [juegoIniciado, eventoActualIndex, juegoTerminado]);

    // Calcular gasto total y saldo restante actual
    const dineroGastado = Object.entries(respuestas).reduce((acc, [id, compro]) => {
        if (compro) {
            const ev = eventos.find((e) => e.id === Number(id));
            return acc + (ev ? ev.costo : 0);
        }
        return acc;
    }, 0);

    const saldoRestante = presupuestoInicial - dineroGastado;

    // Iniciar el juego
    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
        setTimeLeft(10);
    };

    // Manejo de la decisión (SÍ / NO)
    const handleRespuesta = (eventoId, respuesta) => {
        const nuevasRespuestas = { ...respuestas, [eventoId]: respuesta };
        setRespuestas(nuevasRespuestas);

        const siguienteIndex = eventoActualIndex + 1;
        if (siguienteIndex < totalEventos) {
            setEventoActualIndex(siguienteIndex);
        } else {
            setJuegoTerminado(true);
            setTimeout(() => {
                seccionResultadoRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        }
    };

    // Evaluación del estado del juego al finalizar
    const obtenerResultadoFinal = () => {
        if (saldoRestante >= 200) return config.actividad?.resultados?.completado;
        if (saldoRestante >= 0) return config.actividad?.resultados?.casi;
        return config.actividad?.resultados?.gameOver;
    };

    // Reiniciar la actividad
    const handleReset = async () => {
        setJuegoIniciado(false);
        setEventoActualIndex(0);
        setRespuestas({});
        setTimeLeft(10);
        setJuegoTerminado(false);

        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        const payload = {
            respuestas,
            saldoRestante,
            dineroGastado,
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

    const eventoActual = eventos[eventoActualIndex];
    const resultadoFinal = obtenerResultadoFinal();

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
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-blue-500 shadow-2xl space-y-8 max-w-4xl mx-auto mb-10" translate="no">

                {/* ENCABEZADO Y REGLA CON ALIANZITO */}
                <div className="bg-amber-50 p-5 md:p-6 rounded-3xl border-2 border-amber-100 text-center space-y-3 relative">
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
                    <div className="bg-sky-50/80 p-5 rounded-3xl border border-sky-200 text-center space-y-1">
                        <span className="text-sky-800 font-black text-sm uppercase tracking-wide">
                            📌 {config.importancia.titulo}
                        </span>
                        <p className="text-gray-800 font-bold text-base md:text-lg">
                            {config.importancia.texto}
                        </p>
                    </div>
                )}

                {/* BARRA DE PRESUPUESTO Y ESTADO ACTUAL */}
                <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        {config.imagenes?.billete && (
                            <img
                                src={config.imagenes.billete}
                                alt="Billete"
                                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-bounce-gentle"
                            />
                        )}
                        <div>
                            <h2 className="text-blue-900 font-black text-lg md:text-xl">
                                🕹️ {config.actividad?.titulo}
                            </h2>
                            <p className="text-amber-600 font-black text-sm md:text-base">
                                {config.actividad?.alerta}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-amber-300 p-3 rounded-2xl text-center shrink-0 min-w-[180px]">
                        <span className="text-xs font-black text-gray-500 uppercase">Saldo Disponible</span>
                        <p className={`text-2xl font-black ${saldoRestante < 150 ? 'text-red-600' : 'text-amber-600'}`}>
                            ${saldoRestante}
                        </p>
                    </div>
                </div>

                {/* PANTALLA PREVIA: BOTÓN DE INICIO DE ACTIVIDAD */}
                {!juegoIniciado && !juegoTerminado && (
                    <div className="bg-amber-50/80 p-8 rounded-3xl border-3 border-amber-200 text-center space-y-5 animate-fade-in">
                        <h3 className="text-2xl font-black text-blue-900">
                            {config.actividad?.pregunta || "¿Crees poder lograrlo?"}
                        </h3>
                        <p className="text-gray-700 font-bold text-base max-w-lg mx-auto">
                            Tendrás 10 segundos para tomar cada decisión. Si el tiempo se agota, se asumirá que compraste el producto.
                        </p>
                        <button
                            onClick={handleIniciarJuego}
                            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-2xl rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            🚀 ¡Iniciar Actividad!
                        </button>
                    </div>
                )}

                {/* CONTENEDOR DE EVENTOS (DIAPOSITIVAS) */}
                {juegoIniciado && !juegoTerminado && eventoActual && (
                    <div className="bg-amber-50/60 p-6 md:p-8 rounded-3xl border-3 border-amber-200 space-y-6 relative animate-fade-in shadow-md">

                        {/* Encabezado Diapositiva & Timer */}
                        <div className="flex justify-between items-center border-b border-amber-200 pb-4">
                            <span className="bg-blue-900 text-white font-black px-4 py-1.5 rounded-full text-sm">
                                Evento {eventoActualIndex + 1} de {totalEventos}
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-gray-500 uppercase">Tiempo:</span>
                                <span className={`text-lg font-black px-3 py-1 rounded-full ${
                                    timeLeft <= 3 ? "bg-red-500 text-white animate-pulse" : "bg-amber-400 text-blue-950"
                                }`}>
                                    ⏱️ {timeLeft}s
                                </span>
                            </div>
                        </div>

                        {/* Detalle del Evento */}
                        <div className="text-center space-y-3 py-2">
                            <span className="text-amber-600 font-black uppercase text-sm tracking-wider">
                                {eventoActual.titulo}
                            </span>
                            <h3 className="text-xl md:text-2xl font-extrabold text-blue-900 leading-snug">
                                {eventoActual.descripcion}
                            </h3>
                            <p className="text-amber-700 font-black text-3xl pt-2">
                                Costo: ${eventoActual.costo}
                            </p>
                        </div>

                        {/* Opciones SÍ / NO */}
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
                            <button
                                onClick={() => handleRespuesta(eventoActual.id, true)}
                                className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                ¡SÍ, Gastar!
                            </button>
                            <button
                                onClick={() => handleRespuesta(eventoActual.id, false)}
                                className="py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                NO, Pasó
                            </button>
                        </div>
                    </div>
                )}

                {/* SECCIÓN FINAL (RESULTADOS Y TIP FINANCIERO) */}
                {juegoTerminado && (
                    <div ref={seccionResultadoRef} className="space-y-8 animate-fade-in pt-4 border-t-2 border-amber-100">

                        {/* Tarjeta de Resultado */}
                        <div className={`p-6 rounded-3xl text-center space-y-3 shadow-xl border-4 ${
                            saldoRestante >= 200 
                                ? "bg-amber-50 border-amber-400 text-amber-950" 
                                : saldoRestante >= 0 
                                ? "bg-amber-50 border-amber-400 text-amber-950" 
                                : "bg-red-50 border-red-400 text-red-950"
                        }`}>
                            <h2 className="text-3xl md:text-4xl font-black uppercase">
                                {resultadoFinal?.titulo}
                            </h2>
                            <p className="text-lg font-bold max-w-xl mx-auto">
                                {resultadoFinal?.mensaje}
                            </p>

                            <div className="grid grid-cols-3 gap-2 bg-white/80 p-4 rounded-2xl border border-gray-200 mt-4 font-black text-sm md:text-base">
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Inicial</span>
                                    <span className="text-blue-900">${presupuestoInicial}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Gastado</span>
                                    <span className="text-red-600">${dineroGastado}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Restante</span>
                                    <span className="text-amber-600">${saldoRestante}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tip Financiero */}
                        <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 space-y-3">
                            <span className="bg-blue-900 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>

                        {/* Habilidad Desbloqueada */}
                        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl text-center space-y-2 shadow-inner">
                            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">
                                🔓 HABILIDAD DESBLOQUEADA
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-amber-800">
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

export default Act02;