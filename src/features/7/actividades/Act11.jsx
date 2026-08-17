import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const info = config.seccionInformativa || {};
    const dinamica = config.dinamica || {};
    const opciones = dinamica.opciones || [];

    const [seleccionadas, setSeleccionadas] = useState([]);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // Obtener los IDs de las opciones que SÍ requieren esfuerzo
    const idsCorrectas = opciones.filter((o) => o.requiereEsfuerzo).map((o) => o.id);

    // Determinar si ya seleccionó todas las correctas (sin dejar ninguna pendiente)
    const todasCorrectasSeleccionadas =
        idsCorrectas.length > 0 &&
        idsCorrectas.every((id) => seleccionadas.includes(id)) &&
        seleccionadas.every((id) => idsCorrectas.includes(id));

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
                        setSeleccionadas(progreso.datos_actividad.seleccionadas || []);
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
                        setSeleccionadas(parsed.seleccionadas || []);
                    }
                } catch (e) {
                    console.error("Error leyendo LocalStorage:", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Manejo de clic instantáneo en cada opción
    const toggleOpcion = (opcion) => {
        const estaSeleccionada = seleccionadas.includes(opcion.id);

        // Si es correcta y ya está seleccionada (azul), se bloquea y no se desmarca
        if (opcion.requiereEsfuerzo && estaSeleccionada) {
            return;
        }

        if (estaSeleccionada) {
            // Si está mal (o seleccionada previamente), permite desmarcarla
            setSeleccionadas(seleccionadas.filter((id) => id !== opcion.id));
        } else {
            // Agregar selección
            setSeleccionadas([...seleccionadas, opcion.id]);
        }
    };

    const handleReiniciarIntento = () => {
        setSeleccionadas([]);
    };

    const handleContinue = async () => {
        const payload = {
            completado: true,
            seleccionadas,
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

                {/* 1. SECCIÓN INFORMATIVA */}
                <div className="space-y-8">
                    {/* Bloque Ejemplos (2 en 2 con Cards Grandes) */}
                    <div className="bg-sky-50 border-3 border-sky-300 p-6 sm:p-8 rounded-3xl space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900 text-center">
                            {info.pregunta}
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {info.ejemplos?.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bg-white p-6 rounded-3xl border-3 border-sky-200 shadow-lg flex flex-col items-center text-center hover:scale-105 transition-transform ${
                                        idx === info.ejemplos.length - 1 && info.ejemplos.length % 2 !== 0 
                                            ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" 
                                            : ""
                                    }`}
                                >
                                    {item.imagen && (
                                        <img 
                                            src={item.imagen} 
                                            alt={item.texto} 
                                            className="w-44 h-44 sm:w-52 sm:h-52 object-contain mb-4 drop-shadow-sm" 
                                        />
                                    )}
                                    <span className="text-xl sm:text-2xl font-black text-blue-950 leading-snug">
                                        {item.texto}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-yellow-300 p-6 rounded-2xl border-2 border-yellow-500 text-blue-950 font-black text-lg sm:text-xl text-center shadow-inner">
                            {info.mensajeInicial}
                        </div>
                    </div>

                    {/* Bloque Concepto Esfuerzo */}
                    <div className="bg-amber-50 border-3 border-amber-300 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8">
                        {info.imagenEsfuerzo && (
                            <img src={info.imagenEsfuerzo} alt="Esfuerzo" className="w-48 h-48 sm:w-60 sm:h-60 object-contain drop-shadow-md" />
                        )}
                        <div className="space-y-4 flex-1 text-center md:text-left">
                            <h2 className="text-2xl sm:text-3xl font-black text-amber-800">¿Qué es el esfuerzo?</h2>
                            <p className="text-blue-950 font-extrabold text-lg sm:text-xl leading-relaxed">
                                {info.definicionEsfuerzo}
                            </p>
                            <p className="font-extrabold text-gray-700 text-lg pt-2">Cuando te esfuerzas:</p>
                            <ul className="list-disc list-inside space-y-2 text-blue-950 font-black text-lg pl-2">
                                {info.cuandoTeEsfuerzas?.map((puntos, idx) => (
                                    <li key={idx}>{puntos}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <hr className="border-t-4 border-dashed border-amber-300 my-6" />

                {/* 2. DINÁMICA DE SELECCIÓN CON FEEDBACK INSTANTÁNEO */}
                <div className="space-y-8">
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                            {dinamica.instruccion}
                        </h2>
                        <p className="text-base sm:text-lg font-bold text-gray-600">
                            Toca las imágenes donde sí se necesite hacer un esfuerzo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {opciones.map((opcion) => {
                            const estaSeleccionada = seleccionadas.includes(opcion.id);
                            
                            let estadoEstilos = "border-gray-200 bg-white hover:border-amber-400 cursor-pointer";
                            let esCorrectaYBloqueada = false;

                            if (estaSeleccionada) {
                                if (opcion.requiereEsfuerzo) {
                                    // CORRECTA: Se pinta de AZUL y se deshabilita desmarcar
                                    estadoEstilos = "border-blue-500 bg-blue-100 ring-4 ring-blue-300 cursor-default";
                                    esCorrectaYBloqueada = true;
                                } else {
                                    // INCORRECTA: Se pinta de ROJO y permite clic para desmarcar
                                    estadoEstilos = "border-red-500 bg-red-100 ring-4 ring-red-300 cursor-pointer";
                                }
                            }

                            return (
                                <div
                                    key={opcion.id}
                                    onClick={() => toggleOpcion(opcion)}
                                    className={`p-6 rounded-3xl border-4 shadow-lg flex flex-col items-center justify-between transition-all select-none ${estadoEstilos}`}
                                >
                                    {opcion.imagen && (
                                        <img
                                            src={opcion.imagen}
                                            alt={opcion.texto}
                                            className="w-40 h-40 sm:w-48 sm:h-48 object-contain mb-4"
                                        />
                                    )}
                                    <p className="text-center font-black text-blue-950 text-lg sm:text-xl leading-snug">
                                        {opcion.texto}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mensaje de Felicidades al completar todas */}
                    {todasCorrectasSeleccionadas && (
                        <div className="p-6 rounded-3xl border-3 border-emerald-400 bg-emerald-50 text-center space-y-4 shadow-md">
                            <h3 className="text-3xl font-black text-emerald-800">
                                ¡Excelente Trabajo!
                            </h3>
                            <div className="space-y-3 text-blue-950 font-bold text-base sm:text-lg">
                                {dinamica.mensajeFinal?.lineas?.map((linea, idx) => (
                                    <p key={idx}>{linea}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botones de Control: Reiniciar y Continuar juntos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                        <button
                            onClick={handleReiniciarIntento}
                            className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                        >
                            Reiniciar
                        </button>

                        <button
                            onClick={handleContinue}
                            disabled={!todasCorrectasSeleccionadas}
                            className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                                !todasCorrectasSeleccionadas
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

export default Act11;