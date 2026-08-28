import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Heart, Clock, DollarSign, Target, CheckCircle, AlertCircle } from "lucide-react";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const seccionInter = config.seccionInteractiva || {};
    const configuracion = seccionInter.configuracion || {
        vidasIniciales: 3,
        montoInicial: 1000,
        tiempoLimiteSegundos: 10,
    };
    const metas = seccionInter.metas || [];
    const escenarios = seccionInter.escenarios || [];
    const resultados = seccionInter.resultados || {};

    // --- Estados del Simulador ---
    const [metaSeleccionada, setMetaSeleccionada] = useState(null);
    const [dineroDisponible, setDineroDisponible] = useState(configuracion.montoInicial);
    const [vidas, setVidas] = useState(configuracion.vidasIniciales);
    const [escenarioActualIndex, setEscenarioActualIndex] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState(configuracion.tiempoLimiteSegundos);
    const [mensajeRetro, setMensajeRetro] = useState("");
    const [historialDecisiones, setHistorialDecisiones] = useState([]);
    const [resultadoFinal, setResultadoFinal] = useState(null); // 'victoria', 'derrota' o null

    const timerRef = useRef(null);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act4-${rango}-${userId}`;

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
                        restaurarEstado(progreso.datos_actividad);
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
                    restaurarEstado(parsed);
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const restaurarEstado = (datos) => {
        if (datos.metaSeleccionada) setMetaSeleccionada(datos.metaSeleccionada);
        if (datos.dineroDisponible !== undefined) setDineroDisponible(datos.dineroDisponible);
        if (datos.vidasRestantes !== undefined) setVidas(datos.vidasRestantes);
        if (datos.historialDecisiones) setHistorialDecisiones(datos.historialDecisiones);
        if (datos.escenarioActualIndex !== undefined) setEscenarioActualIndex(datos.escenarioActualIndex);
        if (datos.resultadoFinal) setResultadoFinal(datos.resultadoFinal);
    };

    const guardarProgresoActual = (estadoFinal = null) => {
        const estadoGuardar = {
            metaSeleccionada,
            dineroDisponible,
            vidasRestantes: vidas,
            escenarioActualIndex,
            historialDecisiones,
            resultadoFinal: estadoFinal || resultadoFinal,
            completado: estadoFinal === "victoria",
        };

        localStorage.setItem(storageKey, JSON.stringify(estadoGuardar));

        if (userId !== "anon" && config.id) {
            supabase
                .from("progreso_actividades")
                .upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: estadoFinal === "victoria",
                    },
                    { onConflict: "usuario_id,actividad_id" }
                )
                .catch((err) => console.warn("Offline, guardado local", err));
        }
    };

    // --- Temporizador para el escenario activo ---
    useEffect(() => {
        if (metaSeleccionada && !resultadoFinal) {
            const escenario = escenarios[escenarioActualIndex];
            if (escenario && escenario.tieneTiempo) {
                setTiempoRestante(escenario.tiempo || configuracion.tiempoLimiteSegundos);
                timerRef.current = setInterval(() => {
                    setTiempoRestante((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            handleTiempoAgotado();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [metaSeleccionada, escenarioActualIndex, resultadoFinal]);

    const handleTiempoAgotado = () => {
        const nuevasVidas = vidas - 1;
        setVidas(nuevasVidas);
        setMensajeRetro("¡Se acabó el tiempo! Perdiste 1 vida por indecisión.");

        if (nuevasVidas <= 0) {
            finalizarJuego("derrota");
        } else {
            avanzarSiguiente(escenarios[escenarioActualIndex]?.opciones[0]?.siguienteEscenario);
        }
    };

    // --- Acciones ---
    const handleSeleccionarMeta = (meta) => {
        setMetaSeleccionada(meta);
        setEscenarioActualIndex(0);
        setMensajeRetro("");
    };

    const handleOpcionClick = (opcion) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const nuevoDinero = Math.max(0, dineroDisponible - opcion.costo);
        let nuevasVidas = vidas;

        if (opcion.perderVida) {
            nuevasVidas = vidas - 1;
        }

        setDineroDisponible(nuevoDinero);
        setVidas(nuevasVidas);
        setMensajeRetro(opcion.mensaje);

        const decisionReg = {
            escenario: escenarios[escenarioActualIndex]?.titulo,
            opcionElegida: opcion.texto,
            costo: opcion.costo,
            dineroRestante: nuevoDinero,
        };

        setHistorialDecisiones((prev) => [...prev, decisionReg]);

        if (nuevasVidas <= 0) {
            finalizarJuego("derrota");
        } else {
            avanzarSiguiente(opcion.siguienteEscenario);
        }
    };

    const avanzarSiguiente = (siguienteEscenarioId) => {
        if (siguienteEscenarioId === "derrota") {
            finalizarJuego("derrota");
            return;
        }

        if (siguienteEscenarioId === "evaluacion") {
            if (dineroDisponible > 0 && vidas > 0) {
                finalizarJuego("victoria");
            } else {
                finalizarJuego("derrota");
            }
            return;
        }

        const nextIdx = escenarios.findIndex((e) => e.id === siguienteEscenarioId);
        if (nextIdx !== -1) {
            setEscenarioActualIndex(nextIdx);
        } else {
            finalizarJuego("victoria");
        }
    };

    const finalizarJuego = (estado) => {
        setResultadoFinal(estado);
        guardarProgresoActual(estado);
    };

    const handleReset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setDineroDisponible(configuracion.montoInicial);
        setVidas(configuracion.vidasIniciales);
        setEscenarioActualIndex(0);
        setMetaSeleccionada(null);
        setMensajeRetro("");
        setHistorialDecisiones([]);
        setResultadoFinal(null);
        localStorage.removeItem(storageKey);
    };

    const escenarioActual = escenarios[escenarioActualIndex];

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
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
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
                
                {/* ENCABEZADO Y STATUS */}
                <div className="text-center space-y-4">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "EL COSTO DE MIS DECISIONES"}
                    </h1>

                {/* INTRODUCCIÓN */}
                <div className="max-w-5xl mx-auto space-y-4">
                    <h2 className="text-xl md:text-2xl font-black text-blue-950 text-center">
                        {seccionInter.tituloPrincipal}
                    </h2>
                    {seccionInter.introduccion && (
                        <div className="flex flex-col md:flex-row items-center gap-6 text-left bg-sky-50/70 p-6 rounded-2xl border-2 border-slate-200">
                            {seccionInter.introduccion.imagenPersonaje && (
                                <img
                                    src={seccionInter.introduccion.imagenPersonaje}
                                    alt="Personaje"
                                    className="w-28 h-28 object-contain animate-float-slow"
                                />
                            )}
                            <div className="space-y-3">
                                <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                                    {seccionInter.introduccion.texto}
                                </p>
                                {seccionInter.introduccion.puntosClave && (
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <ul className="space-y-1">
                                            {seccionInter.introduccion.puntosClave.map((punto, idx) => (
                                                <li key={idx} className="flex items-center text-sm font-semibold text-blue-900">
                                                    <CheckCircle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                                                    <span>{punto}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* SELECCIÓN DE META */}
                <div className="max-w-3xl mx-auto space-y-4">
                    <h2 className="text-xl md:text-2xl font-black text-blue-950 text-center">
                        1. Elige tu meta de ahorro:
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {metas.map((meta) => {
                            const estaSeleccionada = metaSeleccionada?.id === meta.id;
                            return (
                                <div
                                    key={meta.id}
                                    onClick={() => handleSeleccionarMeta(meta)}
                                    className={`border-4 rounded-2xl p-4 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center justify-between ${
                                        estaSeleccionada
                                            ? "bg-amber-100 border-amber-400 shadow-lg scale-105"
                                            : "bg-sky-50/50 border-slate-300 hover:border-amber-300"
                                    }`}
                                >
                                    <img src={meta.imagen} alt={meta.nombre} className="w-20 h-20 object-contain mb-2 animate-bounce-gentle" />
                                    <h3 className="font-bold text-blue-950 text-center text-sm md:text-base">{meta.nombre}</h3>
                                    <span className="mt-2 text-xs font-black bg-blue-900 text-white px-3 py-1 rounded-full">
                                        ${meta.monto}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Barra Estática de Puntuación/Status */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md max-w-2xl mx-auto">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center space-x-1">
                                <span className="text-sm font-medium mr-2">Vidas:</span>
                                {[...Array(configuracion.vidasIniciales)].map((_, i) => (
                                    <Heart
                                        key={i}
                                        className={`w-6 h-6 ${i < vidas ? "text-red-500 fill-red-500" : "text-gray-400"}`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center bg-blue-800/80 px-3 py-1.5 rounded-xl border border-blue-600">
                                    <DollarSign className="w-5 h-5 text-amber-400 mr-1" />
                                    <span className="font-bold text-lg">${dineroDisponible}</span>
                                </div>
                                {metaSeleccionada && (
                                    <div className="flex items-center bg-indigo-800/80 px-3 py-1.5 rounded-xl border border-indigo-600">
                                        <Target className="w-5 h-5 text-amber-300 mr-1" />
                                        <span className="text-sm font-semibold">Meta: ${metaSeleccionada.monto}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {metaSeleccionada && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Progreso de ahorro</span>
                                    <span>{Math.min(100, Math.round((dineroDisponible / metaSeleccionada.monto) * 100))}%</span>
                                </div>
                                <div className="w-full bg-blue-950 rounded-full h-3 overflow-hidden border border-blue-700">
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (dineroDisponible / metaSeleccionada.monto) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ESCENARIO ACTUAL */}
                {metaSeleccionada && !resultadoFinal && escenarioActual && (
                    <div className="max-w-2xl mx-auto space-y-4 pt-4 border-t-2 border-slate-100">
                        <div className="flex justify-between items-center bg-amber-50 p-3 rounded-2xl border border-amber-200">
                            <span className="text-amber-900 font-bold text-sm md:text-base">
                                2. Toma tu decisión:
                            </span>
                            <div className="flex items-center bg-amber-200 px-3 py-1 rounded-full text-amber-900 font-black text-sm">
                                <Clock className="w-4 h-4 mr-1 animate-pulse" />
                                <span>{tiempoRestante}s</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 text-center space-y-4">
                            <h3 className="text-xl md:text-2xl font-black text-blue-900">{escenarioActual.titulo}</h3>
                            <p className="text-gray-700 text-base md:text-lg font-medium">{escenarioActual.descripcion}</p>

                            {escenarioActual.imagen && (
                                <div className="flex justify-center py-2">
                                    <img
                                        src={escenarioActual.imagen}
                                        alt="Dilema"
                                        className="w-32 h-32 object-contain"
                                    />
                                </div>
                            )}

                            {/* Opciones con color Amarillo en Ahorro */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {escenarioActual.opciones?.map((opcion) => (
                                    <button
                                        key={opcion.id}
                                        onClick={() => handleOpcionClick(opcion)}
                                        className={`p-4 rounded-2xl font-black text-lg shadow-md active:scale-95 transition-all ${
                                            opcion.esAhorro
                                                ? "bg-amber-400 hover:bg-amber-500 text-blue-950"
                                                : "bg-blue-900 hover:bg-blue-950 text-white"
                                        }`}
                                    >
                                        {opcion.texto}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* MENSAJE DE RETROALIMENTACIÓN */}
                {mensajeRetro && !resultadoFinal && (
                    <div className="max-w-2xl mx-auto bg-sky-50 border-2 border-slate-300 p-4 rounded-2xl text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-blue-900 mx-auto" />
                        <p className="text-base md:text-lg font-bold text-blue-950">{mensajeRetro}</p>
                    </div>
                )}

                {/* 5. RESULTADO FINAL */}
                {resultadoFinal && (
                    <div className="max-w-2xl mx-auto text-center space-y-4 pt-4 border-t-2 border-slate-100">
                        {resultadoFinal === "victoria" ? (
                            <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl space-y-4">
                                <CheckCircle className="w-14 h-14 text-amber-500 mx-auto" />
                                <h3 className="text-2xl md:text-3xl font-black text-blue-950">
                                    {resultados.victoria?.titulo || "¡META CONSEGUIDA!"}
                                </h3>
                                <p className="text-gray-700 text-base md:text-lg font-medium">
                                    {resultados.victoria?.mensajeExito}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-2xl space-y-4">
                                <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
                                <h3 className="text-2xl md:text-3xl font-black text-red-900">
                                    {resultados.derrota?.titulo || "¡SE ACABARON TUS VIDAS O DINERO!"}
                                </h3>
                                <p className="text-gray-700 text-base md:text-lg font-medium">
                                    {resultados.derrota?.mensajeFallo}
                                </p>
                            </div>
                        )}
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
                        onClick={onComplete}
                        disabled={resultadoFinal !== "victoria"}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            resultadoFinal !== "victoria"
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

export default Act04;