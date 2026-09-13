import React, { useState, useEffect, useRef, useMemo } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const pistas = config.actividad.pistas || { horizontales: [], verticales: [] };
    const solucionGrid = config.actividad.solucionGrid || [];

    // Casillas con letras pista/regalo opcionales
    const casillasPista = useMemo(() => [
        { r: 4, c: 0 }, // D en DECISION
        { r: 2, c: 6 }  // A en AHORRO
    ], []);

    const aplicarPistasAGrid = (baseGrid) => {
        if (!solucionGrid.length) return baseGrid;
        return baseGrid.map((row, r) =>
            row.map((val, c) => {
                const esPista = casillasPista.some(p => p.r === r && p.c === c);
                return esPista ? solucionGrid[r][c] : val;
            })
        );
    };

    const [userGrid, setUserGrid] = useState(() => {
        if (solucionGrid.length > 0) {
            const vacio = solucionGrid.map(row => row.map(() => ""));
            return aplicarPistasAGrid(vacio);
        }
        return [];
    });

    const inputsRef = useRef({});

    useEffect(() => {
        if (solucionGrid.length > 0 && userGrid.length === 0) {
            const vacio = solucionGrid.map(row => row.map(() => ""));
            setUserGrid(aplicarPistasAGrid(vacio));
        }
    }, [config.id, solucionGrid, userGrid.length]);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act06-${rango}-${userId}`;

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

                    if (progreso) {
                        if (progreso.completada || progreso.datos_actividad?.completado) {
                            setUserGrid(solucionGrid);
                            localStorage.setItem(storageKey, JSON.stringify({ grid: solucionGrid }));
                            return;
                        }

                        if (progreso.datos_actividad?.grid) {
                            const dbGrid = progreso.datos_actividad.grid;
                            if (
                                dbGrid.length === solucionGrid.length &&
                                dbGrid.every((row, i) => row.length === solucionGrid[i].length)
                            ) {
                                setUserGrid(aplicarPistasAGrid(dbGrid));
                                localStorage.setItem(storageKey, JSON.stringify({ grid: dbGrid }));
                                return;
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Error cargando progreso...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (
                        parsed.grid &&
                        parsed.grid.length === solucionGrid.length &&
                        parsed.grid.every((row, i) => row.length === solucionGrid[i].length)
                    ) {
                        setUserGrid(aplicarPistasAGrid(parsed.grid));
                    } else {
                        const vacio = solucionGrid.map(row => row.map(() => ""));
                        setUserGrid(aplicarPistasAGrid(vacio));
                        localStorage.removeItem(storageKey);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, solucionGrid, userId, storageKey]);

    // Mapeo automático de números de inicio de palabra
    const mapaNumerosCeldas = useMemo(() => {
        const mapa = {};
        if (!solucionGrid.length) return mapa;

        const agregarNumero = (r, c, num) => {
            const key = `${r}-${c}`;
            if (!mapa[key]) mapa[key] = [];
            if (!mapa[key].includes(num)) mapa[key].push(num);
        };

        pistas.horizontales?.forEach((p) => {
            const palabra = p.palabra;
            let encontrada = false;

            for (let r = 0; r < solucionGrid.length; r++) {
                for (let c = 0; c <= solucionGrid[r].length - palabra.length; c++) {
                    const segmento = solucionGrid[r].slice(c, c + palabra.length).join("");
                    if (segmento === palabra) {
                        agregarNumero(r, c, p.numero);
                        encontrada = true;
                        break;
                    }
                }
                if (encontrada) break;
            }
        });

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
                        agregarNumero(r, c, p.numero);
                        encontrada = true;
                        break;
                    }
                }
                if (encontrada) break;
            }
        });

        return mapa;
    }, [solucionGrid, pistas]);

    const handleInputChange = (r, c, val) => {
        const upperVal = val.toUpperCase().slice(-1);
        const nuevoGrid = userGrid.map((row, rowIndex) =>
            row.map((char, colIndex) => (rowIndex === r && colIndex === c ? upperVal : char))
        );
        setUserGrid(nuevoGrid);

        localStorage.setItem(storageKey, JSON.stringify({ grid: nuevoGrid }));

        if (upperVal === solucionGrid[r][c] && upperVal !== "") {
            focusSiguienteCelda(r, c);
        }
    };

    const focusSiguienteCelda = (r, c) => {
        if (solucionGrid.length === 0) return;
        if (c + 1 < solucionGrid[r].length && solucionGrid[r][c + 1] !== "") {
            inputsRef.current[`${r}-${c + 1}`]?.focus();
        } else if (r + 1 < solucionGrid.length && solucionGrid[r + 1][c] !== "") {
            inputsRef.current[`${r + 1}-${c}`]?.focus();
        }
    };

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
        setUserGrid(aplicarPistasAGrid(vacio));
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
                        datos_actividad: { grid: userGrid, completado: true },
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

    const numCols = solucionGrid[0]?.length || 12;

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                .animate-float-slow {
                    animation: float-slow 4.5s ease-in-out infinite;
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-azul shadow-2xl relative overflow-visible" translate="no">

                {/* ENCABEZADO Y REGLA */}
                <div className="bg-amber-50 p-5 md:p-6 rounded-3xl border-2 border-amber-100 text-center space-y-3 relative mb-6">
                    <span className="bg-sky-400 text-yellow-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
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
                            <h1 className="font-extrabold text-yellow-900 text-xl md:text-3xl uppercase tracking-wide">
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

                <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {config.imagenes?.billete && (
                            <img
                                src={config.imagenes.billete}
                                alt="Ilustración"
                                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-bounce-gentle animate-float-slow"
                            />
                        )}
                        <div>
                            <h2 className="text-yellow-900 font-black text-lg md:text-xl uppercase">
                                {config.actividad?.titulo}
                            </h2>
                            <p className="text-gray-600 font-bold text-xs md:text-sm">
                                {config.actividad?.indicacion}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CUADRÍCULA CRUCIGRAMA */}
                <div className="relative w-full flex justify-center py-4 mb-8">
                    {config.imagenes.billete2 && (
                        <div className="absolute left-[70%] bottom-[70%] w-44 animate-float-slow select-none z-10">
                            <img src={`${config.imagenes.billete2}`} alt="Billete saltando cuerda" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    {config.imagenes.alianzito2 && (
                        <div className="absolute left-[5%] bottom-[50px] w-40 animate-float-slow select-none z-10">
                            <img src={`${config.imagenes.alianzito2}`} alt="Alianzito celular" className="w-full h-auto object-contain filter drop-shadow-md" />
                        </div>
                    )}

                    <div
                        className="grid gap-[2px] sm:gap-[3px] p-3 sm:p-5 bg-sky-400 rounded-3xl shadow-2xl border-4 border-sky-500 max-w-xl w-full"
                        style={{
                            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`
                        }}
                    >
                        {solucionGrid.map((row, r) =>
                            row.map((char, c) => {
                                const esCasilleroValido = char !== "";
                                const letraUsuario = userGrid[r]?.[c] || "";
                                const esCorrecto = letraUsuario === char && esCasilleroValido;
                                const esPistaFija = casillasPista.some(p => p.r === r && p.c === c);
                                const numerosPista = mapaNumerosCeldas[`${r}-${c}`] || [];

                                if (!esCasilleroValido) {
                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            className="w-full aspect-square bg-transparent"
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        className="relative w-full aspect-square"
                                    >
                                        {numerosPista.length > 0 && (
                                            <div className="absolute top-[1px] left-[2px] flex flex-col leading-none z-10 pointer-events-none select-none">
                                                {[...numerosPista].reverse().map((num) => (
                                                    <span
                                                        key={num}
                                                        className="text-[7px] xs:text-[9px] sm:text-[11px] font-black text-yellow-800"
                                                    >
                                                        {num}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <input
                                            ref={(el) => (inputsRef.current[`${r}-${c}`] = el)}
                                            type="text"
                                            maxLength={1}
                                            value={letraUsuario}
                                            onChange={(e) => handleInputChange(r, c, e.target.value)}
                                            disabled={esCorrecto || esPistaFija}
                                            className={`
                                                w-full h-full text-center font-black uppercase rounded-md
                                                transition-all border shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-500
                                                text-xs xs:text-sm sm:text-lg border-gray-300
                                                ${esPistaFija
                                                    ? "bg-yellow-600 border-blue-500 text-white font-black cursor-not-allowed scale-95"
                                                    : esCorrecto
                                                        ? "bg-yellow-600 border-blue-500 text-white font-black cursor-not-allowed scale-95"
                                                        : "bg-white text-yellow-900 focus:bg-sky-100"
                                                }
                                            `}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* BLOQUE DE PISTAS HORIZONTALES Y VERTICALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-6">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 shadow-sm">
                        <h3 className="font-extrabold text-yellow-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                            <span>➡️</span> Horizontales
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {pistas.horizontales?.map((item) => (
                                <div key={item.numero} className="text-xs md:text-sm bg-white p-3 rounded-2xl border border-amber-100 shadow-xs">
                                    <span className="font-black text-sky-600 mr-2 text-base">{item.numero}.</span>
                                    <span className="text-gray-700 font-bold">{item.pista}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-5 shadow-sm">
                        <h3 className="font-extrabold text-sky-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                            <span>⬇️</span> Verticales
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {pistas.verticales?.map((item) => (
                                <div key={item.numero} className="text-xs md:text-sm bg-white p-3 rounded-2xl border border-sky-100 shadow-xs">
                                    <span className="font-black text-sky-600 mr-2 text-base">{item.numero}.</span>
                                    <span className="text-gray-700 font-bold">{item.pista}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TIP FINANCIERO AL RELLENAR CORRECTAMENTE */}
                {estaCompletoYCorrecto() && (
                    <div className="space-y-6 mt-8 animate-fade-in pt-4 border-t-2 border-amber-100">
                        <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-2 shadow-xl">
                            <h2 className="text-2xl md:text-3xl font-black text-sky-900 uppercase">
                                ¡Crucigrama Resuelto! 🎉
                            </h2>
                            <p className="text-base md:text-lg font-bold text-sky-950 max-w-xl mx-auto">
                                Excelente análisis. Has identificado los conceptos clave para pausar las compras impulsivas.
                            </p>
                        </div>

                        <div className="bg-amber-20 p-6 rounded-3xl border-2 border-amber-200 space-y-3">
                            <span className="bg-yellow-600 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estaCompletoYCorrecto()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompletoYCorrecto()
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

export default Act06;