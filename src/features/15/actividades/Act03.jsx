import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// Función auxiliar para quitar acentos preservando la letra Ñ
const normalizarTexto = (texto = "") => {
    return texto
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Quita marcas diacríticas/acentos
};

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntroduccion = data?.secciones?.introduccion;
    const secActividad = data?.secciones?.actividad;
    const secTarjetaFinal = data?.secciones?.tarjetaFinal;
    const palabras = secActividad?.palabras || [];

    // Abecedario para el teclado
    const ABECEDARIO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

    // Estados del Ahorcado
    const [palabraIndex, setPalabraIndex] = useState(0);
    const [errores, setErrores] = useState(0);
    const maxErrores = 2; // Máximo 2 fallas por palabra
    const [letrasUsadas, setLetrasUsadas] = useState([]);
    const [mensajeRonda, setMensajeRonda] = useState("");
    const [historialRespuestas, setHistorialRespuestas] = useState({});
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [progresoCargado, setProgresoCargado] = useState(false);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act03-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage)
    useEffect(() => {
        const cargarProgreso = async () => {
            let cargadoDeSupabase = false;
            try {
                // 1. Verificar progreso en Supabase si está autenticado
                if (userId !== "anon" && data?.id) {
                    try {
                        const { data: progreso, error } = await supabase
                            .from("progreso_actividades")
                            .select("datos_actividad, completada")
                            .eq("usuario_id", userId)
                            .eq("actividad_id", data.id)
                            .maybeSingle();

                        if (error) throw error;

                        if (progreso?.completada && progreso?.datos_actividad) {
                            const datos = progreso.datos_actividad;
                            if (datos.palabraIndex !== undefined) setPalabraIndex(datos.palabraIndex);
                            if (datos.errores !== undefined) setErrores(datos.errores);
                            if (datos.letrasUsadas) setLetrasUsadas(datos.letrasUsadas);
                            if (datos.historialRespuestas) setHistorialRespuestas(datos.historialRespuestas);
                            if (datos.juegoTerminado !== undefined) setJuegoTerminado(datos.juegoTerminado);

                            // Sincronizar con LocalStorage
                            localStorage.setItem(storageKey, JSON.stringify(datos));
                            cargadoDeSupabase = true;
                        }
                    } catch (err) {
                        console.warn("Error consultando Supabase, recurriendo a local...", err);
                    }
                }

                // 2. Recuperar borrador de LocalStorage si no venía completado de Supabase
                if (!cargadoDeSupabase) {
                    const guardado = localStorage.getItem(storageKey);
                    if (guardado) {
                        try {
                            const parsed = JSON.parse(guardado);
                            if (parsed.palabraIndex !== undefined) setPalabraIndex(parsed.palabraIndex);
                            if (parsed.errores !== undefined) setErrores(parsed.errores);
                            if (parsed.letrasUsadas) setLetrasUsadas(parsed.letrasUsadas);
                            if (parsed.historialRespuestas) setHistorialRespuestas(parsed.historialRespuestas);
                            if (parsed.juegoTerminado !== undefined) setJuegoTerminado(parsed.juegoTerminado);
                        } catch (e) {
                            console.error("Error al cargar progreso local", e);
                        }
                    }
                }
            } finally {
                setProgresoCargado(true);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Guardado automático local tras la carga inicial
    useEffect(() => {
        if (!progresoCargado || !data?.id) return;

        const datosAGuardar = {
            palabraIndex,
            errores,
            letrasUsadas,
            historialRespuestas,
            juegoTerminado,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [palabraIndex, errores, letrasUsadas, historialRespuestas, juegoTerminado, progresoCargado, storageKey, data?.id]);

    const palabraActual = palabras[palabraIndex] || {};
    const respuestaOriginal = (palabraActual.palabra || "").toUpperCase();
    const respuestaLimpia = normalizarTexto(respuestaOriginal);

    // Imagen del puerquito según la cantidad de errores
    const getImgPuerco = () => {
        const imgs = secActividad?.imagenesAlcancia || {};
        if (errores === 0) return imgs.normal || "/images/15/puerco_normal.png";
        if (errores === 1) return imgs.falla1 || "/images/15/puerco_falla1.png";
        return imgs.falla2 || "/images/15/puerco_falla2.png";
    };

    // Selección de letra desde el teclado
    const handleSeleccionarLetra = (letra) => {
        const letraNormalizada = normalizarTexto(letra);

        if (letrasUsadas.includes(letraNormalizada) || errores >= maxErrores || mensajeRonda) return;

        const nuevasLetrasUsadas = [...letrasUsadas, letraNormalizada];
        setLetrasUsadas(nuevasLetrasUsadas);

        // Verificar si la letra (normalizada) está en la palabra
        if (respuestaLimpia.includes(letraNormalizada)) {
            // Comprobar si ya adivinó todas las letras
            const esPalabraCompleta = respuestaLimpia
                .split("")
                .filter((c) => c !== " ")
                .every((char) => nuevasLetrasUsadas.includes(char));

            if (esPalabraCompleta) {
                setMensajeRonda("¡Excelente! 🎉 Descubriste la palabra.");
                setHistorialRespuestas((prev) => ({
                    ...prev,
                    [palabraIndex]: { palabra: respuestaOriginal, acertada: true },
                }));

                setTimeout(() => {
                    avanzarRonda();
                }, 1500);
            }
        } else {
            // Error al elegir una letra incorrecta
            const nuevosErrores = errores + 1;
            setErrores(nuevosErrores);

            if (nuevosErrores >= maxErrores) {
                // Se rompe la alcancía
                setMensajeRonda(`❌ Se rompió la alcancía.`);

                setHistorialRespuestas((prev) => ({
                    ...prev,
                    [palabraIndex]: { palabra: respuestaOriginal, acertada: false },
                }));

                setTimeout(() => {
                    setErrores(0);
                    setLetrasUsadas([]);
                    setMensajeRonda("");
                }, 2000);
            }
        }
    };

    const avanzarRonda = () => {
        setMensajeRonda("");
        setErrores(0);
        setLetrasUsadas([]);
        if (palabraIndex + 1 < palabras.length) {
            setPalabraIndex((prev) => prev + 1);
        } else {
            setJuegoTerminado(true);
        }
    };

    const handleReset = () => {
        setPalabraIndex(0);
        setErrores(0);
        setLetrasUsadas([]);
        setMensajeRonda("");
        setHistorialRespuestas({});
        setJuegoTerminado(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            palabraIndex,
            historialRespuestas,
            juegoTerminado: true,
        };

        // Guardado local definitivo
        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

        // Sincronización final con Supabase
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
                console.warn("Offline, guardado en LocalStorage", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.Fondo || data?.fondo}>
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

            {/* Contenedor Principal Desplegado Verticalmente */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-12" translate="no">
                
                {/* 1. SECCIÓN INTRODUCCIÓN */}
                {secIntroduccion && (
                    <section className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl md:text-4xl font-black text-blue-900 mb-2">
                                {secIntroduccion.titulo}
                            </h1>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 bg-blue-50/70 border-2 border-blue-100 rounded-3xl p-6 shadow-sm">
                            {secIntroduccion.imagen1 && (
                                <img
                                    src={secIntroduccion.imagen1}
                                    alt="Alianzito y amigo"
                                    className="w-36 md:w-48 object-contain drop-shadow-md flex-shrink-0 animate-bounce-gentle"
                                />
                            )}
                            <div className="space-y-4 text-gray-700 font-semibold text-base md:text-lg leading-relaxed">
                                {secIntroduccion.parrafos?.map((parrafo, idx) => (
                                    <p key={idx}>{parrafo}</p>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. SECCIÓN ACTIVIDAD: AHORCADO FINANCIERO */}
                {secActividad && (
                    <section className="space-y-6">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <h2 className="text-2xl md:text-3xl font-black text-amber-500 uppercase tracking-wide">
                                {secActividad.titulo}
                            </h2>

                            {/* Instrucciones */}
                            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200 text-left text-gray-700 font-semibold text-sm md:text-base space-y-2">
                                <span className="font-extrabold text-blue-900 block mb-1 text-base">Reglas del juego:</span>
                                {Array.isArray(secActividad.instrucciones) ? (
                                    secActividad.instrucciones.map((regla, idx) => (
                                        <p key={idx}>{regla}</p>
                                    ))
                                ) : (
                                    <p>{secActividad.instrucciones}</p>
                                )}
                            </div>
                        </div>

                        {!juegoTerminado ? (
                            <div className="space-y-6">
                                {/* ÁREA DEL JUEGO */}
                                <div className="bg-sky-50/60 p-4 md:p-6 rounded-3xl border-2 border-sky-100 shadow-inner max-w-4xl mx-auto gap-6 items-center justify-center">
                                    
                                    {/* Visualizador del Puerquito */}
                                    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border-2 border-sky-100 shadow-sm flex-shrink-0">
                                        <img
                                            src={getImgPuerco()}
                                            alt={`Alcancía con ${errores} fallas`}
                                            className="w-48 h-48 md:w-56 md:h-56 object-contain transition-all duration-300"
                                        />
                                        <span className="mt-2 font-black text-red-500 text-sm md:text-base">
                                            Errores: {errores} / {maxErrores}
                                        </span>
                                    </div>

                                    {/* Pista y Guiones de la Palabra */}
                                    <div className="space-y-6 flex flex-col justify-center flex-1 text-center md:text-left">
                                        <div className="space-y-1">
                                            <span className="text-xs font-black uppercase text-purple-900 tracking-wider">
                                                Palabra {palabraIndex + 1} de {palabras.length}
                                            </span>
                                            <p className="text-base md:text-xl font-extrabold text-blue-950 text-center">
                                                <span className="text-amber-600">Pista:</span> {palabraActual.definicion || palabraActual.pista}
                                            </p>
                                        </div>

                                        {/* Render de letras / guiones */}
                                        <div className="flex flex-wrap gap-1.5 justify-center md:justify-center items-center">
                                            {respuestaOriginal.split("").map((charOriginal, i) => {
                                                if (charOriginal === " ") {
                                                    return <div key={i} className="w-3 h-10" />;
                                                }
                                                const charLimpio = normalizarTexto(charOriginal);
                                                const adivinada = letrasUsadas.includes(charLimpio);

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`w-8 h-10 md:w-11 md:h-14 border-b-4 flex items-center justify-center font-black text-2xl md:text-3xl uppercase transition-all ${
                                                            adivinada
                                                                ? "border-blue-600 text-blue-900 bg-blue-50/80 rounded-t-lg"
                                                                : "border-gray-400 text-transparent"
                                                        }`}
                                                    >
                                                        {adivinada ? charOriginal : "_"}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Mensaje dinámico de aviso */}
                                {mensajeRonda && (
                                    <div className="bg-amber-100 border-2 border-amber-300 p-3 rounded-xl font-bold text-blue-900 text-center max-w-xl mx-auto">
                                        {mensajeRonda}
                                    </div>
                                )}

                                {/* TECLADO INTERACTIVO LETRA POR LETRA */}
                                <div className="max-w-2xl mx-auto bg-gray-50/80 p-4 rounded-3xl border-2 border-gray-200">
                                    <span className="block text-center font-extrabold text-blue-900 text-xs md:text-sm uppercase mb-3">
                                        Selecciona una letra:
                                    </span>
                                    <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                                        {ABECEDARIO.map((letra) => {
                                            const letraLimpia = normalizarTexto(letra);
                                            const usada = letrasUsadas.includes(letraLimpia);

                                            return (
                                                <button
                                                    key={letra}
                                                    onClick={() => handleSeleccionarLetra(letra)}
                                                    disabled={usada || errores === maxErrores || !!mensajeRonda}
                                                    className={`w-9 h-11 md:w-12 md:h-12 rounded-xl font-black text-base md:text-lg shadow transition-all ${
                                                        usada
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                                            : "bg-sky-500 hover:bg-sky-600 active:scale-95 text-white"
                                                    }`}
                                                >
                                                    {letra}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Resumen del juego al finalizar */
                            <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-6 text-center space-y-4 max-w-2xl mx-auto">
                                <h3 className="text-2xl font-black text-sky-800">
                                    ¡Has completado todas las palabras!
                                </h3>
                                <p className="text-gray-700 font-bold">
                                    Resumen de tus respuestas:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                    {palabras.map((item, idx) => {
                                        const res = historialRespuestas[idx];
                                        return (
                                            <div
                                                key={item.id || idx}
                                                className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                                                    res?.acertada
                                                        ? "bg-sky-100 border-sky-300 text-sky-900"
                                                        : "bg-red-100 border-red-300 text-red-900"
                                                }`}
                                            >
                                                <span>{item.palabra}</span>
                                                <span>{res?.acertada ? "✅" : "❌"}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 3. SECCIÓN TARJETA FINAL */}
                {secTarjetaFinal && (
                    <section className="space-y-6">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTarjetaFinal.titulo}
                            </h2>
                            <p className="text-lg md:text-xl font-extrabold uppercase border-b border-white/20 pb-3">
                                {secTarjetaFinal.mensajePrincipal}
                            </p>
                            {/* Imagen del carro */}
                            <div className="flex justify-center">
                                <img
                                    src={secTarjetaFinal.imagen}
                                    alt="Concepto Planificación - Carro"
                                    className="w-56 md:w-72 object-contain drop-shadow-2xl animate-float-slow"
                                />
                            </div>

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTarjetaFinal.subtexto}
                            </p>
                        </div>
                    </section>
                )}

                {/* Botones Globales de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-gray-100">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!juegoTerminado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
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

export default Act03;