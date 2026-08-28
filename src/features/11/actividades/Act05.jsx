import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Lock, KeyRound } from "lucide-react";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const seccionInter = config.seccionInteractiva || {};
    const introduccion = seccionInter.introduccion || {};
    const tabla = seccionInter.tablaComparativa || {};
    const filas = tabla.filas || [];
    const conclusion = seccionInter.conclusion || {};
    const juegoCifrado = seccionInter.juegoCifrado || {};

    // --- ESTADOS ---
    const [respuestasTabla, setRespuestasTabla] = useState({
        casa_ventajas: "",
        casa_riesgos: "",
        cuenta_ventajas: "",
        cuenta_riesgos: ""
    });

    const [respuestasCifrado, setRespuestasCifrado] = useState({});
    const inputRefs = useRef({});

    // --- PERSISTENCIA ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act5-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar el componente
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
                        if (progreso.datos_actividad.respuestasTabla) {
                            setRespuestasTabla(progreso.datos_actividad.respuestasTabla);
                        }
                        if (progreso.datos_actividad.respuestasCifrado) {
                            setRespuestasCifrado(progreso.datos_actividad.respuestasCifrado);
                        }
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestasTabla) setRespuestasTabla(parsed.respuestasTabla);
                    if (parsed.respuestasCifrado) setRespuestasCifrado(parsed.respuestasCifrado);
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Función unificada para guardar en LocalStorage y Supabase al momento
    const guardarProgresoEnTiempoReal = async (tablaRes, cifradoRes) => {
        const estadoGuardar = {
            respuestasTabla: tablaRes,
            respuestasCifrado: cifradoRes,
        };

        // 1. Guardar en LocalStorage al instante
        localStorage.setItem(storageKey, JSON.stringify(estadoGuardar));

        // 2. Guardar en Supabase al instante (sin marcar como completada aún)
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: false, // Permanece false hasta dar clic en Continuar
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al guardar avance automático en Supabase", err);
            }
        }
    };

    // Manejador de la Tabla Comparativa
    const handleTablaChange = (campo, valor) => {
        const nuevas = { ...respuestasTabla, [campo]: valor };
        setRespuestasTabla(nuevas);
        guardarProgresoEnTiempoReal(nuevas, respuestasCifrado);
    };

    // Auxiliar para evaluar si la letra cifrada introducida es correcta
    const esLetraCorrecta = (letraCifrada, letraIngresada) => {
        if (!letraIngresada || !juegoCifrado.mapaCodigo) return false;
        const correcta = juegoCifrado.mapaCodigo[letraCifrada];
        return correcta && correcta.toUpperCase() === letraIngresada.toUpperCase();
    };

    // Manejador del Juego Cifrado
    const handleCifradoChange = (pIdx, lIdx, letraCifrada, valor) => {
        const char = valor.slice(-1).toUpperCase();
        const key = `${pIdx}-${lIdx}`;
        const nuevas = { ...respuestasCifrado, [key]: char };

        setRespuestasCifrado(nuevas);
        guardarProgresoEnTiempoReal(respuestasTabla, nuevas);

        // Mover el foco si el usuario escribió un carácter
        if (char) {
            const nextKey = `${pIdx}-${lIdx + 1}`;
            if (inputRefs.current[nextKey]) {
                inputRefs.current[nextKey].focus();
            } else {
                const nextWordKey = `${pIdx + 1}-0`;
                if (inputRefs.current[nextWordKey]) {
                    inputRefs.current[nextWordKey].focus();
                }
            }
        }
    };

    const handleKeyDown = (e, pIdx, lIdx, letraCifrada) => {
        const key = `${pIdx}-${lIdx}`;
        const estaCorrecta = esLetraCorrecta(letraCifrada, respuestasCifrado[key]);

        if (estaCorrecta) return;

        if (e.key === "Backspace" && !respuestasCifrado[key]) {
            const prevKey = `${pIdx}-${lIdx - 1}`;
            if (inputRefs.current[prevKey]) {
                inputRefs.current[prevKey].focus();
            } else if (pIdx > 0) {
                const prevWordLastChar = juegoCifrado.palabrasCifradas[pIdx - 1].length - 1;
                const prevWordKey = `${pIdx - 1}-${prevWordLastChar}`;
                if (inputRefs.current[prevWordKey]) {
                    inputRefs.current[prevWordKey].focus();
                }
            }
        }
    };

    // --- VALIDACIONES ---
    const tablaValida =
        respuestasTabla.casa_ventajas.trim() !== "" &&
        respuestasTabla.casa_riesgos.trim() !== "" &&
        respuestasTabla.cuenta_ventajas.trim() !== "" &&
        respuestasTabla.cuenta_riesgos.trim() !== "";

    const textoUsuarioCifrado = (juegoCifrado.palabrasCifradas || [])
        .map((palabra, pIdx) =>
            palabra.map((_, lIdx) => respuestasCifrado[`${pIdx}-${lIdx}`] || "_").join("")
        )
        .join(" ");

    const cifradoValido = juegoCifrado.respuestaEsperada
        ? textoUsuarioCifrado.trim() === juegoCifrado.respuestaEsperada.trim()
        : true;

    const esValidoGlobal = tablaValida && cifradoValido;

    const handleReset = async () => {
        const estadoVacioTabla = {
            casa_ventajas: "",
            casa_riesgos: "",
            cuenta_ventajas: "",
            cuenta_riesgos: ""
        };
        setRespuestasTabla(estadoVacioTabla);
        setRespuestasCifrado({});
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestasTabla: estadoVacioTabla, respuestasCifrado: {} },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error reseteando en Supabase", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!esValidoGlobal) return;

        const estadoGuardar = {
            respuestasTabla,
            respuestasCifrado,
            completado: true,
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
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
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
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

            {/* Tarjeta Principal Unificada */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* 1. ENCABEZADO */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "¿Dónde crece mejor mi dinero?"}
                    </h1>
                </div>

                {/* 2. INTRODUCCIÓN */}
                <div className="max-w-4xl mx-auto space-y-4">
                    {introduccion.texto && (
                        <div className="flex flex-col items-center gap-8 text-left bg-sky-50/70 p-8 md:p-10 rounded-3xl border-2 border-sky-200 shadow-sm">
                            <div className="space-y-4 w-full">
                                <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-semibold">
                                    {introduccion.texto}
                                </p>
                            </div>
                            {introduccion.imagenPersonaje && (
                                <img
                                    src={introduccion.imagenPersonaje}
                                    alt="Personaje"
                                    className="w-full max-w-md h-auto object-contain shrink-0 animate-float-slow"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* 3. TABLA COMPARATIVA */}
                <div className="max-w-4xl mx-auto space-y-6">
                    <h2 className="text-xl md:text-2xl font-black text-blue-950 text-center">
                        {seccionInter.instruccion || "Analiza las opciones escribe tu respuesta:"}
                    </h2>

                    <div className="space-y-6">
                        {filas.map((fila) => (
                            <div key={fila.id} className="bg-sky-50/50 p-6 rounded-3xl border-2 border-sky-200 space-y-4 shadow-sm">
                                <h3 className="font-black text-blue-900 text-lg md:text-xl uppercase border-b-2 border-amber-300 pb-2">
                                    {fila.situacion}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="block font-extrabold text-blue-950 text-base">Ventajas:</label>
                                        <textarea
                                            rows={3}
                                            value={respuestasTabla[`${fila.id}_ventajas`] || ""}
                                            onChange={(e) => handleTablaChange(`${fila.id}_ventajas`, e.target.value)}
                                            placeholder={fila.ventajasPlaceholder || "Escribe las ventajas..."}
                                            className="w-full p-4 rounded-2xl border-2 border-sky-300 focus:border-amber-400 outline-none font-semibold text-blue-950 text-base bg-white resize-none shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block font-extrabold text-blue-950 text-base">Riesgos:</label>
                                        <textarea
                                            rows={3}
                                            value={respuestasTabla[`${fila.id}_riesgos`] || ""}
                                            onChange={(e) => handleTablaChange(`${fila.id}_riesgos`, e.target.value)}
                                            placeholder={fila.riesgosPlaceholder || "Escribe los riesgos..."}
                                            className="w-full p-4 rounded-2xl border-2 border-sky-300 focus:border-amber-400 outline-none font-semibold text-blue-950 text-base bg-white resize-none shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. JUEGO DEL MENSAJE SECRETO */}
                {juegoCifrado.mapaCodigo && (
                    <div className="max-w-4xl mx-auto bg-sky-50/70 p-6 md:p-8 rounded-3xl border-2 border-sky-200 shadow-sm space-y-6">
                        {/* Título */}
                        <div className="flex items-center justify-center gap-3 text-blue-950">
                            <KeyRound className="w-8 h-8 text-amber-500" />
                            <h2 className="text-2xl md:text-3xl font-black text-center">
                                {juegoCifrado.titulo || "Descifra el Mensaje Secreto"}
                            </h2>
                        </div>

                        {/* Código Horizontal */}
                        <div className="bg-amber-300/80 border-2 border-amber-400 p-4 rounded-2xl max-w-2xl mx-auto shadow-sm">
                        <h3 className="text-center font-black text-blue-950 text-lg mb-2">CLAVE DE CIFRADO</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center font-bold text-xs md:text-sm text-blue-950">
                                {Object.entries(juegoCifrado.mapaCodigo).map(([codigo, letra]) => (
                                    <div key={codigo} className="bg-white/70 py-1 px-3 rounded-lg font-mono text-sm md:text-base whitespace-nowrap flex-shrink-0 shadow-sm">
                                        <span className="text-blue-900">{codigo}</span> = <span className="text-amber-900 font-black">{letra}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tablero de Palabras */}
                        <div className="bg-white p-4 md:p-6 rounded-2xl border border-sky-200 shadow-inner space-y-6">
                            <div className="flex flex-wrap gap-4 justify-center">
                                {juegoCifrado.palabrasCifradas?.map((palabra, pIdx) => (
                                    <div key={pIdx} className="flex gap-1.5 p-2 bg-sky-100/60 rounded-xl border border-sky-200">
                                        {palabra.map((letraCifrada, lIdx) => {
                                            const key = `${pIdx}-${lIdx}`;
                                            const valorActual = respuestasCifrado[key] || "";
                                            const esCorrecta = esLetraCorrecta(letraCifrada, valorActual);

                                            return (
                                                <div key={lIdx} className="flex flex-col items-center gap-1">
                                                    <span className="font-mono text-lg font-extrabold text-blue-900 italic">
                                                        {letraCifrada}
                                                    </span>
                                                    <input
                                                        ref={(el) => (inputRefs.current[key] = el)}
                                                        type="text"
                                                        maxLength={1}
                                                        disabled={esCorrecta}
                                                        value={valorActual}
                                                        onChange={(e) => handleCifradoChange(pIdx, lIdx, letraCifrada, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, pIdx, lIdx, letraCifrada)}
                                                        className={`w-8 h-10 md:w-10 md:h-12 text-center text-lg md:text-xl font-black rounded-lg outline-none uppercase shadow-inner transition-all ${
                                                            esCorrecta
                                                                ? "bg-blue-600 text-white border-2 border-blue-700 cursor-not-allowed shadow-md"
                                                                : "bg-white text-blue-950 border-2 border-sky-300 focus:border-amber-400"
                                                        }`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pista */}
                        {juegoCifrado.pista && (
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-blue-950 text-center">
                                <span className="font-extrabold text-amber-800 block text-sm uppercase">Pista:</span>
                                <p className="font-medium italic text-base">"{juegoCifrado.pista}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. CONCLUSIÓN */}
                {conclusion.puntos && tablaValida && (
                    <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl space-y-4">
                        <h3 className="text-2xl md:text-3xl font-black text-amber-400 text-center uppercase tracking-wide">
                            {conclusion.titulo || "CONCLUSIÓN"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {conclusion.puntos.map((punto, idx) => (
                                <div key={idx} className="flex items-start bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/15">
                                    <CheckCircle className="w-6 h-6 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                                    <span className="font-bold text-base md:text-lg leading-snug">{punto}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN GLOBALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esValidoGlobal}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esValidoGlobal
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