import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Mapeo de prioridades asignadas por el usuario: { [opcionId]: orden (1 a 6) }
    const [ordenPrioridades, setOrdenPrioridades] = useState({});
    const [razonReflexion, setRazonReflexion] = useState("");
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
    const storageKey = `act02-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage) igual que Act01
    useEffect(() => {
        const cargarProgreso = async () => {
            let cargadoDeSupabase = false;
            try {
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
                            const datos = progreso.datos_actividad;
                            setOrdenPrioridades(datos.ordenPrioridades || {});
                            setRazonReflexion(datos.razonReflexion || "");

                            // Sincronizar con LocalStorage
                            localStorage.setItem(storageKey, JSON.stringify(datos));
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
                            const parsed = JSON.parse(guardado);
                            setOrdenPrioridades(parsed.ordenPrioridades || {});
                            setRazonReflexion(parsed.razonReflexion || "");
                            console.log("Progreso recuperado de LocalStorage (Act02):", parsed);
                        } catch (e) {
                            console.error("Error al cargar progreso local", e);
                        }
                    }
                }
            } finally {
                // Permitir el autoguardado después de que los estados se hayan cargado
                setProgresoCargado(true);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Extraer secciones del JSON
    const secIntroduccion = data?.secciones?.introduccion;
    const secActividad = data?.secciones?.actividad;
    const secReflexion = data?.secciones?.reflexion;
    const secTarjetaFinal = data?.secciones?.tarjetaFinal;

    const totalOpciones = secActividad?.opciones?.length || 6;

    // Asignar o remover número de prioridad
    const handleSelectPrioridad = (opcionId, valor) => {
        const nuevoValor = parseInt(valor, 10);
        
        setOrdenPrioridades((prev) => {
            const copia = { ...prev };
            
            if (!nuevoValor) {
                delete copia[opcionId];
                return copia;
            }

            // Si otro elemento tenía este mismo número, se limpia esa asignación
            Object.keys(copia).forEach((key) => {
                if (copia[key] === nuevoValor) {
                    delete copia[key];
                }
            });

            copia[opcionId] = nuevoValor;
            return copia;
        });
    };

    // Validaciones
    const totalAsignadas = Object.keys(ordenPrioridades).length;
    const todasPrioridadesAsignadas = totalAsignadas === totalOpciones;

    useEffect(() => {
        setError("");

        if (totalAsignadas > 0 && !todasPrioridadesAsignadas) {
            setError(`Te falta asignar prioridad a ${totalOpciones - totalAsignadas} situación(es).`);
            return;
        }

        if (razonReflexion && razonReflexion.trim().length < 3) {
            setError("Escribe una breve razón de por qué ordenaste tus prioridades de esa forma.");
            return;
        }
    }, [ordenPrioridades, razonReflexion, totalAsignadas, todasPrioridadesAsignadas, totalOpciones]);

    const formularioValido = todasPrioridadesAsignadas && razonReflexion.trim().length >= 3 && !error;

    // Guardar en localStorage inmediatamente cuando cambie cualquier respuesta (solo si ya se cargó el borrador)
    useEffect(() => {
        if (!progresoCargado) return;

        const datosAGuardar = {
            ordenPrioridades,
            razonReflexion,
            resumenOrden: secActividad?.opciones?.map((opc) => ({
                id: opc.id,
                texto: opc.texto,
                prioridad: ordenPrioridades[opc.id] || null,
            })),
        };
        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [ordenPrioridades, razonReflexion, secActividad, storageKey, progresoCargado]);

    // Guarda en Supabase solo al presionar Continuar / Finalizar
    const handleContinue = async () => {
        if (!formularioValido) {
            setError("Por favor, asigna la prioridad del 1 al 6 a todas las situaciones y explica tu decisión.");
            return;
        }

        const datosAGuardar = {
            ordenPrioridades,
            razonReflexion,
            resumenOrden: secActividad?.opciones?.map((opc) => ({
                id: opc.id,
                texto: opc.texto,
                prioridad: ordenPrioridades[opc.id] || null,
            })),
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
        setOrdenPrioridades({});
        setRazonReflexion("");
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

            {/* Contenedor principal desplegado verticalmente */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-12" translate="no">
                
                {/* 1. INTRODUCCIÓN */}
                {secIntroduccion && (
                    <section className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl md:text-4xl font-black text-blue-900 mb-2">
                                {secIntroduccion.titulo}
                            </h1>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 bg-blue-50/70 border-2 border-blue-100 rounded-3xl p-6 shadow-sm">
                            {secIntroduccion.imagen1 && (
                                <img
                                    src={secIntroduccion.imagen1}
                                    alt="Alianzito Guía"
                                    className="w-36 md:w-48 object-contain drop-shadow-md flex-shrink-0 animate-float-slow"
                                />
                            )}
                            <div className="space-y-4 text-gray-700 font-medium text-base md:text-lg leading-relaxed">
                                {secIntroduccion.parrafos?.map((parrafo, idx) => (
                                    <p key={idx}>{parrafo}</p>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. SECCIÓN ACTIVIDAD: ORDENAR PRIORIDADES */}
                {secActividad && (
                    <section className="space-y-6 text-center">
                        <div className="relative text-center max-w-3xl mx-auto space-y-3">
                            <h2 className="text-2xl md:text-3xl font-black text-amber-500 uppercase tracking-wide">
                                {secActividad.titulo}
                            </h2>
                            <p className="text-gray-700 font-bold text-base md:text-lg bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                                {secActividad.instruccion}
                            </p>
                            {secActividad.imagen2 && (
                                <div className="absolute left-[-7%] bottom-[-32%] w-40 animate-float-slow select-none z-10">
                                    <img
                                        src={secActividad.imagen2}
                                        alt="Consola de Videojuegos"
                                        className="w-full h-auto object-contain filter drop-shadow-md animate-bounce-gentle"
                                    />
                                </div>
                            )}
                            {secActividad.imagen3 && (
                                <div className="absolute right-[-7%] top-[-8%] w-28 animate-float-slow select-none z-10">
                                    <img
                                        src={secActividad.imagen3}
                                        alt="Volante de carreras"
                                        className="w-full h-auto object-contain filter drop-shadow-md animate-bounce-gentle"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative bg-amber-500/10 border-2 border-amber-300/40 rounded-3xl p-5 md:p-8 space-y-4">
                            <div className="space-y-4">
                                {secActividad.opciones?.map((opc) => {
                                    const valorActual = ordenPrioridades[opc.id] || "";
                                    return (
                                        <div
                                            key={opc.id}
                                            className="bg-white border-2 border-amber-200 rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition"
                                        >
                                            <p className="font-bold text-blue-900 text-base md:text-lg flex-1">
                                                {opc.texto}
                                            </p>
                                            <div className="flex-shrink-0">
                                                <select
                                                    value={valorActual}
                                                    onChange={(e) => handleSelectPrioridad(opc.id, e.target.value)}
                                                    className="w-16 h-12 text-center font-black text-lg bg-yellow-400 text-blue-950 border-2 border-amber-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-600 shadow-sm cursor-pointer"
                                                >
                                                    <option value="">-</option>
                                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                                        <option key={num} value={num}>
                                                            {num}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. SECCIÓN REFLEXIÓN */}
                {secReflexion && (
                    <section className="space-y-6 text-center">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-black text-blue-900">
                                {secReflexion.pregunta}
                            </h2>
                        </div>
                        <textarea
                            rows={3}
                            placeholder={secReflexion.placeholder}
                            value={razonReflexion}
                            onChange={(e) => setRazonReflexion(e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-sky-300 focus:border-sky-500 focus:outline-none font-semibold text-gray-800 shadow-inner text-base md:text-lg"
                        />
                    </section>
                )}

                {/* 4. SECCIÓN TARJETA FINAL */}
                {secTarjetaFinal && (
                    <section className="space-y-6">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTarjetaFinal.titulo}
                            </h2>
                            <p className="text-lg md:text-xl font-extrabold uppercase border-b border-white/20 pb-3">
                                {secTarjetaFinal.mensajePrincipal}
                            </p>
                            {/* Imagen del carro */}
                            <div className="flex justify-center">
                                <img
                                    src={secTarjetaFinal.imagen}
                                    alt="Concepto Planificación - Carro"
                                    className="w-56 md:w-72 object-contain drop-shadow-2xl animate-float-slow"
                                />
                            </div>

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTarjetaFinal.subtexto}
                            </p>
                            <div className="bg-yellow-400 text-blue-950 p-4 rounded-2xl font-black text-sm md:text-base shadow-md">
                                💡 {secTarjetaFinal.tip}
                            </div>
                        </div>
                    </section>
                )}

                {/* Alerta de Error */}
                {error && (
                    <div className="bg-red-100 border-l-8 border-red-500 text-red-900 p-4 rounded-xl font-bold text-lg">
                        ⚠️ {error}
                    </div>
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

export default Act02;