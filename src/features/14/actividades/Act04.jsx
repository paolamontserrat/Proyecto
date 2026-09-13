import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const presupuestoInicial = config.actividad?.presupuestoInicial || 600;

    const [juegoIniciado, setJuegoIniciado] = useState(true);
    const [caminoSeleccionado, setCaminoSeleccionado] = useState(null);
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
    const storageKey = `act04-${rango}-${userId}`;

    // Cargar progreso previo
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
                        const { caminoId, terminado } = progreso.datos_actividad;
                        if (caminoId) {
                            const seleccionado = config.actividad?.caminos?.find(c => c.id === caminoId);
                            setCaminoSeleccionado(seleccionado || null);
                        }
                        if (terminado) {
                            setJuegoIniciado(true);
                            setJuegoTerminado(true);
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
                    if (parsed.caminoId) {
                        const seleccionado = config.actividad?.caminos?.find(c => c.id === parsed.caminoId);
                        setCaminoSeleccionado(seleccionado || null);
                    }
                    if (parsed.terminado) {
                        setJuegoIniciado(true);
                        setJuegoTerminado(true);
                    }
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const caminos = config.actividad?.caminos || [];

    const handleIniciarJuego = () => {
        setJuegoIniciado(true);
    };

    const handleSeleccionarCamino = (camino) => {
        setCaminoSeleccionado(camino);
        setJuegoTerminado(true);

        setTimeout(() => {
            seccionResultadoRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
    };

    const handleReset = async () => {
        setCaminoSeleccionado(null);
        setJuegoTerminado(false);

        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        const payload = {
            caminoId: caminoSeleccionado?.id,
            gastoTotal: caminoSeleccionado?.totalGasto,
            sobrante: presupuestoInicial - (caminoSeleccionado?.totalGasto || 0),
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
                    <span className="bg-sky-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
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
                            <p className="text-sky-600 font-extrabold text-base md:text-lg">
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

                {/* BANNER DE LA ACTIVIDAD Y PRESUPUESTO */}
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
                            <h2 className="text-blue-900 font-black text-lg md:text-xl uppercase">
                                🧭 {config.actividad?.titulo}
                            </h2>
                            <p className="text-gray-600 font-bold text-xs md:text-sm">
                                {config.actividad?.indicacion}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-amber-300 p-3 rounded-2xl text-center shrink-0 min-w-[180px]">
                        <span className="text-xs font-black text-gray-500 uppercase">Presupuesto Disponible</span>
                        <p className="text-2xl font-black text-amber-600">
                            ${presupuestoInicial}
                        </p>
                    </div>
                </div>

                {/* ELECCIÓN DE CAMINOS */}
                {juegoIniciado && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-black text-blue-900 text-center uppercase">
                            Selecciona una de las 3 opciones:
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {caminos.map((camino) => {
                                const esSeleccionado = caminoSeleccionado?.id === camino.id;
                                return (
                                    <div
                                        key={camino.id}
                                        className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between space-y-4 shadow-md ${
                                            esSeleccionado
                                                ? "bg-sky-50 border-sky-400 ring-4 ring-sky-300 scale-105"
                                                : "bg-amber-50/70 border-amber-200 hover:border-amber-400 hover:scale-102"
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            <h4 className="font-extrabold text-blue-950 text-base md:text-lg border-b border-amber-200 pb-2 text-center">
                                                {camino.nombre}
                                            </h4>

                                            <ul className="space-y-1.5 text-sm font-semibold text-gray-700">
                                                {camino.desglose?.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between items-center bg-white/80 px-3 py-1.5 rounded-xl border border-gray-100">
                                                        <span>{item.concepto}</span>
                                                        <span className="font-black text-blue-900">${item.costo}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="pt-2 border-t border-amber-200 text-center space-y-3">
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-xs font-black text-gray-500 uppercase">Gasto Total:</span>
                                                <span className="text-lg font-black text-red-600">${camino.totalGasto}</span>
                                            </div>

                                            <button
                                                onClick={() => handleSeleccionarCamino(camino)}
                                                className={`w-full py-3 rounded-2xl font-black text-base shadow-md transition-all ${
                                                    esSeleccionado
                                                        ? "bg-sky-500 text-white"
                                                        : "bg-blue-900 hover:bg-blue-950 text-white hover:scale-105 active:scale-95"
                                                }`}
                                            >
                                                {esSeleccionado ? "✓ Elegido" : "Elegir este camino"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Recordatorio General */}
                        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl text-center space-y-2">
                            <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                                💡 Recuerda
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg">
                                "{config.reflexionFinal}"
                            </p>
                        </div>
                    </div>
                )}

                {/* SECCIÓN FINAL (REFLEXIÓN PERSONALIZADA Y TIP) */}
                {juegoTerminado && caminoSeleccionado && (
                    <div ref={seccionResultadoRef} className="space-y-8 animate-fade-in pt-4 border-t-2 border-amber-100">

                        {/* Reflexión del Camino Elegido */}
                        <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-3 shadow-xl">
                            <span className="bg-sky-400 text-blue-950 font-black text-xs md:text-sm px-4 py-1 rounded-full uppercase">
                                Tu Elección: {caminoSeleccionado.nombre}
                            </span>
                            <p className="text-xl md:text-2xl font-black text-sky-950 leading-snug pt-2">
                                "{caminoSeleccionado.reflexion}"
                            </p>
                            <div className="pt-2 text-sm font-black text-gray-600">
                                Te sobraron: <span className="text-amber-600 text-base">${presupuestoInicial - caminoSeleccionado.totalGasto}</span>
                            </div>
                        </div>

                        {/* Tip Financiero */}
                        <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 space-y-3">
                            <span className="bg-blue-900 text-sky-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
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

export default Act04;