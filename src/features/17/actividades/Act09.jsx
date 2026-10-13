import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const [impostorSeleccionado, setImpostorSeleccionado] = useState(null);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

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
                        if (d.impostorSeleccionado !== undefined) setImpostorSeleccionado(d.impostorSeleccionado);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.impostorSeleccionado !== undefined) setImpostorSeleccionado(d.impostorSeleccionado);
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

    // Seleccionar candidato a impostor
    const handleSeleccionarPersonaje = (id) => {
        setImpostorSeleccionado(id);
        localStorage.setItem(
            storageKey,
            JSON.stringify({ impostorSeleccionado: id })
        );
    };

    // Reiniciar selección
    const handleReset = () => {
        setImpostorSeleccionado(null);
        localStorage.removeItem(storageKey);
    };

    // Guardar en Supabase y continuar
    const handleContinue = async () => {
        const datosAGuardar = {
            impostorSeleccionado,
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

    const personajeElegidoObj = data?.actividad?.personajes?.find(
        (p) => p.id === impostorSeleccionado
    );

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
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

            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-10 max-w-4xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN */}
                {data?.titulo && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950/80 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.descripcionEstacion && (
                            <p className="text-base md:text-lg font-medium text-blue-100 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
                                {data.descripcionEstacion}
                            </p>
                        )}

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Caja Popular Alianza"
                                className="max-h-64 object-contain mx-auto animate-float-slow"
                            />
                        )}

                        {data?.imagenOpciones && (
                            <img
                                src={data.imagenOpciones}
                                alt="Mundo de opciones"
                                className="max-h-64 object-contain mx-auto my-2"
                            />
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: ACTIVIDAD DESCUBRE AL IMPOSTOR */}
                {data?.actividad && (
                    <div className="space-y-6">
                        <div className="bg-amber-400 text-blue-950 p-6 rounded-3xl border-4 border-yellow-500 shadow-xl space-y-3 text-center">
                            <h2 className="text-2xl md:text-3xl font-black uppercase">
                                {data.actividad.titulo}
                            </h2>
                            <p className="text-sm md:text-base font-semibold leading-relaxed">
                                {data.actividad.instrucciones}
                            </p>
                        </div>

                        {/* Grilla con las Libretas de los 6 Personajes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {data.actividad.personajes?.map((p) => {
                                const esSeleccionado = impostorSeleccionado === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSeleccionarPersonaje(p.id)}
                                        className={`cursor-pointer p-5 rounded-2xl border-4 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-4 ${
                                            esSeleccionado
                                                ? "bg-yellow-400 text-blue-950 border-yellow-300 scale-102 ring-4 ring-yellow-200"
                                                : "bg-slate-100 text-slate-900 border-slate-300 hover:border-yellow-400 hover:bg-white"
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            {p.imagen && (
                                                <img
                                                    src={p.imagen}
                                                    alt={p.nombre}
                                                    className="w-28 h-28 object-cover rounded-xl border-2 border-slate-400 shadow-sm"
                                                />
                                            )}
                                            <div className="flex-1 space-y-1 text-center sm:text-left">
                                                <h3 className="text-xl font-black text-blue-950 uppercase border-b border-slate-300 pb-1">
                                                    {p.nombre}
                                                </h3>
                                                <p className="text-xs md:text-sm font-medium leading-snug">
                                                    {p.descripcion}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={`w-full py-2 rounded-xl font-black text-xs md:text-sm uppercase transition shadow ${
                                                esSeleccionado
                                                    ? "bg-blue-950 text-yellow-300"
                                                    : "bg-blue-900 text-white hover:bg-blue-800"
                                            }`}
                                        >
                                            {esSeleccionado ? "🔍 Seleccionado como Impostor" : "Acusar como Impostor"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mensaje de Retroalimentación */}
                        {personajeElegidoObj && (
                            <div
                                className={`p-5 rounded-2xl border-4 text-center font-bold text-lg animate-bounce-gentle shadow-xl ${
                                    personajeElegidoObj.esImpostor
                                        ? "bg-amber-400 text-blue-950 border-amber-300"
                                        : "bg-red-500 text-white border-red-300"
                                }`}
                            >
                                {personajeElegidoObj.feedback}
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 3: TIP FINANCIERO */}
                {personajeElegidoObj?.esImpostor && data?.tipFinanciero && (
                    <div className="bg-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
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

                {/* BOTONES DE ACCIÓN (REINICIAR Y CONTINUAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!personajeElegidoObj?.esImpostor}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !personajeElegidoObj?.esImpostor
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;