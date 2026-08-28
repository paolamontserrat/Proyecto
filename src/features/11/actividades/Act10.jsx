import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const opciones = config.opciones || [];

    // Estado con las IDs seleccionadas: ["1", "3", ...]
    const [seleccionadas, setSeleccionadas] = useState([]);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act10-${rango}-${userId}`;

    // Cargar progreso guardado al iniciar
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

                    if (progreso?.datos_actividad?.seleccionadas) {
                        setSeleccionadas(progreso.datos_actividad.seleccionadas);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ seleccionadas: progreso.datos_actividad.seleccionadas })
                        );
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
                    if (parsed.seleccionadas) {
                        setSeleccionadas(parsed.seleccionadas);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const handleToggleOption = async (opcion) => {
        // Si ya está marcada y es correcta, no se puede modificar (bloqueda)
        if (opcion.esCorrecta && seleccionadas.includes(opcion.id)) {
            return;
        }

        let nuevasSelecciones;
        if (seleccionadas.includes(opcion.id)) {
            // Si era incorrecta y la vuelve a tocar, se desmarca
            nuevasSelecciones = seleccionadas.filter((id) => id !== opcion.id);
        } else {
            nuevasSelecciones = [...seleccionadas, opcion.id];
        }

        setSeleccionadas(nuevasSelecciones);
        localStorage.setItem(storageKey, JSON.stringify({ seleccionadas: nuevasSelecciones }));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { seleccionadas: nuevasSelecciones, completado: false },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando avance en Supabase", err);
            }
        }
    };

    // La actividad está completa cuando se han marcado TODAS las opciones correctas y NINGUNA de las incorrectas
    const estaCompletoYCorrecto = () => {
        const idsCorrectas = opciones.filter((op) => op.esCorrecta).map((op) => op.id);
        const idsIncorrectas = opciones.filter((op) => !op.esCorrecta).map((op) => op.id);

        const tieneTodasLasCorrectas = idsCorrectas.every((id) => seleccionadas.includes(id));
        const tieneNingunaIncorrecta = !idsIncorrectas.some((id) => seleccionadas.includes(id));

        return tieneTodasLasCorrectas && tieneNingunaIncorrecta;
    };

    const handleReset = async () => {
        setSeleccionadas([]);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { seleccionadas: [], completado: false },
                        completada: false,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar en Supabase", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!estaCompletoYCorrecto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { seleccionadas, completado: true },
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
                
                {/* Bloque Informativo Superior */}
                <div className="bg-sky-100 p-6 rounded-3xl border-2 border-sky-300 max-w-4xl mx-auto space-y-3">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-2xl md:text-4xl tracking-wide uppercase text-center">
                        {config.titulo}
                    </h1>
                    <p className="text-purple-900 font-bold text-lg md:text-xl">
                        {config.subtitulo || "La igualdad nos ayuda a:"}
                    </p>
                    {config.puntosInformativos && (
                        <ul className="list-disc list-inside space-y-1 text-gray-800 font-semibold text-base md:text-lg pl-2">
                            {config.puntosInformativos.map((punto, idx) => (
                                <li key={idx}>{punto}</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Encabezado de la Actividad */}
                <div className="text-center pt-2">
                    <h2 className="font-extrabold text-blue-950 text-xl md:text-3xl">
                        Actividad: ¿Es igualdad o no?
                    </h2>
                    <p className="text-gray-700 font-bold mt-1 text-base md:text-lg">
                        {config.instrucciones || "Marca con una X las situaciones que representan igualdad."}
                    </p>
                </div>

                {/* Lista de Opciones */}
                <div className="max-w-3xl mx-auto space-y-3">
                    {opciones.map((opcion) => {
                        const estaSeleccionada = seleccionadas.includes(opcion.id);
                        const esCorrecta = opcion.esCorrecta;

                        // Estilos del botón casilla según estado
                        let estiloCasilla = "bg-white border-gray-300 hover:border-blue-400";
                        if (estaSeleccionada) {
                            if (esCorrecta) {
                                estiloCasilla = "bg-blue-500 border-blue-600 text-white cursor-default";
                            } else {
                                estiloCasilla = "bg-red-500 border-red-600 text-white";
                            }
                        }

                        return (
                            <div
                                key={opcion.id}
                                onClick={() => handleToggleOption(opcion)}
                                className={`flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${
                                    estaSeleccionada && esCorrecta 
                                        ? "bg-blue-50/60 border-blue-200 cursor-default" 
                                        : "bg-sky-50/40 border-sky-100 hover:bg-sky-100/60"
                                }`}
                            >
                                <button
                                    type="button"
                                    disabled={estaSeleccionada && esCorrecta}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 font-black text-xl md:text-2xl flex items-center justify-center transition-all shrink-0 shadow-sm ${estiloCasilla}`}
                                >
                                    {estaSeleccionada ? "X" : ""}
                                </button>
                                <span className="font-bold text-gray-800 text-base md:text-lg select-none">
                                    {opcion.texto}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
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
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act10;