import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const grid = config.grid || [];
    const palabras = config.palabras || [];

    // Estados de interacción de la sopa de letras
    const [celdasSeleccionadas, setCeldasSeleccionadas] = useState([]); // Array de strings "fila-col"
    const [estaArrastrando, setEstaArrastrando] = useState(false);
    const [palabrasEncontradas, setPalabrasEncontradas] = useState([]); // Nombres de palabras encontradas
    const [celdasCorrectas, setCeldasCorrectas] = useState(new Set()); // IDs de celdas resueltas (en verde)

    // --- SISTEMA DE PERSISTENCIA ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (parsed.palabrasEncontradas) {
                    setPalabrasEncontradas(parsed.palabrasEncontradas);
                    // Reconstruir el Set de celdas correctas basadas en las palabras cargadas
                    const nuevasCeldas = new Set();
                    parsed.palabrasEncontradas.forEach(palNombre => {
                        const palObj = palabras.find(p => p.texto === palNombre);
                        if (palObj) {
                            obtenerCaminoEntrePuntos(palObj.inicio, palObj.fin).forEach(cellId => {
                                nuevasCeldas.add(cellId);
                            });
                        }
                    });
                    setCeldasCorrectas(nuevasCeldas);
                }
            } catch (e) {
                console.error("Error cargando progreso local de Sopa de Letras", e);
            }
        }
    }, [config.id]);

    // Función auxiliar para obtener todas las celdas intermedias entre dos coordenadas [f, c]
    const obtenerCaminoEntrePuntos = (inicio, fin) => {
        const celdas = [];
        const [f1, c1] = inicio;
        const [f2, c2] = fin;
        
        const diffF = f2 - f1;
        const diffC = c2 - c1;
        const pasos = Math.max(Math.abs(diffF), Math.abs(diffC));

        if (pasos === 0) return [`${f1}-${c1}`];

        const pasoF = diffF / pasos;
        const pasoC = diffC / pasos;

        for (let i = 0; i <= pasos; i++) {
            const f = Math.round(f1 + pasoF * i);
            const c = Math.round(c1 + pasoC * i);
            celdas.push(`${f}-${c}`);
        }
        return celdas;
    };

    // Al pulsar el mouse en una celda
    const handleMouseDown = (fila, col) => {
        setEstaArrastrando(true);
        setCeldasSeleccionadas([`${fila}-${col}`]);
    };

    // Al arrastrar el mouse sobre otras celdas
    const handleMouseEnter = (fila, col) => {
        if (!estaArrastrando) return;
        const nuevaCelda = `${fila}-${col}`;
        
        // Evitar duplicados consecutivos en el trazo de arrastre
        if (!celdasSeleccionadas.includes(nuevaCelda)) {
            setCeldasSeleccionadas((prev) => [...prev, nuevaCelda]);
        }
    };

    // Al soltar el mouse, validamos si el camino trazado coincide con alguna palabra del JSON
    const handleMouseUp = () => {
        if (!estaArrastrando) return;
        setEstaArrastrando(false);

        if (celdasSeleccionadas.length === 0) return;

        const primerID = celdasSeleccionadas[0];
        const ultimoID = celdasSeleccionadas[celdasSeleccionadas.length - 1];

        const [fI, cI] = primerID.split("-").map(Number);
        const [fF, cF] = ultimoID.split("-").map(Number);

        // Buscamos si hay alguna palabra en el JSON que coincida en esas coordenadas (al derecho o al revés)
        const palabraEncontrada = palabras.find((pal) => {
            const coincideNormal = (pal.inicio[0] === fI && pal.inicio[1] === cI && pal.fin[0] === fF && pal.fin[1] === cF);
            const coincideInverso = (pal.inicio[0] === fF && pal.inicio[1] === cF && pal.fin[0] === fI && pal.fin[1] === cI);
            return coincideNormal || coincideInverso;
        });

        if (palabraEncontrada && !palabrasEncontradas.includes(palabraEncontrada.texto)) {
            // Pintamos la palabra correcta trazando todo el camino en verde
            const caminoCompleto = obtenerCaminoEntrePuntos(palabraEncontrada.inicio, palabraEncontrada.fin);
            
            const nuevasCorrectas = new Set(celdasCorrectas);
            caminoCompleto.forEach(cellId => nuevasCorrectas.add(cellId));
            
            const nuevaListaPalabras = [...palabrasEncontradas, palabraEncontrada.texto];

            setCeldasCorrectas(nuevasCorrectas);
            setPalabrasEncontradas(nuevaListaPalabras);

            // Guardar progreso intermedio en local storage
            localStorage.setItem(storageKey, JSON.stringify({ palabrasEncontradas: nuevaListaPalabras }));
        }

        setCeldasSeleccionadas([]);
    };

    // Reiniciar actividad
    const handleReset = () => {
        setCeldasSeleccionadas([]);
        setPalabrasEncontradas([]);
        setCeldasCorrectas(new Set());
        localStorage.removeItem(storageKey);
    };

    // Al presionar continuar, sincronizamos progreso final en Supabase
    const handleContinue = async () => {
        if (palabrasEncontradas.length < palabras.length) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { palabrasEncontradas },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, progreso de sopa de letras guardado localmente", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta de Contenido Principal */}
            <div 
                className="bg-white p-4 md:p-6 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" 
                translate="no"
                onMouseUp={handleMouseUp} // Captura por si sueltan el mouse fuera de la cuadrícula
            >
                <h1
                    className="text-center font-extrabold text-blue-900 mb-6 px-4"
                    style={{ fontSize: "clamp(1.3rem, 2.5vw, 2.1rem)" }}
                >
                    {config.titulo || "Alianzito completa la sopa de letras"}
                </h1>

                {/* Grid Sopa de Letras */}
                <div className="flex justify-center mb-6 overflow-x-auto py-2">
                    <div 
                        className="grid grid-cols-20 gap-[2px] p-2 bg-blue-900 rounded-2xl shadow-lg border-4 border-blue-950 select-none max-w-full"
                        style={{ minWidth: "580px" }}
                    >
                        {grid.map((fila, iFila) =>
                            fila.map((letra, iCol) => {
                                const idCelda = `${iFila}-${iCol}`;
                                const esCorrecta = celdasCorrectas.has(idCelda);
                                const esSeleccionada = celdasSeleccionadas.includes(idCelda);

                                return (
                                    <div
                                        key={idCelda}
                                        onMouseDown={() => handleMouseDown(iFila, iCol)}
                                        onMouseEnter={() => handleMouseEnter(iFila, iCol)}
                                        className={`
                                            aspect-square w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] 
                                            flex items-center justify-center font-black rounded-md text-xs sm:text-sm 
                                            transition-all duration-150 cursor-pointer select-none
                                            ${esCorrecta 
                                                ? "bg-emerald-500 text-white shadow-inner scale-95" 
                                                : esSeleccionada 
                                                    ? "bg-sky-500 text-white animate-pulse" 
                                                    : "bg-white text-blue-900 hover:bg-yellow-100"
                                            }
                                        `}
                                    >
                                        {letra}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Panel de Palabras a buscar */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 md:p-6 max-w-4xl mx-auto mb-8">
                    <h3 className="text-center text-lg font-black text-amber-700 mb-4 uppercase tracking-wide">
                        Palabras por encontrar ({palabrasEncontradas.length}/{palabras.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {palabras.map((pal) => {
                            const encontrada = palabrasEncontradas.includes(pal.texto);
                            return (
                                <div
                                    key={pal.texto}
                                    className={`
                                        text-center py-2 px-3 rounded-full font-black text-sm tracking-wider shadow-sm transition-all
                                        ${encontrada 
                                            ? "bg-emerald-100 text-emerald-700 line-through opacity-60" 
                                            : "bg-white text-blue-900 border border-gray-200"
                                        }
                                    `}
                                >
                                    {encontrada ? "✓ " : ""} {pal.texto}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Fila de Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={palabrasEncontradas.length < palabras.length}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            palabrasEncontradas.length < palabras.length
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