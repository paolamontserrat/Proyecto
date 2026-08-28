import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const ABECEDARIO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const palabras = config.palabras || [];
    const maxErrores = config.maxErrores || 5;

    const [palabraIndex, setPalabraIndex] = useState(0);
    const [letrasUsadas, setLetrasUsadas] = useState([]);
    const [errores, setErrores] = useState(0);
    const [palabrasResueltas, setPalabrasResueltas] = useState([]);

    const palabraActual = palabras[palabraIndex] || { respuesta: "", pista: "" };
    const respuestaLimpia = palabraActual.respuesta.toUpperCase();

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // Cargar progreso guardado
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
                        const d = progreso.datos_actividad;
                        if (d.palabrasResueltas) setPalabrasResueltas(d.palabrasResueltas);
                        if (d.palabraIndex !== undefined) setPalabraIndex(d.palabraIndex);
                        if (d.letrasUsadas) setLetrasUsadas(d.letrasUsadas);
                        if (d.errores !== undefined) setErrores(d.errores);
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.palabrasResueltas) setPalabrasResueltas(parsed.palabrasResueltas);
                    if (parsed.palabraIndex !== undefined) setPalabraIndex(parsed.palabraIndex);
                    if (parsed.letrasUsadas) setLetrasUsadas(parsed.letrasUsadas);
                    if (parsed.errores !== undefined) setErrores(parsed.errores);
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const guardarAvance = async (nuevasResueltas, nuevoIndex, nuevasLetras, nuevosErrores) => {
        const datos = {
            palabrasResueltas: nuevasResueltas,
            palabraIndex: nuevoIndex,
            letrasUsadas: nuevasLetras,
            errores: nuevosErrores,
        };
        localStorage.setItem(storageKey, JSON.stringify(datos));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { ...datos, completado: nuevasResueltas.length === palabras.length },
                        completada: nuevasResueltas.length === palabras.length,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando avance en Supabase", err);
            }
        }
    };

    // Validar si la palabra actual ya se completó
    const esPalabraCompletada = () => {
        if (!respuestaLimpia) return false;
        return respuestaLimpia
            .split("")
            .filter((char) => char !== " ")
            .every((char) => letrasUsadas.includes(char));
    };

    // Manejo de clic en letra
    const handleSeleccionarLetra = (letra) => {
        if (letrasUsadas.includes(letra) || errores >= maxErrores || esPalabraCompletada()) return;

        const nuevasLetras = [...letrasUsadas, letra];
        let nuevosErrores = errores;

        if (!respuestaLimpia.includes(letra)) {
            nuevosErrores = errores + 1;
            setErrores(nuevosErrores);
        }

        setLetrasUsadas(nuevasLetras);

        // Verificar si completó esta palabra
        const completada = respuestaLimpia
            .split("")
            .filter((char) => char !== " ")
            .every((char) => nuevasLetras.includes(char));

        let nuevasResueltas = palabrasResueltas;
        if (completada && !palabrasResueltas.includes(palabraActual.id)) {
            nuevasResueltas = [...palabrasResueltas, palabraActual.id];
            setPalabrasResueltas(nuevasResueltas);
        }

        guardarAvance(nuevasResueltas, palabraIndex, nuevasLetras, nuevosErrores);
    };

    // Siguiente palabra
    const handleSiguientePalabra = () => {
        if (palabraIndex < palabras.length - 1) {
            const nuevoIndex = palabraIndex + 1;
            setPalabraIndex(nuevoIndex);
            setLetrasUsadas([]);
            setErrores(0);
            guardarAvance(palabrasResueltas, nuevoIndex, [], 0);
        }
    };

    // Reintentar palabra actual (si se rompió la alcancía)
    const handleReintentarPalabra = () => {
        setLetrasUsadas([]);
        setErrores(0);
        guardarAvance(palabrasResueltas, palabraIndex, [], 0);
    };

    const handleResetTotal = async () => {
        setPalabraIndex(0);
        setLetrasUsadas([]);
        setErrores(0);
        setPalabrasResueltas([]);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { palabrasResueltas: [], palabraIndex: 0, letrasUsadas: [], errores: 0, completado: false },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar en Supabase", err);
            }
        }
    };

    const juegoTerminado = palabrasResueltas.length === palabras.length;

    const handleContinue = async () => {
        if (!juegoTerminado) return;

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

    // Imagen del puerquito según errores actuales
    const imgPuerco = config.imagenesPuerco?.[Math.min(errores, maxErrores)] || `/images/11/puerco_${Math.min(errores, maxErrores)}.png`;

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación superior */}
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

            {/* Tarjeta principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative space-y-6" translate="no">
                
                {/* Título e Instrucciones */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "ACTIVIDAD: NO ROMPAS LA ALCANCÍA"}
                    </h1>
                    <p className="text-gray-700 font-bold mt-2 text-base md:text-lg max-w-3xl mx-auto">
                        {config.instrucciones || "Descubre las palabras secretas antes de que se rompa la alcancía."}
                    </p>
                </div>

                {/* Área del Juego */}
                <div className="bg-sky-50/60 p-4 md:p-6 rounded-3xl border-2 border-sky-100 shadow-inner max-w-4xl mx-auto flex flex-col gap-6 items-center">
                    
                    {/* Visualizador del Puerquito */}
                    <div className=" flex flex-col items-center justify-center bg-white p-4 rounded-2xl border-2 border-sky-100 shadow-sm">
                        <img
                            src={imgPuerco}
                            alt={`Alcancía con ${errores} fallas`}
                            className="w-48 h-48 md:w-56 md:h-56 object-contain transition-all duration-300"
                        />
                        <span className="mt-2 font-black text-red-500 text-sm md:text-base">
                            Errores: {errores} / {maxErrores}
                        </span>
                    </div>

                    {/* Pista y Guiones de la Palabra */}
                    <div className="space-y-6 flex flex-col justify-center">
                        <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-purple-900 tracking-wider">
                                Palabra {palabraIndex + 1} de {palabras.length}
                            </span>
                            <p className="text-base md:text-xl font-extrabold text-blue-950">
                                <span className="text-amber-600">Pista:</span> {palabraActual.pista}
                            </p>
                        </div>

                        {/* Render de letras / guiones */}
                        <div className="flex flex-wrap gap-1.5 justify-center md:justify-start items-center">
                            {respuestaLimpia.split("").map((char, i) => {
                                if (char === " ") {
                                    return <div key={i} className="w-3 h-10" />;
                                }
                                const adivinada = letrasUsadas.includes(char);
                                return (
                                    <div
                                        key={i}
                                        className={`w-8 h-10 md:w-11 md:h-14 border-b-4 flex items-center justify-center font-black text-2xl md:text-3xl uppercase transition-all ${
                                            adivinada
                                                ? "border-blue-600 text-blue-900 bg-blue-50/80 rounded-t-lg"
                                                : "border-gray-400 text-transparent"
                                        }`}
                                    >
                                        {adivinada ? char : "_"}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mensajes de Estado de la Palabra */}
                        {errores >= maxErrores && (
                            <div className="bg-red-100 border-2 border-red-400 text-red-800 p-3 rounded-2xl text-center space-y-2">
                                <p className="font-extrabold text-base">¡Oh no! La alcancía se rompió completamente 💔</p>
                                <button
                                    onClick={handleReintentarPalabra}
                                    className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-full hover:scale-105 transition shadow"
                                >
                                    Intentar de nuevo
                                </button>
                            </div>
                        )}

                        {esPalabraCompletada() && (
                            <div className="bg-white border-2 border-amber-400 text-amber-800 p-3 rounded-2xl text-center space-y-2">
                                <p className="font-extrabold text-base">¡Excelente! Descubriste la palabra 🎉</p>
                                {palabraIndex < palabras.length - 1 && (
                                    <button
                                        onClick={handleSiguientePalabra}
                                        className="bg-blue-600 text-white font-bold px-5 py-2 rounded-full hover:scale-105 transition shadow"
                                    >
                                        Siguiente Palabra →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teclado Virtual */}
                <div className="max-w-3xl mx-auto bg-sky-50/40 p-4 rounded-3xl border-2 border-sky-100">
                    <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
                        {ABECEDARIO.map((letra) => {
                            const usada = letrasUsadas.includes(letra);
                            const esCorrecta = usada && respuestaLimpia.includes(letra);
                            const esIncorrecta = usada && !respuestaLimpia.includes(letra);

                            let estiloBoton = "bg-white text-gray-800 border-gray-200 hover:bg-sky-100 hover:border-sky-300";

                            if (esCorrecta) {
                                estiloBoton = "bg-blue-500 text-white border-blue-600 cursor-not-allowed";
                            } else if (esIncorrecta) {
                                estiloBoton = "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-50";
                            }

                            return (
                                <button
                                    key={letra}
                                    onClick={() => handleSeleccionarLetra(letra)}
                                    disabled={usada || errores >= maxErrores || esPalabraCompletada()}
                                    className={`w-9 h-11 md:w-11 md:h-13 rounded-xl border-2 font-black text-lg md:text-xl shadow-sm transition-all ${estiloBoton}`}
                                >
                                    {letra}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Reflexión Final (Aparece cuando resuelve todas las palabras) */}
                {juegoTerminado && config.reflexionFinal && (
                    <div className="max-w-3xl mx-auto bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm text-center space-y-2">
                        <span className="font-extrabold text-amber-600 uppercase text-xs tracking-wider">
                            Reflexión de Igualdad
                        </span>
                        <p className="font-bold text-gray-800 text-base md:text-lg leading-relaxed">
                            {config.reflexionFinal}
                        </p>
                    </div>
                )}

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6">
                    <button
                        onClick={handleResetTotal}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!juegoTerminado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
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

export default Act11;