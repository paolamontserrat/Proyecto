import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secActividad = data?.secciones?.actividad;
    const secTip = data?.secciones?.tipFinanciero;
    const parejasBase = secActividad?.parejas || [];

    // Función para generar y desordenar las 20 cartas (10 palabras + 10 imágenes)
    const prepararCartas = (parejas) => {
        if (!parejas || parejas.length === 0) return [];
        const cartas = [];

        parejas.forEach((p) => {
            // Carta de tipo Texto (Concepto)
            cartas.push({
                uid: `concepto-${p.id}`,
                parejaId: p.id,
                tipo: "concepto",
                contenido: p.concepto,
            });
            // Carta de tipo Imagen (Ilustración)
            cartas.push({
                uid: `imagen-${p.id}`,
                parejaId: p.id,
                tipo: "imagen",
                contenido: p.imagen,
                descripcionAlt: p.descripcionAlt,
            });
        });

        return cartas.sort(() => 0.5 - Math.random());
    };

    // Estados del Juego
    const [tableroCartas, setTableroCartas] = useState([]);
    const [volteadas, setVolteadas] = useState([]); // Índices de las 2 cartas volteadas actualmente
    const [emparejadas, setEmparejadas] = useState([]); // Array con los parejaId ya encontrados
    const [bloqueoTablero, setBloqueoTablero] = useState(false);
    const [juegoTerminado, setJuegoTerminado] = useState(false);

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
    const storageKey = `act06-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO CORREGIDA (Supabase [si completada] -> LocalStorage -> Default)
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setTableroCartas(prepararCartas(parejasBase));
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
                        if (datos.tableroCartas?.length > 0) setTableroCartas(datos.tableroCartas);
                        if (datos.emparejadas) setEmparejadas(datos.emparejadas);
                        if (datos.juegoTerminado !== undefined) setJuegoTerminado(datos.juegoTerminado);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                // Paso 2: Si no estaba completada en Supabase, intentar cargar desde LocalStorage
                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.tableroCartas?.length > 0) {
                            setTableroCartas(parsed.tableroCartas);
                        } else {
                            setTableroCartas(prepararCartas(parejasBase));
                        }
                        if (parsed.emparejadas) setEmparejadas(parsed.emparejadas);
                        if (parsed.juegoTerminado !== undefined) setJuegoTerminado(parsed.juegoTerminado);
                        cargado = true;
                    }
                }

                // Paso 3: Estado por defecto
                if (!cargado) {
                    setTableroCartas(prepararCartas(parejasBase));
                }
            } catch (err) {
                console.warn("Error al cargar progreso:", err);
                setTableroCartas(prepararCartas(parejasBase));
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
            tableroCartas,
            emparejadas,
            juegoTerminado,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [tableroCartas, emparejadas, juegoTerminado, cargandoProgreso, storageKey, data?.id]);

    // LÓGICA DEL MEMORAMA
    const handleSeleccionarCarta = (index) => {
        if (bloqueoTablero || volteadas.includes(index)) return;

        const cartaSeleccionada = tableroCartas[index];
        if (emparejadas.includes(cartaSeleccionada.parejaId)) return;

        const nuevasVolteadas = [...volteadas, index];
        setVolteadas(nuevasVolteadas);

        if (nuevasVolteadas.length === 2) {
            setBloqueoTablero(true);
            const [idx1, idx2] = nuevasVolteadas;
            const carta1 = tableroCartas[idx1];
            const carta2 = tableroCartas[idx2];

            // Coinciden si tienen la misma parejaId y son de diferente tipo (concepto e imagen)
            if (carta1.parejaId === carta2.parejaId && carta1.tipo !== carta2.tipo) {
                const nuevasEmparejadas = [...emparejadas, carta1.parejaId];
                setEmparejadas(nuevasEmparejadas);
                setVolteadas([]);
                setBloqueoTablero(false);

                if (nuevasEmparejadas.length === parejasBase.length) {
                    setJuegoTerminado(true);
                }
            } else {
                // No coinciden: esperar breve momento y volver a voltear
                setTimeout(() => {
                    setVolteadas([]);
                    setBloqueoTablero(false);
                }, 1000);
            }
        }
    };

    const handleReset = () => {
        setTableroCartas(prepararCartas(parejasBase));
        setVolteadas([]);
        setEmparejadas([]);
        setBloqueoTablero(false);
        setJuegoTerminado(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            tableroCartas,
            emparejadas,
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
        <LayoutActividad fondo={data?.fondo || "bg-gradient-to-b from-amber-400 to-amber-500"}>
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

            {/* Contenedor Principal */}
            <div className="bg-amber-500 p-4 md:p-8 rounded-3xl border-4 border-white shadow-2xl space-y-8" translate="no">

                {/* Encabezado e Instrucción */}
                {secActividad && (
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black text-blue-950 uppercase tracking-wide drop-shadow-sm">
                            {secActividad.titulo}
                        </h1>
                        <p className="text-blue-950 font-bold text-base md:text-lg max-w-2xl mx-auto bg-amber-400/80 p-3 rounded-2xl border border-amber-300">
                            {secActividad.instruccion}
                        </p>
                    </div>
                )}

                {/* TABLERO DE CARDS (RETÍCULA DE 20 TARJETAS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
                    {tableroCartas.map((carta, index) => {
                        const estaVolteada = volteadas.includes(index);
                        const estaEmparejada = emparejadas.includes(carta.parejaId);
                        const visible = estaVolteada || estaEmparejada;

                        return (
                            <button
                                key={carta.uid || index}
                                onClick={() => handleSeleccionarCarta(index)}
                                disabled={visible || bloqueoTablero}
                                className={`h-28 sm:h-32 md:h-36 rounded-2xl font-black text-center p-1 md:p-2 transition-all duration-300 transform shadow-md flex items-center justify-center border-4 overflow-hidden ${
                                    visible
                                        ? carta.tipo === "concepto"
                                            ? "bg-blue-900 text-white border-blue-950 scale-100"
                                            : "bg-white text-blue-950 border-amber-300 scale-100"
                                        : "bg-blue-900 border-blue-950 hover:bg-blue-800 hover:scale-105 cursor-pointer active:scale-95"
                                }`}
                            >
                                {visible ? (
                                    carta.tipo === "concepto" ? (
                                        <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs md:text-xs font-black uppercase tracking-tight leading-none whitespace-nowrap px-0.5 select-none">
                                            {carta.contenido}
                                        </span>
                                    ) : (
                                        <img
                                            src={carta.contenido}
                                            alt={carta.descripcionAlt || "Ilustración del memorama"}
                                            className="max-h-20 max-w-full object-contain drop-shadow-sm"
                                        />
                                    )
                                ) : (
                                    /* Reverso de la carta */
                                    <div className="text-white opacity-40 font-black text-2xl select-none">
                                        ★
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TARJETA TIP FINANCIERO (DESBLOQUEADA AL TERMINAR EL JUEGO) */}
                {juegoTerminado && secTip && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-amber-400 max-w-4xl mx-auto">
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

export default Act06;