import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const grid = config.grid || [];
    const palabras = config.palabras || [];

    // Referencia al contenedor de la sopa de letras para poder calcular las colisiones táctiles
    const gridRef = useRef(null);

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

    // Cargar progreso guardado al iniciar (Híbrido: Supabase + LocalStorage)[cite: 2]
    useEffect(() => {
        const cargarProgreso = async () => {
            // 1. Intentar cargar desde la base de datos de Supabase si el usuario está logueado[cite: 2]
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso, error } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad?.palabrasEncontradas) {
                        const pals = progreso.datos_actividad.palabrasEncontradas;
                        procesarProgresoCargado(pals);
                        // Respaldamos localmente también
                        localStorage.setItem(storageKey, JSON.stringify({ palabrasEncontradas: pals }));
                        return; // Termina con éxito trayendo el progreso de la nube
                    }
                } catch (err) {
                    console.warn("Error consultando Supabase, recurriendo a localStorage...", err);
                }
            }

            // 2. Si es anónimo o falló la red, recurrir al almacenamiento local del dispositivo[cite: 2]
            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.palabrasEncontradas) {
                        procesarProgresoCargado(parsed.palabrasEncontradas);
                    }
                } catch (e) {
                    console.error("Error cargando progreso local de Sopa de Letras", e);
                }
            }
        };

        // Función interna para procesar y renderizar las palabras en pantalla
        const procesarProgresoCargado = (listaPalabras) => {
            setPalabrasEncontradas(listaPalabras);
            const nuevasCeldas = new Set();
            listaPalabras.forEach(palNombre => {
                const palObj = palabras.find(p => p.texto === palNombre);
                if (palObj) {
                    obtenerCaminoEntrePuntos(palObj.inicio, palObj.fin).forEach(cellId => {
                        nuevasCeldas.add(cellId);
                    });
                }
            });
            setCeldasCorrectas(nuevasCeldas);
        };

        cargarProgreso();
    }, [config.id, userId]);

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

    // --- CONTROLADORES DE INTERACCIÓN ---

    const iniciarSeleccion = (fila, col) => {
        setEstaArrastrando(true);
        setCeldasSeleccionadas([`${fila}-${col}`]);
    };

    const actualizarSeleccion = (fila, col) => {
        const nuevaCelda = `${fila}-${col}`;
        if (!celdasSeleccionadas.includes(nuevaCelda)) {
            setCeldasSeleccionadas((prev) => [...prev, nuevaCelda]);
        }
    };

    const finalizarSeleccion = () => {
        if (!estaArrastrando) return;
        setEstaArrastrando(false);

        if (celdasSeleccionadas.length === 0) return;

        const primerID = celdasSeleccionadas[0];
        const ultimoID = celdasSeleccionadas[celdasSeleccionadas.length - 1];

        const [fI, cI] = primerID.split("-").map(Number);
        const [fF, cF] = ultimoID.split("-").map(Number);

        const palabraEncontrada = palabras.find((pal) => {
            const coincideNormal = (pal.inicio[0] === fI && pal.inicio[1] === cI && pal.fin[0] === fF && pal.fin[1] === cF);
            const coincideInverso = (pal.inicio[0] === fF && pal.inicio[1] === cF && pal.fin[0] === fI && pal.fin[1] === cI);
            return coincideNormal || coincideInverso;
        });

        if (palabraEncontrada && !palabrasEncontradas.includes(palabraEncontrada.texto)) {
            const caminoCompleto = obtenerCaminoEntrePuntos(palabraEncontrada.inicio, palabraEncontrada.fin);
            
            const nuevasCorrectas = new Set(celdasCorrectas);
            caminoCompleto.forEach(cellId => nuevasCorrectas.add(cellId));
            
            const nuevaListaPalabras = [...palabrasEncontradas, palabraEncontrada.texto];

            setCeldasCorrectas(nuevasCorrectas);
            setPalabrasEncontradas(nuevaListaPalabras);

            localStorage.setItem(storageKey, JSON.stringify({ palabrasEncontradas: nuevaListaPalabras }));
        }

        setCeldasSeleccionadas([]);
    };

    // --- CAPTURA DE ARRASTRE EN PANTALLAS TÁCTILES ---

    const handleTouchStart = (e, fila, col) => {
        e.preventDefault(); // Previene scrolls involuntarios mientras juegas
        iniciarSeleccion(fila, col);
    };

    const handleTouchMove = (e) => {
        if (!estaArrastrando || !gridRef.current) return;
        e.preventDefault(); // Previene el scroll del navegador móvil

        const touch = e.touches[0];
        const elementoBajoElDedo = document.elementFromPoint(touch.clientX, touch.clientY);

        if (elementoBajoElDedo) {
            const cellId = elementoBajoElDedo.getAttribute("data-cell-id");
            if (cellId) {
                const [f, c] = cellId.split("-").map(Number);
                actualizarSeleccion(f, c);
            }
        }
    };

    // Reiniciar actividad
    const handleReset = () => {
        setCeldasSeleccionadas([]);
        setPalabrasEncontradas([]);
        setCeldasCorrectas(new Set());
        localStorage.removeItem(storageKey);
    };

    // Al presionar continuar, sincronizamos progreso final en Supabase[cite: 2]
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
                onMouseUp={finalizarSeleccion}
                onTouchEnd={finalizarSeleccion}
            >
                <h1
                    className="text-center font-extrabold text-blue-900 mb-6 px-4"
                    style={{ fontSize: "clamp(1.2rem, 2.5vw, 2.1rem)" }}
                >
                    {config.titulo || "Alianzito completa la sopa de letras"}
                </h1>

                {/* Grid Sopa de Letras */}
                <div className="flex justify-center mb-6 py-2">
                    <div 
                        ref={gridRef}
                        onTouchMove={handleTouchMove} 
                        className="grid grid-cols-20 gap-[1px] xs:gap-[2px] p-2 bg-blue-900 rounded-2xl shadow-lg border-4 border-blue-950 select-none max-w-full touch-none"
                    >
                        {grid.map((fila, iFila) =>
                            fila.map((letra, iCol) => {
                                const idCelda = `${iFila}-${iCol}`;
                                const esCorrecta = celdasCorrectas.has(idCelda);
                                const esSeleccionada = celdasSeleccionadas.includes(idCelda);

                                return (
                                    <div
                                        key={idCelda}
                                        data-cell-id={idCelda} 
                                        onMouseDown={() => iniciarSeleccion(iFila, iCol)}
                                        onMouseEnter={() => estaArrastrando && actualizarSeleccion(iFila, iCol)}
                                        onTouchStart={(e) => handleTouchStart(e, iFila, iCol)}
                                        className={`
                                            w-[14px] h-[14px]
                                            xxs:w-[16px] xxs:h-[16px]
                                            xs:w-[22px] xs:h-[22px] 
                                            sm:w-[32px] sm:h-[32px] 
                                            flex items-center justify-center font-black rounded-sm sm:rounded-md 
                                            text-[8px] xxs:text-[9px] xs:text-xs sm:text-sm 
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