import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const imagenUrl = config.imagenCompleta || "/images/10/21.png";
    const FILAS = config.filas || 3;
    const COLUMNAS = config.columnas || 4;
    const TOTAL_PIEZAS = FILAS * COLUMNAS;

    const [piezas, setPiezas] = useState([]);
    const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
    const [mostrarPista, setMostrarPista] = useState(false);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // Mezclar piezas asegurando que no empiece resuelto
    const mezclarPiezas = () => {
        let array = Array.from({ length: TOTAL_PIEZAS }, (_, i) => i);
        do {
            array = [...array].sort(() => Math.random() - 0.5);
        } while (array.every((val, idx) => val === idx));
        return array;
    };

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

                    if (progreso?.datos_actividad?.piezas) {
                        setPiezas(progreso.datos_actividad.piezas);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ piezas: progreso.datos_actividad.piezas })
                        );
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
                    if (parsed.piezas && parsed.piezas.length === TOTAL_PIEZAS) {
                        setPiezas(parsed.piezas);
                        return;
                    }
                } catch (e) {
                    console.error("Error al cargar en LocalStorage", e);
                }
            }

            setPiezas(mezclarPiezas());
        };

        cargarProgreso();
    }, [config.id, userId, TOTAL_PIEZAS]);

    // Intercambio de piezas
    const handlePiezaClick = (indexPosicion) => {
        if (piezaSeleccionada === null) {
            setPiezaSeleccionada(indexPosicion);
        } else {
            const nuevasPiezas = [...piezas];
            const temp = nuevasPiezas[piezaSeleccionada];
            nuevasPiezas[piezaSeleccionada] = nuevasPiezas[indexPosicion];
            nuevasPiezas[indexPosicion] = temp;

            setPiezas(nuevasPiezas);
            setPiezaSeleccionada(null);

            localStorage.setItem(storageKey, JSON.stringify({ piezas: nuevasPiezas }));
        }
    };

    const estaCompleto = piezas.length > 0 && piezas.every((val, idx) => val === idx);

    const handleReset = () => {
        const nuevas = mezclarPiezas();
        setPiezas(nuevas);
        setPiezaSeleccionada(null);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!estaCompleto) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { piezas, completado: true },
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
            {/* Navegación */}
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-6" translate="no">

                {/* Título e Instrucciones */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "RETO: EL ROMPECABEZAS DE LA DEMOCRACIA"}
                    </h1>
                    <p className="text-gray-700 font-semibold text-base md:text-lg max-w-2xl mx-auto">
                        {config.instruccion || "Pide ayuda a un adulto para armar el rompecabezas. Haz clic en dos piezas para intercambiar su lugar."}
                    </p>
                </div>

                {/* Tablero del Rompecabezas (4 columnas x 3 filas) */}
                <div className="flex justify-center my-4">
                    <div
                        className="grid gap-1.5 p-3 bg-blue-900 rounded-3xl border-4 border-amber-400 shadow-xl max-w-xl w-full aspect-[4/3]"
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${COLUMNAS}, 1fr)`,
                            gridTemplateRows: `repeat(${FILAS}, 1fr)`,
                        }}
                    >
                        {piezas.map((idPiezaOriginal, indexActual) => {
                            const filaOriginal = Math.floor(idPiezaOriginal / COLUMNAS);
                            const colOriginal = idPiezaOriginal % COLUMNAS;

                            // Cálculo exacto del offset background % para 4x3
                            const posX = (colOriginal / (COLUMNAS - 1)) * 100;
                            const posY = (filaOriginal / (FILAS - 1)) * 100;

                            const esSeleccionada = piezaSeleccionada === indexActual;

                            return (
                                <button
                                    key={indexActual}
                                    onClick={() => handlePiezaClick(indexActual)}
                                    className={`relative w-full h-full rounded-lg md:rounded-xl overflow-hidden transition-all duration-200 focus:outline-none ${
                                        esSeleccionada
                                            ? "ring-4 ring-amber-400 scale-95 z-10 shadow-2xl"
                                            : "hover:opacity-90 hover:scale-[1.02]"
                                    }`}
                                    style={{
                                        backgroundImage: `url(${imagenUrl})`,
                                        backgroundSize: `${COLUMNAS * 100}% ${FILAS * 100}%`,
                                        backgroundPosition: `${posX}% ${posY}%`,
                                    }}
                                >
                                    <span className="absolute top-1 left-1 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                        {indexActual + 1}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estaCompleto}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompleto
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

export default Act11;