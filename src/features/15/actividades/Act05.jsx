import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntroduccion = data?.secciones?.introduccion;
    const secActividad = data?.secciones?.actividad;

    const pasosBase = secActividad?.pasosRuta || [];

    // Función para desordenar un arreglo de forma determinista o aleatoria inicial
    const desordenarPasos = (lista) => {
        if (!lista || lista.length === 0) return [];
        // Creamos una copia desordenada
        return [...lista].sort(() => 0.5 - Math.random());
    };

    // Estados de la Actividad
    const [pasosOrdenados, setPasosOrdenados] = useState([]);
    const [evaluado, setEvaluado] = useState(false);
    const [esCorrecto, setEsCorrecto] = useState(false);
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
    const storageKey = `act05-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage)
    useEffect(() => {
        const cargarProgreso = async () => {
            let cargadoDeSupabase = false;
            try {
                const aplicarDatos = (datos) => {
                    if (datos.pasosOrdenados && datos.pasosOrdenados.length > 0) {
                        setPasosOrdenados(datos.pasosOrdenados);
                    } else {
                        setPasosOrdenados(desordenarPasos(pasosBase));
                    }
                    if (datos.evaluado !== undefined) setEvaluado(datos.evaluado);
                    if (datos.esCorrecto !== undefined) setEsCorrecto(datos.esCorrecto);
                    if (datos.juegoTerminado !== undefined) setJuegoTerminado(datos.juegoTerminado);
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
                            setPasosOrdenados(desordenarPasos(pasosBase));
                        }
                    } else {
                        setPasosOrdenados(desordenarPasos(pasosBase));
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
            pasosOrdenados,
            evaluado,
            esCorrecto,
            juegoTerminado,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [pasosOrdenados, evaluado, esCorrecto, juegoTerminado, progresoCargado, storageKey, data?.id]);

    // LÓGICA PARA REORDENAR ELEMENTOS (MOVER ARRIBA / ABAJO)
    const moverPaso = (index, direccion) => {
        if (evaluado) return;

        const nuevoIndice = index + direccion;
        if (nuevoIndice < 0 || nuevoIndice >= pasosOrdenados.length) return;

        const nuevaLista = [...pasosOrdenados];
        const [itemRemovido] = nuevaLista.splice(index, 1);
        nuevaLista.splice(nuevoIndice, 0, itemRemovido);

        setPasosOrdenados(nuevaLista);
    };

    // EVALUAR RUTA
    const handleValidar = () => {
        if (evaluado || pasosOrdenados.length === 0) return;

        const estaCorrecto = pasosOrdenados.every(
            (paso, idx) => paso.ordenCorrecto === idx + 1
        );

        setEsCorrecto(estaCorrecto);
        setEvaluado(true);

        if (estaCorrecto) {
            setJuegoTerminado(true);
        }
    };

    const handleReset = () => {
        setPasosOrdenados(desordenarPasos(pasosBase));
        setEvaluado(false);
        setEsCorrecto(false);
        setJuegoTerminado(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            pasosOrdenados,
            evaluado: true,
            esCorrecto: true,
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

            {/* Contenedor Principal */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10" translate="no">

                {/* 1. SECCIÓN INTRODUCCIÓN ESTILO CHAT */}
                {secIntroduccion && (
                    <section className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl md:text-4xl font-black text-blue-900 uppercase">
                                {secIntroduccion.titulo}
                            </h1>
                        </div>

                        <div className="bg-gradient-to-b from-blue-900 to-blue-950 p-6 rounded-3xl shadow-xl max-w-3xl mx-auto space-y-4">
                            {secIntroduccion.mensajesChat?.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${
                                        msg.remitente === "usuario" ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl shadow-md text-sm md:text-base font-medium leading-relaxed ${
                                            msg.remitente === "usuario"
                                                ? "bg-white text-gray-800 rounded-br-none"
                                                : "bg-gray-100 text-gray-900 rounded-bl-none"
                                        }`}
                                    >
                                        {msg.texto && <p>{msg.texto}</p>}
                                        {msg.emojis && (
                                            <div className="flex gap-2 text-3xl">
                                                {msg.emojis.map((emoji, i) => (
                                                    <span key={i}>{emoji}</span>
                                                ))}
                                            </div>
                                        )}
                                        {msg.imagenPersonaje &&(
                                            <div className="flex justify-end pt-2">
                                                <img
                                                    src={msg.imagenPersonaje}
                                                    alt="Personaje en scooter"
                                                    className="w-32 md:w-44 object-contain drop-shadow-lg animate-float-slow"
                                                />
                                            </div>
                                        )}
                                        <span className="block text-[10px] text-gray-500 text-right mt-1">
                                            {msg.hora}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. SECCIÓN CONSTRUYE TU RUTA (ORDENAR TARJETAS) */}
                {secActividad && (
                    <section className="space-y-6">
                        
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-blue-900 uppercase">
                                {secActividad.titulo}
                            </h2>
                            <div className="inline-block bg-amber-400 text-blue-950 px-4 py-2 rounded-2xl font-black text-lg md:text-xl shadow">
                                🎯 {secActividad.metaContexto}
                            </div>
                            <p className="text-gray-600 font-bold text-base md:text-lg">
                                {secActividad.instruccion}
                            </p>
                        </div>

                        {/* LISTA INTERACTIVA DE TARJETAS */}
                        <div className="max-w-2xl mx-auto space-y-3">
                            {pasosOrdenados.map((paso, index) => (
                                <div
                                    key={paso.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all shadow-md ${
                                        evaluado
                                            ? paso.ordenCorrecto === index + 1
                                                ? "bg-sky-50 border-sky-400 text-sky-950"
                                                : "bg-red-50 border-red-400 text-red-950"
                                            : "bg-blue-50/80 border-blue-200 hover:border-amber-400"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Pin con Número de Orden */}
                                        <div className="w-10 h-10 rounded-full bg-red-500 text-white font-black text-lg flex items-center justify-center shadow flex-shrink-0">
                                            {index + 1}
                                        </div>

                                        <div>
                                            <h3 className="font-black text-blue-950 text-base md:text-lg">
                                                {paso.texto}
                                            </h3>
                                            {paso.subtexto && (
                                                <p className="text-xs md:text-sm text-gray-600 font-semibold">
                                                    {paso.subtexto}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botones de Reordenamiento */}
                                    {!evaluado && (
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => moverPaso(index, -1)}
                                                disabled={index === 0}
                                                className="w-8 h-8 bg-white border border-gray-300 rounded-lg text-blue-900 font-black text-xs hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-white transition flex items-center justify-center shadow-sm"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => moverPaso(index, 1)}
                                                disabled={index === pasosOrdenados.length - 1}
                                                className="w-8 h-8 bg-white border border-gray-300 rounded-lg text-blue-900 font-black text-xs hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-white transition flex items-center justify-center shadow-sm"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botón de Comprobación */}
                        {!evaluado && (
                            <div className="text-center pt-2">
                                <button
                                    onClick={handleValidar}
                                    className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white font-black text-xl rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    Verificar Ruta 🚗💨
                                </button>
                            </div>
                        )}

                        {/* Retroalimentación */}
                        {evaluado && (
                            <div className={`max-w-2xl mx-auto p-5 rounded-2xl border-2 text-center space-y-2 font-bold shadow-md transition-all ${
                                esCorrecto
                                    ? "bg-sky-100 border-sky-400 text-sky-950"
                                    : "bg-red-100 border-red-400 text-red-950"
                            }`}>
                                <h3 className="text-2xl font-black">
                                    {esCorrecto
                                        ? secActividad?.retroalimentacion?.exito?.titulo
                                        : secActividad?.retroalimentacion?.error?.titulo}
                                </h3>
                                <p className="text-base md:text-lg">
                                    {esCorrecto
                                        ? secActividad?.retroalimentacion?.exito?.mensaje
                                        : secActividad?.retroalimentacion?.error?.mensaje}
                                </p>
                            </div>
                        )}
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

export default Act05;