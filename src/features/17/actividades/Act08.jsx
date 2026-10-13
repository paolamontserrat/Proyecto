import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const [pasoActual, setPasoActual] = useState(0);
    const [respuestas, setRespuestas] = useState({});
    const [saldo, setSaldo] = useState(data?.saldoInicial || 1000);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);
    const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    // Recalcular saldo total
    const calcularSaldo = (nuevasRespuestas) => {
        let actual = data?.saldoInicial || 1000;
        data?.preguntas?.forEach((p) => {
            const dec = nuevasRespuestas[p.id];
            if (dec === "AHORRO") {
                if (p.id === 1 || p.id === 3) actual += p.monto;
            } else if (dec === "GASTO") {
                if (p.id !== 1 && p.id !== 3) actual -= p.monto;
            }
        });
        setSaldo(actual);
    };

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const d = progreso.datos_actividad;
                        if (d.respuestas) {
                            setRespuestas(d.respuestas);
                            calcularSaldo(d.respuestas);
                            setPasoActual(Object.keys(d.respuestas).length);
                        }
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.respuestas) {
                            setRespuestas(d.respuestas);
                            calcularSaldo(d.respuestas);
                            setPasoActual(Object.keys(d.respuestas).length);
                        }
                    }
                }
            } catch (err) {
                console.warn("Error cargando datos:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Responder y hacer avanzar el carrito
    const handleOpcion = (opcion) => {
        const preguntaActual = data?.preguntas?.[pasoActual];
        if (!preguntaActual) return;

        const nuevasRespuestas = { ...respuestas, [preguntaActual.id]: opcion };
        setRespuestas(nuevasRespuestas);
        calcularSaldo(nuevasRespuestas);

        localStorage.setItem(
            storageKey,
            JSON.stringify({ respuestas: nuevasRespuestas })
        );

        if (pasoActual < (data?.preguntas?.length || 0)) {
            setPasoActual((prev) => prev + 1);
        }
    };

    // Reiniciar recorrido y regresar al inicio
    const handleReset = () => {
        setRespuestas({});
        setSaldo(data?.saldoInicial || 1000);
        setPasoActual(0);
        localStorage.removeItem(storageKey);
    };

    // Finalizar actividad
    const handleContinue = async () => {
        const datosAGuardar = {
            respuestas,
            saldoFinal: saldo,
            completada: true,
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
                console.warn("Error guardando en Supabase:", err);
            }
        }

        onComplete();
    };

    useEffect(() => {
        setMostrarRetroalimentacion(true);
        const timer = setTimeout(() => {
            setMostrarRetroalimentacion(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, [pasoActual]);

    const totalPreguntas = data?.preguntas?.length || 0;
    const juegoCompletado = pasoActual >= totalPreguntas;
    const preguntaActualObj = data?.preguntas?.[pasoActual];

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6">
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

            {/* Contenedor Principal (Tarjeta Clara/Blanca) */}
            <div className="bg-amber-400/95 p-6 md:p-10 rounded-3xl border-4 border-blue-900 shadow-2xl space-y-8 max-w-4xl mx-auto text-blue-950 backdrop-blur-md" translate="no">

                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-black text-blue-900 uppercase tracking-wide">
                        {data?.titulo || "El recorrido financiero"}
                    </h1>
                    <p className="text-sm md:text-base font-medium text-gray-700 max-w-2xl mx-auto">
                        {data?.descripcionActividad}
                    </p>
                </div>

                {/* VISUALIZACIÓN DEL RECORRIDO Y EL CARRITO */}
                <div className="bg-gradient-to-r from-cyan-100 via-blue-50 to-amber-100 p-6 rounded-3xl border-4 border-blue-300 shadow-inner space-y-4">
                    <div className="flex justify-between items-center font-black text-sm md:text-base text-blue-900">
                        <span>🚦 INICIO</span>
                        <span>🏁 META (ALIANZA)</span>
                    </div>

                    {/* Carretera con el Carrito avanzando */}
                    <div className="relative w-full bg-slate-800 h-16 rounded-2xl border-4 border-slate-700 flex items-center px-4 overflow-hidden">
                        {/* Líneas discontinuas de carretera */}
                        <div className="absolute inset-x-0 h-1 border-b-2 border-dashed border-yellow-400"></div>

                        {/* Carrito Animado posicionado según pasoActual */}
                        <div
                            className="absolute transition-all duration-700 ease-out flex flex-col items-center top-1"
                            style={{
                                left: `calc(${(pasoActual / totalPreguntas) * 85}% + 10px)`
                            }}
                        >
                            <img
                                src={data?.imagenCarro || "/images/17/63.png"}
                                alt="Carrito Alianzito"
                                className="h-10 md:h-12 object-contain animate-bounce-gentle drop-shadow-md"
                            />
                        </div>
                    </div>

                    {/* Indicador de Parada / Tienda Actual */}
                    <div className="text-center font-bold text-blue-900 text-sm">
                        Parada {Math.min(pasoActual + 1, totalPreguntas)} de {totalPreguntas}:{" "}
                        <span className="text-amber-700 uppercase font-black">
                            {preguntaActualObj?.estacion || "Llegada a la Meta"}
                        </span>
                    </div>
                </div>

                {/* Marcador de Saldo */}
                <div className="bg-amber-100 border-4 border-amber-400 p-4 rounded-2xl flex items-center justify-between max-w-md mx-auto shadow-md">
                    <span className="text-lg md:text-xl font-black text-amber-950 uppercase">
                        💰 Saldo Actual:
                    </span>
                    <span className={`text-2xl md:text-3xl font-black ${saldo >= 1000 ? "text-emerald-700" : "text-amber-800"}`}>
                        ${saldo}
                    </span>
                </div>

                {/* PREGUNTA O ESTACIÓN ACTUAL */}
                {!juegoCompletado && preguntaActualObj ? (
                    <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-3xl space-y-6 text-center shadow-md">
                        <div className="space-y-2">
                            <span className="bg-blue-900 text-yellow-300 text-xs font-black uppercase px-3 py-1 rounded-full">
                                {preguntaActualObj.estacion}
                            </span>
                            <h3 className="text-lg md:text-2xl font-bold text-blue-950 pt-2">
                                "{preguntaActualObj.situacion}"
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                            <button
                                onClick={() => handleOpcion("GASTO")}
                                className="py-4 rounded-2xl font-black text-white bg-cyan-600 hover:bg-red-600 shadow-lg hover:scale-105 active:scale-95 transition-all text-lg uppercase"
                            >
                                GASTO
                            </button>
                            <button
                                onClick={() => handleOpcion("AHORRO")}
                                className="py-4 rounded-2xl font-black text-white bg-cyan-600 hover:bg-blue-600 shadow-lg hover:scale-105 active:scale-95 transition-all text-lg uppercase"
                            >
                                AHORRO
                            </button>
                        </div>
                    </div>
                ) : (
                    /* PANTALLA AL LLEGAR A LA META */
                    <div className="bg-blue-100 border-4 border-blue-400 p-6 rounded-3xl text-center space-y-4 shadow-lg animate-bounce-gentle">
                        <h3 className="text-2xl font-black text-blue-950 uppercase">
                            🎉 ¡Has llegado a la meta en ALIANZA!
                        </h3>
                        <p className="text-lg font-bold text-blue-900">
                            Terminaste el recorrido con un saldo final de ${saldo} pesos.
                        </p>
                    </div>
                )}

                {/* Retroalimentación de la última decisión tomada */}
                {pasoActual > 0 && data?.preguntas?.[pasoActual - 1] && mostrarRetroalimentacion && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-center text-sm font-bold text-amber-950">
                        {respuestas[data.preguntas[pasoActual - 1].id] === "AHORRO"
                            ? data.preguntas[pasoActual - 1].retroalimentacionAhorro
                            : data.preguntas[pasoActual - 1].retroalimentacionGasto}
                    </div>
                )}

                {/* Tip Financiero */}
                {juegoCompletado && data?.tipFinanciero &&(
                    <div className="space-y-6 text-center">
                        <div className="bg-blue-950 p-8 rounded-3xl border-4 border-yellow-400 space-y-6 shadow-2xl">
                            {data.tipFinanciero.imagen && (
                                <img
                                    src={data.tipFinanciero.imagen}
                                    alt="Tip Financiero"
                                    className="max-h-56 object-contain mx-auto rounded-2xl border-2 border-yellow-400/30"
                                />
                            )}
                            {data.tipFinanciero.titulo && (
                                <h3 className="text-3xl font-black text-yellow-300 uppercase tracking-wider">
                                    {data.tipFinanciero.titulo}
                                </h3>
                            )}
                            {data.tipFinanciero.texto && (
                                <p className="text-lg md:text-xl font-medium text-blue-100 max-w-xl mx-auto leading-relaxed">
                                    {data.tipFinanciero.texto}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!juegoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !juegoCompletado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 border-2 border-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                    Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;