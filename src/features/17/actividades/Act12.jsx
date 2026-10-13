import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estado para los 5 elementos seleccionados de la mochila
    const [elementosSeleccionados, setElementosSeleccionados] = useState([]);
    
    // Estado para las justificaciones de cada elemento seleccionado
    // { "AHORRO": "me ayudará a...", ... }
    const [justificaciones, setJustificaciones] = useState({});

    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act12-${rango}-${userId}`;

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
                        if (d.elementosSeleccionados) setElementosSeleccionados(d.elementosSeleccionados);
                        if (d.justificaciones) setJustificaciones(d.justificaciones);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.elementosSeleccionados) setElementosSeleccionados(d.elementosSeleccionados);
                        if (d.justificaciones) setJustificaciones(d.justificaciones);
                    }
                }
            } catch (err) {
                console.warn("Error cargando progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Seleccionar o deseleccionar elemento de la mochila (Máximo 5)
    const handleToggleElemento = (elem) => {
        let nuevos = [];
        if (elementosSeleccionados.includes(elem)) {
            nuevos = elementosSeleccionados.filter((item) => item !== elem);
            const nuevasJustificaciones = { ...justificaciones };
            delete nuevasJustificaciones[elem];
            setJustificaciones(nuevasJustificaciones);
        } else {
            if (elementosSeleccionados.length >= 5) return; // Límite de 5
            nuevos = [...elementosSeleccionados, elem];
        }

        setElementosSeleccionados(nuevos);
        localStorage.setItem(
            storageKey,
            JSON.stringify({ elementosSeleccionados: nuevos, justificaciones })
        );
    };

    // Actualizar justificación
    const handleJustificacionChange = (elem, texto) => {
        const nuevasJustificaciones = { ...justificaciones, [elem]: texto };
        setJustificaciones(nuevasJustificaciones);

        localStorage.setItem(
            storageKey,
            JSON.stringify({
                elementosSeleccionados,
                justificaciones: nuevasJustificaciones,
            })
        );
    };

    // Reiniciar
    const handleReset = () => {
        setElementosSeleccionados([]);
        setJustificaciones({});
        localStorage.removeItem(storageKey);
    };

    // Finalizar Módulo y guardar en Supabase
    const handleContinue = async () => {
        const datosAGuardar = {
            elementosSeleccionados,
            justificaciones,
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

    // Validación de completitud: 5 elementos seleccionados y todos con justificación llena
    const mochilaLlena = elementosSeleccionados.length === 5;
    const justificacionesLlenas = elementosSeleccionados.every(
        (elem) => justificaciones[elem] && justificaciones[elem].trim() !== ""
    );
    const todoCompletado = mochilaLlena && justificacionesLlenas;

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
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

            {/* Contenedor Principal (Actividad Par: Tarjeta Clara/Blanca) */}
            <div className="bg-amber-400/95 p-6 md:p-10 rounded-3xl border-4 border-alianza-azul shadow-2xl space-y-10 max-w-3xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN Y VIDEO */}
                {data?.titulo && (
                    <div className="space-y-6 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-900 text-yellow-300 px-6 py-3 rounded-full border-2 border-yellow-400 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.preguntaEstacion && (
                            <div className="space-y-1">
                                <h2 className="text-lg md:text-xl font-extrabold text-blue-900 uppercase">
                                    {data.preguntaEstacion}
                                </h2>
                                {data?.subtextoEstacion && (
                                    <p className="text-sm md:text-base font-medium text-gray-700">
                                        {data.subtextoEstacion}
                                    </p>
                                )}
                            </div>
                        )}
                        {/* Reproductor de Video */}
                        <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden border-4 border-blue-900 shadow-2xl bg-black">
                            <video
                                controls
                                className="w-full h-auto max-h-[420px]"
                                src={data?.videoUrl || "/images/17/video.mp4"}
                            >
                                Tu navegador no soporta el elemento de video.
                            </video>
                        </div>
                    </div>
                )}

                {/* SECCIÓN 2: ACTIVIDAD ¿QUÉ LLEVARÍAS EN TU MOCHILA? */}
                {data?.actividadMochila && (
                    <div className="space-y-6">
                        <div className="bg-blue-900 text-white p-6 rounded-3xl border-4 border-yellow-400 shadow-xl text-center space-y-3">
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase">
                                {data.actividadMochila.titulo}
                            </h2>
                            <p className="text-sm md:text-base font-medium text-blue-100 leading-relaxed">
                                {data.actividadMochila.instrucciones}
                            </p>
                            <div className="inline-block bg-yellow-400 text-blue-950 px-4 py-1.5 rounded-full font-black text-sm uppercase">
                                Seleccionados: {elementosSeleccionados.length} / 5
                            </div>
                        </div>

                        {/* Opciones de la Mochila */}
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            {data.actividadMochila.elementos?.map((elem, idx) => {
                                const selected = elementosSeleccionados.includes(elem);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleToggleElemento(elem)}
                                        className={`px-5 py-3 rounded-full font-black text-xs md:text-sm uppercase transition-all shadow-md border-2 ${
                                            selected
                                                ? "bg-yellow-400 text-blue-950 border-yellow-500 scale-105 ring-4 ring-yellow-200"
                                                : "bg-blue-900 text-white border-blue-800 hover:bg-blue-800"
                                        }`}
                                    >
                                        {selected ? `✓ ${elem}` : elem}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Ilustración de la Mochila */}
                        {data.actividadMochila.imagenMochila && (
                            <div className="flex justify-center py-2">
                                <img
                                    src={data.actividadMochila.imagenMochila}
                                    alt="Mochila"
                                    className="max-h-56 object-contain animate-float-slow"
                                />
                            </div>
                        )}

                        {/* Campos de texto para las 5 justificaciones */}
                        {elementosSeleccionados.length > 0 && (
                            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-3xl space-y-4 shadow-md">
                                <h3 className="font-black text-blue-950 text-base md:text-lg border-b border-blue-200 pb-2">
                                    Escribe el motivo por el cual elegiste cada elemento:
                                </h3>

                                <div className="space-y-4">
                                    {elementosSeleccionados.map((elem, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <label className="block text-xs md:text-sm font-bold text-blue-900">
                                                Elegí <span className="font-black text-amber-600 uppercase">"{elem}"</span> porque en mi futuro financiero me ayudará a:
                                            </label>
                                            <input
                                                type="text"
                                                value={justificaciones[elem] || ""}
                                                onChange={(e) => handleJustificacionChange(elem, e.target.value)}
                                                placeholder="Completa la frase..."
                                                className="w-full bg-white border border-blue-300 rounded-xl p-3 text-sm font-semibold text-blue-950 focus:outline-none focus:border-yellow-500 shadow-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 3: TIP FINANCIERO */}
                {todoCompletado && data?.tipFinanciero && (
                    <div className="bg-blue-900 text-white p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {data.tipFinanciero.imagen && (
                            <img
                                src={data.tipFinanciero.imagen}
                                alt="Tip Financiero"
                                className="max-h-44 object-contain"
                            />
                        )}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-yellow-300 uppercase">
                                {data.tipFinanciero.titulo}
                            </h3>
                            <p className="text-base md:text-lg font-medium text-blue-100 leading-relaxed">
                                {data.tipFinanciero.mensaje}
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y FINALIZAR MÓDULO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!todoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all uppercase ${
                            !todoCompletado
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul border-2 border-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act12;