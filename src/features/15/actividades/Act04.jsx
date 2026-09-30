import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntroduccion = data?.secciones?.introduccion;
    const secActividad = data?.secciones?.actividad;
    const secTarjetaFinal = data?.secciones?.tarjetaFinal;
    const datosReto = secActividad?.datosReto || {};

    // Configuración del reto
    const tiempoInicial = secActividad?.tiempoPorRonda || 30;

    // Estados del Juego
    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const [montoIngresado, setMontoIngresado] = useState("");
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [tiempoRestante, setTiempoRestante] = useState(tiempoInicial);
    const [temporizadorActivo, setTemporizadorActivo] = useState(false);
    const [evaluado, setEvaluado] = useState(false);
    const [esCorrecto, setEsCorrecto] = useState(false);
    const [tiempoAgotado, setTiempoAgotado] = useState(false);
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [progresoCargado, setProgresoCargado] = useState(false);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act04-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage)
    useEffect(() => {
        const cargarProgreso = async () => {
            let cargadoDeSupabase = false;
            try {
                const aplicarDatos = (datos) => {
                    if (datos.juegoIniciado !== undefined) setJuegoIniciado(datos.juegoIniciado);
                    if (datos.montoIngresado !== undefined) setMontoIngresado(datos.montoIngresado);
                    if (datos.mesSeleccionado !== undefined) setMesSeleccionado(datos.mesSeleccionado);
                    if (datos.tiempoRestante !== undefined) setTiempoRestante(datos.tiempoRestante);
                    if (datos.evaluado !== undefined) setEvaluado(datos.evaluado);
                    if (datos.esCorrecto !== undefined) setEsCorrecto(datos.esCorrecto);
                    if (datos.tiempoAgotado !== undefined) setTiempoAgotado(datos.tiempoAgotado);
                    if (datos.juegoTerminado !== undefined) setJuegoTerminado(datos.juegoTerminado);

                    if (datos.juegoIniciado && !datos.evaluado && !datos.tiempoAgotado && !datos.juegoTerminado) {
                        setTemporizadorActivo(true);
                    }
                };

                // 1. Verificar progreso en Supabase si está autenticado
                if (userId !== "anon" && data?.id) {
                    try {
                        const { data: progreso, error } = await supabase
                            .from("progreso_actividades")
                            .select("datos_actividad, completada")
                            .eq("usuario_id", userId)
                            .eq("actividad_id", data.id)
                            .maybeSingle();

                        if (error) throw error;

                        if (progreso?.completada && progreso?.datos_actividad) {
                            aplicarDatos(progreso.datos_actividad);
                            localStorage.setItem(storageKey, JSON.stringify(progreso.datos_actividad));
                            cargadoDeSupabase = true;
                        }
                    } catch (err) {
                        console.warn("Error consultando Supabase, recurriendo a local...", err);
                    }
                }

                // 2. Recuperar borrador de LocalStorage si no venía completado de Supabase
                if (!cargadoDeSupabase) {
                    const guardado = localStorage.getItem(storageKey);
                    if (guardado) {
                        try {
                            aplicarDatos(JSON.parse(guardado));
                        } catch (e) {
                            console.error("Error al cargar progreso local", e);
                        }
                    }
                }
            } finally {
                setProgresoCargado(true);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Guardado automático local tras la carga inicial
    useEffect(() => {
        if (!progresoCargado || !data?.id) return;

        const datosAGuardar = {
            juegoIniciado,
            montoIngresado,
            mesSeleccionado,
            tiempoRestante,
            evaluado,
            esCorrecto,
            tiempoAgotado,
            juegoTerminado,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [juegoIniciado, montoIngresado, mesSeleccionado, tiempoRestante, evaluado, esCorrecto, tiempoAgotado, juegoTerminado, progresoCargado, storageKey, data?.id]);
    
    // LÓGICA DEL TEMPORIZADOR
    useEffect(() => {
        let intervalo = null;

        if (temporizadorActivo && tiempoRestante > 0) {
            intervalo = setInterval(() => {
                setTiempoRestante((prev) => prev - 1);
            }, 1000);
        } else if (tiempoRestante === 0 && temporizadorActivo) {
            setTemporizadorActivo(false);
            setTiempoAgotado(true);
            setEvaluado(true);
            setEsCorrecto(false);
            setJuegoTerminado(true);
        }

        return () => clearInterval(intervalo);
    }, [temporizadorActivo, tiempoRestante]);

    // Iniciar el juego al presionar el botón
    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
        setTemporizadorActivo(true);
    };

    // Evaluar respuestas ingresadas
    const handleValidar = (e) => {
        e.preventDefault();

        if (!montoIngresado || mesSeleccionado === null || evaluado) return;

        setTemporizadorActivo(false);

        const montoNumerico = parseInt(montoIngresado.toString().replace(/[^0-9]/g, ""), 10);
        const montoCorrecto = datosReto.montoFaltanteCorrecto || 1200;
        const mesCorrecto = datosReto.mesesCorrecto || 6;

        const esMontoCorrecto = montoNumerico === montoCorrecto;
        const esMesCorrecto = mesSeleccionado === mesCorrecto;

        const aciertoTotal = esMontoCorrecto && esMesCorrecto;

        setEsCorrecto(aciertoTotal);
        setEvaluado(true);
        setJuegoTerminado(true);
    };

    const handleReset = () => {
        setJuegoIniciado(false);
        setMontoIngresado("");
        setMesSeleccionado(null);
        setTiempoRestante(tiempoInicial);
        setTemporizadorActivo(false);
        setEvaluado(false);
        setEsCorrecto(false);
        setTiempoAgotado(false);
        setJuegoTerminado(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            juegoIniciado: true,
            montoIngresado,
            mesSeleccionado,
            tiempoRestante,
            evaluado: true,
            esCorrecto,
            tiempoAgotado,
            juegoTerminado: true,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

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
                console.warn("Offline, guardado en LocalStorage", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.Fondo || data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

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

            {/* Contenedor Principal Desplegado Verticalmente */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10" translate="no">

                {/* 1. SECCIÓN INTRODUCCIÓN */}
                {secIntroduccion && (
                    <section className="space-y-4">
                        <div className="text-center">
                            <h1 className="text-2xl md:text-4xl font-black text-blue-900 uppercase">
                                {secIntroduccion.titulo}
                            </h1>
                            {secIntroduccion.subtitulo && (
                                <p className="text-amber-600 font-extrabold text-lg md:text-xl">
                                    {secIntroduccion.subtitulo}
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50/80 border-2 border-blue-100 rounded-3xl p-5 text-gray-700 font-semibold text-base md:text-lg space-y-2 max-w-3xl mx-auto">
                            {secIntroduccion.parrafos?.map((parrafo, idx) => (
                                <p key={idx}>{parrafo}</p>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. SECCIÓN RETO CONTRA RELOJ */}
                {secActividad && (
                    <section className="space-y-6 border-t-4 border-dashed border-gray-200 pt-6">
                        
                        {/* Cabecera del Reto y Temporizador */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-400 p-4 rounded-2xl shadow-md text-blue-950 max-w-3xl mx-auto">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-center sm:text-left">
                                {secActividad.titulo}
                            </h2>

                            {/* RELOJ TEMPORIZADOR */}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xl shadow-inner ${
                                tiempoRestante <= 10 ? "bg-red-600 text-white animate-pulse" : "bg-white text-blue-900"
                            }`}>
                                <span>⏱️</span>
                                <span>00:{tiempoRestante < 10 ? `0${tiempoRestante}` : tiempoRestante}s</span>
                            </div>
                        </div>

                        {/* PANTALLA PREVIA: BOTÓN INICIAR */}
                        {!juegoIniciado ? (
                            <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 max-w-3xl mx-auto text-center space-y-6">
                                <img
                                    src={secActividad.imagenPersonaje}
                                    alt="Billete listo para el reto"
                                    className="w-40 md:w-48 object-contain mx-auto drop-shadow-md animate-float-slow"
                                />
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-blue-900">
                                        ¿Estás listo para el reto?
                                    </h3>
                                    <p className="text-gray-600 font-bold text-base md:text-lg">
                                        Tendrás <span className="text-amber-600">{tiempoInicial} segundos</span> para responder las dos preguntas. El tiempo comenzará al hacer clic.
                                    </p>
                                </div>
                                <button
                                    onClick={handleIniciarJuego}
                                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-blue-950 font-black text-2xl rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    ¡Comenzar Reto! 🚀
                                </button>
                            </div>
                        ) : (
                            /* ÁREA DEL FORMULARIO Y PERSONAJE (JUEGO INICIADO) */
                            <div className="bg-amber-100/60 p-6 rounded-3xl border-2 border-amber-200 max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
                                
                                {/* Personaje con laptop */}
                                <div className="flex-shrink-0 text-center">
                                    <img
                                        src={secActividad.imagenPersonaje}
                                        alt="Billete con laptop"
                                        className="w-44 md:w-56 object-contain drop-shadow-lg mx-auto animate-float-slow"
                                    />
                                </div>

                                {/* Tarjeta del problema y respuestas */}
                                <form onSubmit={handleValidar} className="flex-1 space-y-5 text-blue-950 font-extrabold w-full">
                                    
                                    <div className="space-y-1 text-base md:text-lg bg-white/80 p-4 rounded-2xl border border-amber-200 shadow-sm">
                                        <p>Quieres comprar algo que cuesta: <span className="text-amber-700">${datosReto.costoMeta || 1800}</span></p>
                                        <p>Ya tienes: <span className="text-sky-700">${datosReto.ahorroActual || 600}</span></p>
                                        <p>Puedes ahorrar: <span className="text-blue-700">${datosReto.ahorroMensual || 200} al mes</span></p>
                                    </div>

                                    {/* Pregunta 1: Monto Faltante */}
                                    <div className="space-y-2">
                                        <label className="block text-sm md:text-base text-blue-900 font-black">
                                            ¿CUÁNTO TE FALTA?
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-blue-900">$</span>
                                            <input
                                                type="number"
                                                value={montoIngresado}
                                                onChange={(e) => setMontoIngresado(e.target.value)}
                                                disabled={evaluado || tiempoAgotado}
                                                placeholder="10"
                                                className="w-full p-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 font-black text-xl text-blue-900 bg-white shadow-inner outline-none transition disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Pregunta 2: Selección de Meses */}
                                    <div className="space-y-2">
                                        <label className="block text-sm md:text-base text-blue-900 font-black">
                                            ¿CUÁNTOS MESES NECESITARÁS?
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(datosReto.mesesOpciones || [1, 3, 6, 9]).map((mes) => {
                                                const seleccionado = mesSeleccionado === mes;
                                                return (
                                                    <button
                                                        key={mes}
                                                        type="button"
                                                        onClick={() => !evaluado && setMesSeleccionado(mes)}
                                                        disabled={evaluado || tiempoAgotado}
                                                        className={`py-2 px-1 rounded-xl font-black text-base shadow transition-all ${
                                                            seleccionado
                                                                ? "bg-blue-900 text-white scale-105 ring-4 ring-amber-400"
                                                                : "bg-white text-blue-950 hover:bg-amber-200 border-2 border-amber-300"
                                                        } ${evaluado ? "cursor-default" : ""}`}
                                                    >
                                                        {mes} {mes === 1 ? "mes" : "meses"}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botón para Evaluar Respuestas */}
                                    {!evaluado && (
                                        <button
                                            type="submit"
                                            disabled={!montoIngresado || mesSeleccionado === null || tiempoAgotado}
                                            className={`w-full py-3 rounded-2xl font-black text-lg text-white shadow-lg transition-all ${
                                                !montoIngresado || mesSeleccionado === null || tiempoAgotado
                                                    ? "bg-gray-400 cursor-not-allowed opacity-60"
                                                    : "bg-sky-600 hover:bg-sky-700 active:scale-98"
                                            }`}
                                        >
                                            Comprobar Respuesta 🎯
                                        </button>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* MENSAJES DE RETROALIMENTACIÓN */}
                        {evaluado && (
                            <div className={`max-w-3xl mx-auto p-5 rounded-2xl border-2 text-center space-y-2 font-bold shadow-md transition-all ${
                                esCorrecto
                                    ? "bg-sky-100 border-sky-400 text-sky-950"
                                    : "bg-red-100 border-red-400 text-red-950"
                            }`}>
                                <h3 className="text-2xl font-black">
                                    {tiempoAgotado
                                        ? secActividad?.retroalimentacion?.tiempoAgotado?.titulo || "¡TIEMPO AGOTADO!"
                                        : esCorrecto
                                        ? secActividad?.retroalimentacion?.exito?.titulo || "¡EXACTO!"
                                        : "¡CASI LO LOGRAS!"}
                                </h3>
                                <p className="text-base md:text-lg">
                                    {tiempoAgotado
                                        ? secActividad?.retroalimentacion?.tiempoAgotado?.mensaje
                                        : secActividad?.retroalimentacion?.exito?.mensaje}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* 3. SECCION TARJETA FINAL DE CONCEPTO DESBLOQUEADO */}
                {secTarjetaFinal && (
                    <section className="space-y-6">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTarjetaFinal.titulo}
                            </h2>

                            {/* Imagen del carro */}
                            <div className="flex justify-center">
                                <img
                                    src={secTarjetaFinal.imagenCarro}
                                    alt="Concepto Planificación - Carro"
                                    className="w-56 md:w-72 object-contain drop-shadow-2xl animate-float-slow"
                                />
                            </div>

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTarjetaFinal.subtexto}
                            </p>
                        </div>
                    </section>
                )}

                {/* Botones Globales de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-gray-100">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!juegoTerminado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !juegoTerminado
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

export default Act04;