import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act14 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estado para guardar las 7 respuestas del formulario "Traza tu ruta"
    const [respuestasRuta, setRespuestasRuta] = useState({
        paso1: "",
        paso2: "",
        paso3: "",
        paso4: "",
        paso5: "",
        paso6: "",
        paso7: "",
    });

    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act14-${rango}-${userId}`;

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
                        if (d.respuestasRuta) setRespuestasRuta(d.respuestasRuta);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.respuestasRuta) setRespuestasRuta(d.respuestasRuta);
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

    // Manejar cambios en las respuestas de la ruta
    const handleInputChange = (pasoId, valor) => {
        const nuevasRespuestas = { ...respuestasRuta, [pasoId]: valor };
        setRespuestasRuta(nuevasRespuestas);

        localStorage.setItem(
            storageKey,
            JSON.stringify({ respuestasRuta: nuevasRespuestas })
        );
    };

    // Reiniciar selecciones
    const handleReset = () => {
        setRespuestasRuta({
            paso1: "",
            paso2: "",
            paso3: "",
            paso4: "",
            paso5: "",
            paso6: "",
            paso7: "",
        });
        localStorage.removeItem(storageKey);
    };

    // Finalizar todo el pasaporte y guardar en Supabase
    const handleContinue = async () => {
        const datosAGuardar = {
            respuestasRuta,
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

    // Validar que los 7 campos de la ruta contengan información
    const rutaCompleta = data?.actividadRuta?.pasos?.every(
        (p) => respuestasRuta[p.id] && respuestasRuta[p.id].trim() !== ""
    );

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

                {/* SECCIÓN 1: ESTACIÓN Y RECORRIDO */}
                {data?.titulo && (
                    <div className="space-y-6 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-900 text-yellow-300 px-6 py-3 rounded-full border-2 border-yellow-400 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.descripcionEstacion && (
                            <p className="text-base md:text-lg font-medium text-gray-800 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
                                {data.descripcionEstacion}
                            </p>
                        )}

                        {data?.imagenEstacion && (
                            <div className="flex justify-center my-4">
                                <img
                                    src={data.imagenEstacion}
                                    alt="Comunidad de socios"
                                    className="max-h-80 object-contain rounded-3xl border-4 border-blue-900 shadow-xl animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: MINI ACTIVIDAD "TRAZA TU RUTA" */}
                {data?.actividadRuta && (
                    <div className="space-y-8">
                        <div className="bg-blue-900 text-white p-6 rounded-3xl border-4 border-yellow-400 shadow-xl text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase">
                                {data.actividadRuta.titulo}
                            </h2>
                            <p className="text-sm md:text-base font-medium text-blue-100 leading-relaxed max-w-2xl mx-auto">
                                {data.actividadRuta.instrucciones}
                            </p>
                        </div>

                        {/* Formulario de la Ruta con diseño de línea vertical */}
                        <div className="relative border-l-4 border-dashed border-blue-900 ml-4 md:ml-8 pl-6 md:pl-10 space-y-8">
                            {data.actividadRuta.pasos?.map((paso) => (
                                <div key={paso.id} className="relative space-y-2">
                                    {/* Indicador numérico sobre la línea */}
                                    <div className="absolute -left-[43px] md:-left-[59px] top-0 bg-yellow-400 text-blue-950 border-2 border-blue-900 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base shadow">
                                        {paso.numero}
                                    </div>

                                    <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl shadow-sm space-y-2">
                                        <label className="block text-sm md:text-base font-black text-blue-900 uppercase">
                                            {paso.numero}. {paso.label}: <span className="font-semibold text-gray-700 normal-case">{paso.pregunta}</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={respuestasRuta[paso.id] || ""}
                                            onChange={(e) => handleInputChange(paso.id, e.target.value)}
                                            placeholder="Escribe tu respuesta aquí..."
                                            className="w-full bg-white border border-blue-300 rounded-xl p-3 text-sm md:text-base font-medium text-blue-950 focus:outline-none focus:border-yellow-500 shadow-inner resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y FINALIZAR MÓDULO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!rutaCompleta}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !rutaCompleta
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

export default Act14;