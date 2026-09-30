import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntro = data?.secciones?.introduccion;
    const secActividad = data?.secciones?.actividad;
    const secTip = data?.secciones?.tipFinanciero;

    const preguntas = secActividad?.preguntas || [];
    const bancoOpciones = secActividad?.bancoOpciones || [];

    // Estados de la Actividad
    // respuestas: { [preguntaId]: "Opción Seleccionada" }
    const [respuestas, setRespuestas] = useState({});
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null); // Para selección mediante clic
    const [actividadCompletada, setActividadCompletada] = useState(false);

    // Estado para controlar la carga inicial del progreso
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act07-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO CORREGIDA (Supabase [si completada] -> LocalStorage -> Default)
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;

                // Paso 1: Consultar Supabase si hay usuario
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    // Si está COMPLETADA en Supabase, tomamos la verdad desde Supabase
                    if (progreso?.completada && progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.respuestas) setRespuestas(datos.respuestas);
                        if (datos.actividadCompletada !== undefined) setActividadCompletada(datos.actividadCompletada);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                // Paso 2: Si no estaba completada en Supabase, intentar cargar desde LocalStorage
                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.respuestas) setRespuestas(parsed.respuestas);
                        if (parsed.actividadCompletada !== undefined) setActividadCompletada(parsed.actividadCompletada);
                        cargado = true;
                    }
                }
            } catch (err) {
                console.warn("Error al cargar progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // 2. GUARDADO AUTOMÁTICO EN LOCALSTORAGE
    useEffect(() => {
        if (cargandoProgreso || !data?.id) return;

        const datosAGuardar = {
            respuestas,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [respuestas, actividadCompletada, cargandoProgreso, storageKey, data?.id]);

    // Verificar si la actividad está completada correctamente
    useEffect(() => {
        if (preguntas.length === 0) return;

        const todasCorrectas = preguntas.every(
            (p) => respuestas[p.id] === p.respuestaCorrecta
        );

        setActividadCompletada(todasCorrectas);
    }, [respuestas, preguntas]);

    // Lógica para asignar opción a una pregunta
    const asignarOpción = (preguntaId, opcion) => {
        setRespuestas((prev) => ({
            ...prev,
            [preguntaId]: opcion,
        }));
        setOpcionSeleccionada(null);
    };

    const desasignarOpción = (preguntaId) => {
        setRespuestas((prev) => {
            const copia = { ...prev };
            delete copia[preguntaId];
            return copia;
        });
    };

    // Soporte para Drag and Drop
    const handleDragStart = (e, opcion) => {
        e.dataTransfer.setData("text/plain", opcion);
    };

    const handleDrop = (e, preguntaId) => {
        e.preventDefault();
        const opcion = e.dataTransfer.getData("text/plain");
        if (opcion) {
            asignarOpción(preguntaId, opcion);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleReset = () => {
        setRespuestas({});
        setOpcionSeleccionada(null);
        setActividadCompletada(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            respuestas,
            actividadCompletada: true,
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

    // Opciones usadas actualmente
    const opcionesUsadas = Object.values(respuestas);

    return (
        <LayoutActividad fondo={data?.fondo || "bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950"}>
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
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="bg-blue-950 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-950 text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10" translate="no">

                {/* 1. SECCIÓN INTRODUCCIÓN Y ESCUDO ANTIIMPULSOS */}
                {secIntro && (
                    <div className="bg-blue-950 backdrop-blur-md rounded-3xl p-6 md:p-8 border-4 border-yellow-400 shadow-2xl text-white space-y-6">
                        <h1 className="text-2xl md:text-4xl font-black text-yellow-300 uppercase tracking-wide text-center drop-shadow-md">
                            {secIntro.titulo}
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* Ilustración de Alianzito con Escudo */}
                            {secIntro.imagenEscudo && (
                                <div className="flex justify-center md:col-span-1">
                                    <img
                                        src={secIntro.imagenEscudo}
                                        alt="Alianzito Activa tu Escudo Antiimpulsos"
                                        className="w-48 md:w-60 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 animate-bounce-gentle"
                                    />
                                </div>
                            )}

                            {/* Mensaje General y Herramienta */}
                            <div className="md:col-span-2 space-y-4">
                                <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed bg-blue-900/60 p-4 rounded-2xl border border-blue-700">
                                    {secIntro.mensajeGeneral}
                                </p>

                                {secIntro.herramienta && (
                                    <div className="bg-white/10 p-4 rounded-2xl border-2 border-yellow-400/50 space-y-2">
                                        <h3 className="font-extrabold text-yellow-300 text-base md:text-lg">
                                            🛠️ Herramienta: {secIntro.herramienta.nombre}
                                        </h3>
                                        <p className="text-xs md:text-sm text-blue-50 leading-relaxed">
                                            {secIntro.herramienta.descripcion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. BANCO DE OPCIONES DESPLAZABLE / SELECCIONABLE */}
                {secActividad && (
                    <div className="bg-amber-500 rounded-3xl p-6 md:p-8 border-4 border-white shadow-2xl space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-4xl font-black text-blue-950 uppercase tracking-wide">
                                {secActividad.titulo}
                            </h2>
                            <p className="text-blue-950 font-bold text-xs md:text-sm max-w-2xl mx-auto">
                                {secActividad.instruccion}
                            </p>
                        </div>

                        {/* BANCO DE OPCIONES */}
                        <div className="bg-blue-950 p-4 md:p-6 rounded-2xl border-2 border-yellow-400">
                            <p className="text-yellow-300 font-extrabold text-xs md:text-sm mb-3 uppercase tracking-wider text-center">
                                Opciones Disponibles (Haz clic o arrastra a la casilla correspondiente)
                            </p>
                            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                {bancoOpciones.map((opcion, idx) => {
                                    const yaUsada = opcionesUsadas.includes(opcion);
                                    const estaSeleccionada = opcionSeleccionada === opcion;

                                    return (
                                        <button
                                            key={idx}
                                            draggable={!yaUsada}
                                            onDragStart={(e) => handleDragStart(e, opcion)}
                                            onClick={() => !yaUsada && setOpcionSeleccionada(estaSeleccionada ? null : opcion)}
                                            disabled={yaUsada}
                                            className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 shadow-md ${
                                                yaUsada
                                                    ? "bg-blue-900/50 text-blue-300/40 cursor-not-allowed line-through border border-transparent"
                                                    : estaSeleccionada
                                                    ? "bg-yellow-400 text-blue-950 border-2 border-white scale-105 ring-4 ring-yellow-300"
                                                    : "bg-blue-800 text-white border border-blue-600 hover:bg-blue-700 hover:scale-105 cursor-pointer"
                                            }`}
                                        >
                                            {opcion}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* LISTA DE PREGUNTAS / TARJETAS DE ALIANZITO */}
                        <div className="space-y-4">
                            {preguntas.map((p, idx) => {
                                const respuestaActual = respuestas[p.id];
                                const esCorrecta = respuestaActual === p.respuestaCorrecta;
                                const esIzquierda = idx % 2 === 0;

                                return (
                                    <div
                                        key={p.id}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, p.id)}
                                        onClick={() => {
                                            if (opcionSeleccionada && !respuestaActual) {
                                                asignarOpción(p.id, opcionSeleccionada);
                                            }
                                        }}
                                        className={`bg-amber-100/90 rounded-2xl p-4 md:p-6 border-4 transition-all duration-300 shadow-md flex flex-col md:flex-row items-center gap-4 ${
                                            respuestaActual
                                                ? esCorrecta
                                                    ? "border-blue-500 bg-emerald-50/90"
                                                    : "border-red-500 bg-rose-50/90"
                                                : "border-amber-300 hover:border-amber-400"
                                        } ${!esIzquierda ? "md:flex-row-reverse" : ""}`}
                                    >
                                        {/* Avatar de Alianzito */}
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-200 border-2 border-amber-400 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                                            <img
                                                src={secTip.imagen1}
                                                alt="Tip financiero de la actividad"
                                                className="w-64 md:w-80 object-contain drop-shadow-md"
                                            />
                                        </div>

                                        {/* Texto y Casilla de Respuesta */}
                                        <div className="flex-1 space-y-3 text-center md:text-left w-full">
                                            <div className="space-y-1">
                                                <span className="text-xs font-black text-blue-900 uppercase tracking-wide">
                                                    ALIANZITO PIDE #{p.numero}:
                                                </span>
                                                <p className="text-sm md:text-base font-bold text-blue-950 leading-snug">
                                                    {p.definicion}
                                                </p>
                                            </div>

                                            {/* Casilla donde va la respuesta */}
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <div
                                                    className={`min-w-[160px] md:min-w-[200px] h-10 px-3 rounded-xl border-2 flex items-center justify-center transition-all ${
                                                        respuestaActual
                                                            ? esCorrecta
                                                                ? "bg-blue-600 text-white font-extrabold border-blue-700 shadow"
                                                                : "bg-red-600 text-white font-extrabold border-red-700 shadow"
                                                            : opcionSeleccionada
                                                            ? "bg-yellow-200 border-yellow-500 border-dashed animate-pulse text-yellow-900 font-bold"
                                                            : "bg-white border-blue-900/30 text-gray-400 font-semibold border-dashed"
                                                    }`}
                                                >
                                                    <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap px-1">
                                                        {respuestaActual || (opcionSeleccionada ? "Haz clic para colocar aquí" : "Arrastra o selecciona la opción")}
                                                    </span>
                                                </div>

                                                {/* Botón para remover si se equivocó */}
                                                {respuestaActual && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            desasignarOpción(p.id);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-xs flex items-center justify-center shadow transition"
                                                        title="Quitar respuesta"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. TIP FINANCIERO FINAL (SE DESBLOQUEA AL COMPLETAR LA ACTIVIDAD) */}
                {actividadCompletada && secTip && (
                    <section className="space-y-6">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTip.titulo}
                            </h2>

                            {/* Imagen del carro */}
                            <div className="flex justify-center">
                                <img
                                    src={secTip.imagen}
                                    alt="Concepto Planificación - Carro"
                                    className="w-56 md:w-72 object-contain drop-shadow-2xl animate-float-slow"
                                />
                            </div>

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTip.mensaje}
                            </p>
                        </div>
                    </section>
                )}

                {/* Botones Globales de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 max-w-4xl mx-auto">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!actividadCompletada}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !actividadCompletada
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
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

export default Act07;