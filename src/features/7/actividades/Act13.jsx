import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act13 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const historia = config.historia || [];
    const opciones = config.opciones || [];

    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act13-${rango}-${userId}`;

    const esCorrecta = opcionSeleccionada?.esCorrecta || false;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad?.completado) {
                        const seleccionadaPrev = opciones.find(
                            (o) => o.id === progreso.datos_actividad.opcionId
                        );
                        if (seleccionadaPrev) setOpcionSeleccionada(seleccionadaPrev);
                        return;
                    }
                } catch (err) {
                    console.warn("Error consultando Supabase:", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.completado) {
                        const seleccionadaPrev = opciones.find(
                            (o) => o.id === parsed.opcionId
                        );
                        if (seleccionadaPrev) setOpcionSeleccionada(seleccionadaPrev);
                    }
                } catch (e) {
                    console.error("Error leyendo LocalStorage:", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, opciones]);

    const handleSelectOpcion = (opcion) => {
        if (opcionSeleccionada?.id === opcion.id && opcion.esCorrecta) return;
        setOpcionSeleccionada(opcion);
    };

    const handleReiniciar = () => {
        setOpcionSeleccionada(null);
    };

    const handleContinue = async () => {
        if (!esCorrecta) return;

        const payload = {
            completado: true,
            opcionId: opcionSeleccionada.id,
            fechaCompleto: new Date().toISOString(),
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-5xl mx-auto space-y-10" translate="no">
                <h1 className="text-3xl sm:text-4xl font-black text-blue-950 text-center tracking-wide">
                    {config.titulo}
                </h1>

                {/* HISTORIA - IMÁGENES COMPACTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {historia.map((bloque, idx) => {
                        const tieneTexto = Boolean(bloque.texto);

                        return (
                            <div
                                key={idx}
                                className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${
                                    tieneTexto ? "col-span-1 md:col-span-2" : "col-span-1"
                                }`}
                            >
                                {/* Imagen compacta sin fondo */}
                                {bloque.imagen && (
                                    <img
                                        src={bloque.imagen}
                                        alt={`Conejitos ${idx + 1}`}
                                        className="w-full max-w-[180px] sm:max-w-[220px] h-auto object-contain drop-shadow-md rounded-2xl"
                                    />
                                )}

                                {/* Solo el texto lleva fondo cuando existe */}
                                {bloque.texto && (
                                    <div className="bg-sky-100 border-3 border-sky-300 p-5 rounded-3xl shadow-md flex-1 text-center sm:text-left">
                                        <p className="text-base sm:text-lg font-black text-blue-950 leading-relaxed">
                                            {bloque.texto}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* DINÁMICA: COMPLETAR LA FRASE */}
                <div className="space-y-8 text-center">
                    <div className="bg-sky-100 border-3 border-sky-300 p-6 rounded-3xl space-y-3 max-w-2xl mx-auto shadow-md">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                            {config.pregunta}
                        </h2>
                        <p className="text-lg font-extrabold text-amber-700">
                            {config.instruccion}
                        </p>
                    </div>

                    {/* BANNER INTERACTIVO DE FRASE */}
                    <div className="bg-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-wrap justify-center items-center gap-4 text-2xl sm:text-4xl font-black max-w-3xl mx-auto">
                        <span>{config.textoFijo}</span>
                        <div
                            className={`min-w-[160px] sm:min-w-[220px] px-6 py-3 rounded-2xl border-4 transition-all duration-300 ${
                                !opcionSeleccionada
                                    ? "bg-white/20 border-white border-dashed text-yellow-300"
                                    : opcionSeleccionada.esCorrecta
                                    ? "bg-blue-500 border-blue-300 text-white"
                                    : "bg-red-500 border-red-300 text-white"
                            }`}
                        >
                            {opcionSeleccionada ? opcionSeleccionada.texto : "_____"}
                        </div>
                    </div>

                    {/* OPCIONES DE RESPUESTA */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {opciones.map((opcion) => {
                            const estaSeleccionada = opcionSeleccionada?.id === opcion.id;

                            let estilos = "bg-sky-50 border-sky-300 text-blue-950 hover:bg-sky-100 hover:scale-105";

                            if (estaSeleccionada) {
                                if (opcion.esCorrecta) {
                                    estilos = "bg-blue-600 border-blue-400 text-white ring-4 ring-blue-300 scale-105";
                                } else {
                                    estilos = "bg-red-500 border-red-400 text-white ring-4 ring-red-300";
                                }
                            }

                            return (
                                <button
                                    key={opcion.id}
                                    onClick={() => handleSelectOpcion(opcion)}
                                    className={`p-5 rounded-2xl border-4 font-black text-xl sm:text-2xl shadow-lg transition-all duration-200 select-none ${estilos}`}
                                >
                                    {opcion.texto}
                                </button>
                            );
                        })}
                    </div>

                    {/* BOTONES REINICIAR Y CONTINUAR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                        <button
                            onClick={handleReiniciar}
                            className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                        >
                            Reiniciar
                        </button>

                        <button
                            onClick={handleContinue}
                            disabled={!esCorrecta}
                            className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                                !esCorrecta
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                    : "bg-amber-400 text-blue-950 hover:scale-102 active:scale-98 cursor-pointer"
                            }`}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act13;