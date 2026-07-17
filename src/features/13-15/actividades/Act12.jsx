import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const pistas = config.pistas || { horizontales: [], verticales: [] };
    const imagenes = config.imagenes || [];
    const solucionGrid = config.solucionGrid || [];

    // Inicializar el estado de la cuadrícula del usuario vacía
    const [userGrid, setUserGrid] = useState(() => {
        if (solucionGrid.length > 0) {
            return solucionGrid.map(row => row.map(() => ""));
        }
        return [];
    });

    const inputsRef = useRef({});

    // Si el JSON tarda en cargar o se actualiza, volvemos a generar la estructura vacía
    useEffect(() => {
        if (solucionGrid.length > 0 && userGrid.length === 0) {
            setUserGrid(solucionGrid.map(row => row.map(() => "")));
        }
    }, [config.id, solucionGrid]);

    // --- Persistencia de Datos ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (
                    parsed.grid &&
                    parsed.grid.length === solucionGrid.length &&
                    parsed.grid.every((row, i) => row.length === solucionGrid[i].length)
                ) {
                    setUserGrid(parsed.grid);
                } else {
                    setUserGrid(solucionGrid.map(row => row.map(() => "")));
                    localStorage.removeItem(storageKey);
                }
            } catch (e) {
                console.error("Error al cargar progreso local", e);
            }
        }
    }, [config.id]);

    // ==========================================
    // CÁLCULO DINÁMICO DE NÚMEROS DE LAS PISTAS
    // ==========================================
    const mapaNumerosCeldas = {};

    if (solucionGrid.length > 0) {
        // 1. Identificar el inicio de las palabras horizontales
        pistas.horizontales?.forEach((p) => {
            const palabra = p.palabra;
            let encontrada = false;

            for (let r = 0; r < solucionGrid.length; r++) {
                for (let c = 0; c <= solucionGrid[r].length - palabra.length; c++) {
                    const segmento = solucionGrid[r].slice(c, c + palabra.length).join("");
                    if (segmento === palabra) {
                        mapaNumerosCeldas[`${r}-${c}`] = p.numero;
                        encontrada = true;
                        break;
                    }
                }
                if (encontrada) break;
            }
        });

        // 2. Identificar el inicio de las palabras verticales
        pistas.verticales?.forEach((p) => {
            const palabra = p.palabra;
            let encontrada = false;

            for (let c = 0; c < solucionGrid[0].length; c++) {
                for (let r = 0; r <= solucionGrid.length - palabra.length; r++) {
                    let segmento = "";
                    for (let k = 0; k < palabra.length; k++) {
                        segmento += solucionGrid[r + k][c];
                    }
                    if (segmento === palabra) {
                        mapaNumerosCeldas[`${r}-${c}`] = p.numero;
                        encontrada = true;
                        break;
                    }
                }
                if (encontrada) break;
            }
        });
    }

    const handleInputChange = (r, c, val) => {
        const upperVal = val.toUpperCase().slice(-1); // Tomar solo un carácter y en mayúsculas
        const nuevoGrid = userGrid.map((row, rowIndex) => 
            row.map((char, colIndex) => (rowIndex === r && colIndex === c ? upperVal : char))
        );
        setUserGrid(nuevoGrid);

        // Guardar progreso de forma local
        localStorage.setItem(storageKey, JSON.stringify({ grid: nuevoGrid }));

        // Si la letra es correcta, saltar al siguiente casillero de la palabra
        if (upperVal === solucionGrid[r][c] && upperVal !== "") {
            focusSiguienteCelda(r, c);
        }
    };

    // Mover el foco automáticamente al escribir
    const focusSiguienteCelda = (r, c) => {
        if (solucionGrid.length === 0) return;
        
        // 1. Intentar moverse a la derecha
        if (c + 1 < solucionGrid[r].length && solucionGrid[r][c + 1] !== "") {
            inputsRef.current[`${r}-${c + 1}`]?.focus();
        } 
        // 2. Si no hay celdas a la derecha, intentar moverse hacia abajo
        else if (r + 1 < solucionGrid.length && solucionGrid[r + 1][c] !== "") {
            inputsRef.current[`${r + 1}-${c}`]?.focus();
        }
    };

    // Validar que todo el crucigrama esté completado con las letras correctas
    const estaCompletoYCorrecto = () => {
        if (solucionGrid.length === 0 || userGrid.length === 0) return false;
        
        for (let r = 0; r < solucionGrid.length; r++) {
            for (let c = 0; c < solucionGrid[r].length; c++) {
                if (solucionGrid[r][c] !== "" && userGrid[r][c] !== solucionGrid[r][c]) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleReset = () => {
        if (solucionGrid.length === 0) return;
        const vacio = solucionGrid.map(row => row.map(() => ""));
        setUserGrid(vacio);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!estaCompletoYCorrecto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { completado: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, progreso guardado localmente", err);
            }
        }
        onComplete();
    };

    if (solucionGrid.length === 0 || userGrid.length === 0) {
        return (
            <LayoutActividad fondo={config.fondo}>
                <div className="text-center py-12">
                    <p className="text-gray-500 font-bold text-xl">Cargando crucigrama...</p>
                </div>
            </LayoutActividad>
        );
    }
    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Animación flotante para las ilustraciones decorativas */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                .animate-float-slow {
                    animation: float-slow 4.5s ease-in-out infinite;
                }
            `}</style>

            {/* Barra superior de navegación */}
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

            {/* Panel Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative overflow-visible" translate="no">
                
                {/* Títulos */}
                <div className="text-center mb-6">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-3xl md:text-4xl">
                        {config.titulo || "Alianzito eres muy inteligente"}
                    </h1>
                    <p className="text-gray-600 font-semibold mt-1">
                        {config.subtitulo || "Resuelve el crucigrama sobre las redes sociales"}
                    </p>
                </div>

                {/* ========================================== */}
                {/* SECCIÓN SUPERIOR: EL CRUCIGRAMA CENTRADO   */}
                {/* ========================================== */}
                <div className="relative w-full flex justify-center py-6 mb-28">
                    {imagenes[3] && (
                        <div className="hidden xl:block absolute right-[-2%] top-[-5px] w-48 animate-float-slow select-none z-10">
                            <img src={`${imagenes[0]}`} alt="Billete con laptop" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    {/* Ilustración 2: Billete saltando la cuerda (27.png) -> Abajo a la izquierda */}
                    {imagenes[0] && (
                        <div className="hidden xl:block absolute left-[-1%] bottom-[-120px] w-44 animate-float-slow select-none z-10">
                            <img src={`${imagenes[1]}`} alt="Billete saltando cuerda" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    {/* Ilustración 3: Alianzito celular (26.png) -> Abajo en el centro */}
                    {imagenes[1] && (
                        <div className="hidden xl:block absolute left-[38%] bottom-[-140px] w-40 animate-float-slow select-none z-10">
                            <img src={`${imagenes[2]}`} alt="Alianzito celular" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    {/* Ilustración 4: Billete portafolios (18.png) -> Abajo a la derecha */}
                    {imagenes[2] && (
                        <div className="hidden xl:block absolute right-[1%] bottom-[-80px] w-40 animate-float-slow select-none z-10">
                            <img src={`${imagenes[3]}`} alt="Billete portafolios" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    {/* El Tablero del Crucigrama */}
                    <div 
                        className="grid gap-[3px] p-5 bg-yellow-400 rounded-3xl shadow-2xl border-4 border-yellow-500 overflow-x-auto max-w-full relative z-0"
                        style={{ 
                            minWidth: "460px", 
                            maxWidth: "850px",
                            gridTemplateColumns: "repeat(22, minmax(0, 1fr))"
                        }}
                    >
                        {solucionGrid.map((row, r) =>
                            row.map((char, c) => {
                                const esCasilleroValido = char !== "";
                                const letraUsuario = userGrid[r]?.[c] || "";
                                const esCorrecto = letraUsuario === char && esCasilleroValido;
                                const numeroPista = mapaNumerosCeldas[`${r}-${c}`];

                                if (!esCasilleroValido) {
                                    return <div key={`${r}-${c}`} className="w-6 h-6 sm:w-8 sm:h-8 bg-transparent" />;
                                }

                                return (
                                    <div key={`${r}-${c}`} className="relative w-6 h-6 sm:w-8 sm:h-8">
                                        {numeroPista && (
                                            <span className="absolute top-[1px] left-[2px] text-[7px] sm:text-[9px] font-black text-blue-700 z-10 pointer-events-none select-none leading-none">
                                                {numeroPista}
                                            </span>
                                        )}
                                        <input
                                            ref={(el) => (inputsRef.current[`${r}-${c}`] = el)}
                                            type="text"
                                            maxLength={1}
                                            value={letraUsuario}
                                            onChange={(e) => handleInputChange(r, c, e.target.value)}
                                            disabled={esCorrecto}
                                            className={`
                                                w-full h-full text-center font-black uppercase text-xs sm:text-base rounded-md
                                                transition-all border-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500
                                                ${esCorrecto 
                                                    ? "bg-emerald-500 border-emerald-600 text-white font-black cursor-not-allowed scale-95" 
                                                    : "bg-white border-gray-300 text-blue-900 focus:bg-amber-100"
                                                }
                                            `}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex xl:hidden gap-6 justify-center items-center flex-wrap mb-8">
                    {imagenes.map((imgName, idx) => (
                        <img 
                            key={idx}
                            src={`${imgName}`} 
                            alt="Ilustración móvil" 
                            className="w-20 sm:w-24 h-auto object-contain animate-float-slow select-none filter drop-shadow-md" 
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mt-6">
                    
                    {/* Pistas Horizontales */}
                    <div className="bg-sky-50 border-2 border-sky-100 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-extrabold text-blue-900 text-xl mb-4 flex items-center gap-2">
                            <span>➡️</span> Horizontales
                        </h3>
                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                            {pistas.horizontales?.map((item) => (
                                <div key={item.numero} className="text-sm md:text-base bg-white/60 p-3 rounded-xl border border-sky-100">
                                    <span className="font-black text-amber-600 mr-2 text-base">{item.numero}.</span>
                                    <span className="text-gray-700 font-semibold">{item.pista}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pistas Verticales */}
                    <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-extrabold text-amber-800 text-xl mb-4 flex items-center gap-2">
                            <span>⬇️</span> Verticales
                        </h3>
                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                            {pistas.verticales?.map((item) => (
                                <div key={item.numero} className="text-sm md:text-base bg-white/60 p-3 rounded-xl border border-orange-100">
                                    <span className="font-black text-amber-600 mr-2 text-base">{item.numero}.</span>
                                    <span className="text-gray-700 font-semibold">{item.pista}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

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
                        disabled={!estaCompletoYCorrecto()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompletoYCorrecto()
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Listo!! 🎉
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act12;