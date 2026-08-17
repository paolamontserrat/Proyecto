import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const posicionesBase = config.posicionesPosibles || [];
    const totalObjetivo = config.totalMonedas || 6;

    const [monedasActivas, setMonedasActivas] = useState([]);
    const [monedasEncontradas, setMonedasEncontradas] = useState([]);
    const [completado, setCompletado] = useState(false);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act2-${rango}-${userId}`;

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            let idsCargados = [];
            let estaCompletada = false;

            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) {
                        estaCompletada = progreso.completada || false;
                        if (progreso.datos_actividad?.monedasEncontradas) {
                            idsCargados = progreso.datos_actividad.monedasEncontradas;
                        }
                    }
                } catch (err) {
                    console.warn("Error consultando progreso en Supabase, intentando local...", err);
                }
            }

            if (idsCargados.length === 0 && !estaCompletada) {
                const guardado = localStorage.getItem(storageKey);
                if (guardado) {
                    try {
                        const parsed = JSON.parse(guardado);
                        if (parsed.monedasEncontradas) {
                            idsCargados = parsed.monedasEncontradas;
                            estaCompletada = parsed.completado || false;
                        }
                    } catch (e) {
                        console.error("Error al leer LocalStorage", e);
                    }
                }
            }

            setMonedasEncontradas(idsCargados);
            if (estaCompletada || idsCargados.length >= totalObjetivo) {
                setCompletado(true);
            }

            prepararTablero(idsCargados);
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Fijar/mezclar posiciones respetando las encontradas
    const prepararTablero = (idsEncontrados = []) => {
        const encontradasObj = posicionesBase.filter((p) => idsEncontrados.includes(p.id));
        const noEncontradasObj = posicionesBase.filter((p) => !idsEncontrados.includes(p.id));

        const faltantesRandom = [...noEncontradasObj].sort(() => 0.5 - Math.random());
        const limiteFaltantes = Math.max(0, totalObjetivo - encontradasObj.length);
        
        const seleccionFinal = [...encontradasObj, ...faltantesRandom.slice(0, limiteFaltantes)];
        setMonedasActivas(seleccionFinal);
    };

    // Guardar avance por cada click
    const handleCoinClick = async (id) => {
        if (monedasEncontradas.includes(id)) return;

        const nuevasMonedas = [...monedasEncontradas, id];
        const esJuegoCompleto = nuevasMonedas.length >= totalObjetivo;

        setMonedasEncontradas(nuevasMonedas);
        if (esJuegoCompleto) {
            setCompletado(true);
        }

        const payload = {
            completado: esJuegoCompleto,
            monedasEncontradas: nuevasMonedas,
            fechaActualizacion: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: esJuegoCompleto
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error actualizando progreso en tiempo real", err);
            }
        }
    };

    // Reiniciar progreso
    const handleReset = async () => {
        setMonedasEncontradas([]);
        setCompletado(false);

        // Borrar en LocalStorage
        localStorage.removeItem(storageKey);

        // Borrar/actualizar en Supabase
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { completado: false, monedasEncontradas: [] },
                        completada: false
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error borrando progreso en Supabase", err);
            }
        }

        // Volver a generar posiciones iniciales aleatorias
        prepararTablero([]);
    };

    const handleContinue = () => {
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/dashboard/${rango}`)}
                        className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                    >
                        🏠 Inicio
                    </button>
                </div>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-6 box-border"
                translate="no"
            >
                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide">
                        {config.titulo}
                    </h1>
                    <p className="text-blue-800 font-bold text-sm sm:text-base max-w-xl mx-auto">
                        {config.instrucciones}
                    </p>
                    
                    <div className="inline-block bg-amber-400 text-blue-950 font-black px-6 py-2 rounded-full text-base sm:text-xl shadow mt-2">
                        Monedas encontradas: {monedasEncontradas.length} / {totalObjetivo}
                    </div>
                </div>

                {/* Tablero de Juego */}
                <div className="relative w-full rounded-2xl overflow-hidden border-4 border-sky-300 shadow-inner touch-manipulation select-none">
                    <img
                        src={config.imgActividad}
                        alt={config.titulo}
                        className="w-full h-auto block object-cover"
                    />

                    {/* Monedas pequeñas y estáticas */}
                    {monedasActivas.map((moneda) => {
                        const encontrada = monedasEncontradas.includes(moneda.id);
                        return (
                            <button
                                key={moneda.id}
                                onClick={() => handleCoinClick(moneda.id)}
                                style={{
                                    top: moneda.top,
                                    left: moneda.left,
                                    width: "4.5%",
                                    transform: "translate(-50%, -50%)"
                                }}
                                className={`absolute rounded-full p-0 transition-opacity ${
                                    encontrada
                                        ? "opacity-30 grayscale border-2 border-emerald-500 cursor-default"
                                        : "opacity-100 cursor-pointer active:opacity-70"
                                }`}
                                aria-label={moneda.alt}
                            >
                                <img
                                    src={config.imgMoneda}
                                    alt="Moneda"
                                    className="w-full h-auto object-contain rounded-full shadow"
                                />
                            </button>
                        );
                    })}
                </div>

                {/* Banner de Éxito */}
                {completado && (
                    <div className="bg-emerald-100 border-2 border-emerald-400 p-4 rounded-2xl text-center space-y-3">
                        <p className="text-emerald-900 font-extrabold text-base sm:text-xl">
                            {config.mensajeExito || "¡Felicidades! Encontraste todas las monedas de tu ahorro."}
                        </p>
                    </div>
                )}

                {/* Fila de Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-10">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={completado ? false : true}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !completado
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