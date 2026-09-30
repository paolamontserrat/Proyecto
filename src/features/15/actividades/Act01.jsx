import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para las respuestas del formulario interactivo
    const [metaSeleccionada, setMetaSeleccionada] = useState("");
    const [otraMetaTexto, setOtraMetaTexto] = useState("");
    const [porQue, setPorQue] = useState("");
    const [paraCuando, setParaCuando] = useState("");
    const [queNecesito, setQueNecesito] = useState("");
    const [primerPaso, setPrimerPaso] = useState("");
    const [error, setError] = useState("");
    const [progresoCargado, setProgresoCargado] = useState(false);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act01-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage)
    useEffect(() => {
        const cargarProgreso = async () => {
            let cargadoDeSupabase = false;
            try {
                // 1. Verificar progreso en Supabase
                if (userId !== "anon" && data?.id) {
                    try {
                        const { data: progreso, error } = await supabase
                            .from("progreso_actividades")
                            .select("datos_actividad, completada")
                            .eq("usuario_id", userId)
                            .eq("actividad_id", data.id)
                            .maybeSingle();
                        if (error) throw error;

                        // Si está completada, recuperar desde Supabase
                        if (progreso?.completada && progreso?.datos_actividad) {
                            const datos = progreso.datos_actividad;
                            setMetaSeleccionada(datos.metaSeleccionada || "");
                            setOtraMetaTexto(datos.otraMetaTexto || "");
                            setPorQue(datos.porQue || "");
                            setParaCuando(datos.paraCuando || "");
                            setQueNecesito(datos.queNecesito || "");
                            setPrimerPaso(datos.primerPaso || "");
                            
                            // Sincronizar con LocalStorage
                            localStorage.setItem(
                                storageKey,
                                JSON.stringify(datos)
                            );
                            cargadoDeSupabase = true;
                        }
                    } catch (err) {
                        console.warn(
                            "Error consultando Supabase, recurriendo a local...",
                            err
                        );
                    }
                }
                // Recuperar borrador de LocalStorage
                if (!cargadoDeSupabase) {
                    const guardado = localStorage.getItem(storageKey);
                    if (guardado) {
                        try {
                            const parsed = JSON.parse(guardado);
                            setMetaSeleccionada(parsed.metaSeleccionada || "");
                            setOtraMetaTexto(parsed.otraMetaTexto || "");
                            setPorQue(parsed.porQue || "");
                            setParaCuando(parsed.paraCuando || "");
                            setQueNecesito(parsed.queNecesito || "");
                            setPrimerPaso(parsed.primerPaso || "");
                            console.log(
                                "Progreso recuperado de LocalStorage:",
                                parsed
                            );
                        } catch (e) {
                            console.error(
                                "Error al cargar progreso local",
                                e
                            );
                        }
                    }
                }
            } finally {
                // Permitir el guardado después de recuperar los datos
                setProgresoCargado(true);
            }
        };
        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Extraer secciones del JSON
    const secBienvenida = data?.secciones?.find((s) => s.id === "bienvenida");
    const secActividad = data?.secciones?.find((s) => s.id === "actividad");
    const secResumen = data?.secciones?.find((s) => s.id === "resumen");

    const metaFinalTexto =
        metaSeleccionada === "otra"
            ? otraMetaTexto
            : secActividad?.pasos?.[0]?.opciones?.find((o) => o.id === metaSeleccionada)?.texto || "";

    const formularioValido =
        metaSeleccionada !== "" &&
        (metaSeleccionada !== "otra" || otraMetaTexto.trim() !== "") &&
        porQue.trim() !== "" &&
        paraCuando.trim() !== "" &&
        queNecesito.trim() !== "" &&
        primerPaso.trim() !== "" &&
        !error;



    // 2. Función final: Guarda en Supabase SOLO al completar y dar clic en Continuar/Finalizar
    const handleContinue = async () => {
        if (!formularioValido) {
            setError("Por favor, llena todas las preguntas antes de finalizar.");
            return;
        }

        const datosAGuardar = {
            metaSeleccionada,
            otraMetaTexto,
            metaFinalTexto,
            porQue,
            paraCuando,
            queNecesito,
            primerPaso,
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
                console.warn("Offline, guardado localmente", err);
            }
        }

        onComplete();
    };

    const handleReset = () => {
        setMetaSeleccionada("");
        setOtraMetaTexto("");
        setPorQue("");
        setParaCuando("");
        setQueNecesito("");
        setPrimerPaso("");
        setError("");
        localStorage.removeItem(storageKey);
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
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal con todas las secciones desplegadas verticalmente */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-12" translate="no">
                
                {/* 1.BIENVENIDA */}
                {secBienvenida && (
                    <section className="space-y-6">
                        <div className=" p-6 sm:p-8 rounded-3xl text-center space-y-4">
                            <div className="bg-amber-400 text-blue-950 font-black text-xl sm:text-2xl md:text-3xl py-3 px-4 sm:px-6 rounded-2xl sm:rounded-full inline-block shadow-sm max-w-full break-words leading-tight">
                                {secBienvenida.titulo}
                            </div>
                            {secBienvenida.imagen1 && (
                                <div className="flex justify-center pt-4">
                                    <img
                                        src={secBienvenida.imagen1}
                                        alt="Alianzito Cooperativa"
                                        className="max-h-40 object-contain rounded-2xl animate-float-slow"
                                    />
                                </div>
                            )}
                            <div className="bg-amber-100/90 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-md space-y-6">
                            {secBienvenida.parrafos?.map((parrafo, idx) => (
                                <p className="text-base sm:text-lg font-black text-blue-950 text-center" key={idx}>
                                    {parrafo}
                                </p>
                            ))}
                            </div>
                        </div>

                        {/* Ejemplos en cuadrícula */}
                        {secBienvenida.ejemplos && (
                            <div className="flex flex-wrap justify-center gap-4 my-6">
                                {secBienvenida.ejemplos.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white border-2 border-sky-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm transition w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)]"
                                    >
                                        <span className="text-3xl select-none">
                                            {item.icono}
                                        </span>

                                        <span className="font-extrabold text-blue-900 text-sm md:text-base">
                                            {item.texto}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {secBienvenida.preguntaReflexion && (
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 text-center">
                                <p className="font-extrabold text-blue-900 text-lg md:text-xl">
                                    💡 {secBienvenida.preguntaReflexion}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* 2. ACTIVIDAD INTERACTIVA*/}
                {secActividad && (
                    <section>
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-black text-blue-900 mb-2">
                                {secActividad.titulo}
                            </h2>
                            <p className="text-gray-600 font-bold text-base md:text-lg">
                                {secActividad.instruccion}
                            </p>
                        </div>

                        <div className="space-y-8">
                            {secActividad.pasos?.map((paso) => (
                                <div
                                    key={paso.id}
                                    className="bg-gray-50/80 border-2 border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm"
                                >
                                    <h3 className="font-black text-blue-900 text-lg md:text-xl mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center text-sm font-black flex-shrink-0">
                                            {paso.id}
                                        </span>
                                        {paso.pregunta}
                                    </h3>

                                    {/* Paso 1: Selección de Meta */}
                                    {paso.tipo === "seleccion" && (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap justify-center gap-3">
                                                {paso.opciones?.map((opc) => {
                                                    const seleccionada = metaSeleccionada === opc.id;
                                                    return (
                                                        <button
                                                            key={opc.id}
                                                            type="button"
                                                            onClick={() => setMetaSeleccionada(opc.id)}
                                                            className={`w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)] p-4 rounded-2xl border-2 font-bold text-center flex flex-col items-center justify-center gap-2 transition-all ${
                                                                seleccionada
                                                                    ? "border-sky-500 bg-sky-100 text-blue-900 shadow-md scale-105"
                                                                    : "border-gray-200 bg-white text-gray-700 hover:border-sky-300"
                                                            }`}
                                                        >
                                                            <span className="text-3xl">{opc.icono}</span>
                                                            <span className="text-sm">{opc.texto}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {paso.permitirOtra && metaSeleccionada === "otra" && (
                                                <input
                                                    type="text"
                                                    placeholder={paso.placeholderOtra}
                                                    value={otraMetaTexto}
                                                    onChange={(e) => setOtraMetaTexto(e.target.value)}
                                                    className="w-full mt-3 px-4 py-3 rounded-2xl border-2 border-sky-300 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Paso 2: ¿Por qué? */}
                                    {paso.id === 2 && (
                                        <textarea
                                            rows={2}
                                            placeholder={paso.placeholder}
                                            value={porQue}
                                            onChange={(e) => setPorQue(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner"
                                        />
                                    )}

                                    {/* Paso 3: ¿Cuándo? */}
                                    {paso.id === 3 && (
                                        <input
                                            type="text"
                                            placeholder={paso.placeholder}
                                            value={paraCuando}
                                            onChange={(e) => setParaCuando(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner"
                                        />
                                    )}

                                    {/* Paso 4: ¿Qué necesitas? */}
                                    {paso.id === 4 && (
                                        <textarea
                                            rows={2}
                                            placeholder={paso.placeholder}
                                            value={queNecesito}
                                            onChange={(e) => setQueNecesito(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner"
                                        />
                                    )}

                                    {/* Paso 5: Primer paso */}
                                    {paso.id === 5 && (
                                        <input
                                            type="text"
                                            placeholder={paso.placeholder}
                                            value={primerPaso}
                                            onChange={(e) => setPrimerPaso(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/*RESUMEN FINAL*/}
                {secResumen && (
                    <section className="space-y-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-amber-500 uppercase tracking-wide">
                            {secResumen.titulo}
                        </h2>

                        <p className="text-gray-700 font-bold text-lg md:text-xl max-w-2xl mx-auto">
                            {secResumen.descripcion}
                        </p>

                        {/* Tarjeta Visual de Resultados (Se actualiza dinámicamente conforme el usuario escribe) */}
                        <div className="bg-gradient-to-br from-sky-500 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-2xl text-left max-w-2xl mx-auto space-y-4">
                            <div className="border-b border-white/30 pb-3 flex justify-between items-center">
                                <span className="font-extrabold uppercase tracking-widest text-sky-200 text-xs md:text-sm">
                                    Ficha de Meta Personal
                                </span>
                                <span className="text-3xl">🎯</span>
                            </div>

                            <div className="space-y-3 font-semibold text-base md:text-lg">
                                <div>
                                    <span className="text-sky-200 font-bold block text-sm uppercase">Mi Meta:</span>
                                    <span className="text-xl md:text-2xl font-black text-yellow-300">
                                        {metaFinalTexto || "Aún no seleccionada"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sky-200 font-bold block text-sm uppercase">¿Por qué es importante?:</span>
                                    <p className="bg-white/10 p-3 rounded-xl border border-white/20 mt-1">
                                        {porQue || "..."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-sky-200 font-bold block text-sm uppercase">Tiempo estimado:</span>
                                        <span className="font-black text-white">{paraCuando || "..."}</span>
                                    </div>
                                    <div>
                                        <span className="text-sky-200 font-bold block text-sm uppercase">¿Qué necesito?:</span>
                                        <span className="font-black text-white">{queNecesito || "..."}</span>
                                    </div>
                                </div>

                                <div className="bg-yellow-400 text-blue-950 p-4 rounded-2xl font-black mt-4 shadow-md">
                                    <span className="block text-xs uppercase tracking-wider text-blue-900/80">
                                        Mi primer paso desde hoy:
                                    </span>
                                    <span className="text-lg md:text-xl">🚀 {primerPaso || "..."}</span>
                                </div>
                            </div>
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

export default Act01;