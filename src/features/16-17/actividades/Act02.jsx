import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act2 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const ingresoTotal = config.ingresoTotal || 1200;
    const conceptos = config.conceptos || [];

    // Estado inicial de las dos tablas
    const [tablaActual, setTablaActual] = useState({
        ahorro: "",
        gastos_personales: "",
        apoyo_casa: "",
        diversion: ""
    });

    const [tablaAjustada, setTablaAjustada] = useState({
        ahorro: "",
        gastos_personales: "",
        apoyo_casa: "",
        diversion: ""
    });

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act2-${rango}-${userId}`;

    // Cargar progreso guardado
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (parsed.tablaActual) setTablaActual(parsed.tablaActual);
                if (parsed.tablaAjustada) setTablaAjustada(parsed.tablaAjustada);
            } catch (e) {
                console.error("Error al cargar datos locales", e);
            }
        }
    }, [config.id]);

    // Manejar cambios en los inputs
    const handleInputChange = (tabla, conceptoId, valor) => {
        const numVal = valor === "" ? "" : Math.max(0, Number(valor));
        
        if (tabla === "actual") {
            const nueva = { ...tablaActual, [conceptoId]: numVal };
            setTablaActual(nueva);
            guardarLocal(nueva, tablaAjustada);
        } else {
            const nueva = { ...tablaAjustada, [conceptoId]: numVal };
            setTablaAjustada(nueva);
            guardarLocal(tablaActual, nueva);
        }
    };

    const guardarLocal = (actual, ajustada) => {
        localStorage.setItem(storageKey, JSON.stringify({ tablaActual: actual, tablaAjustada: ajustada }));
    };

    // Calcular la suma de cada tabla
    const obtenerSuma = (tablaState) => {
        return Object.values(tablaState).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    };

    const sumaActual = obtenerSuma(tablaActual);
    const sumaAjustada = obtenerSuma(tablaAjustada);

    // Validación: ambas tablas deben dar exactamente $1,200
    const estaValido = (tablaState) => {
        const todosLlenos = conceptos.every(c => tablaState[c.id] !== "" && tablaState[c.id] !== undefined);
        return todosLlenos && obtenerSuma(tablaState) === ingresoTotal;
    };

    const formularioValido = estaValido(tablaActual) && estaValido(tablaAjustada);

    const handleContinue = async () => {
        if (!formularioValido) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { tablaActual, tablaAjustada },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado localmente", err);
            }
        }
        onComplete();
    };

    // Renderizado de tabla reutilizable
    const renderTabla = (titulo, subtitulo, estadoTabla, tipoTabla, colorTema) => {
        const suma = obtenerSuma(estadoTabla);
        const resta = ingresoTotal - suma;

        return (
            <div className={`p-6 rounded-3xl border-3 ${colorTema.border} ${colorTema.bg} shadow-md flex flex-col justify-between`}>
                <div>
                    <h3 className={`text-xl md:text-2xl font-black ${colorTema.titulo} text-center mb-2 uppercase`}>
                        {titulo}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base font-semibold text-center mb-6">
                        {subtitulo}
                    </p>

                    {/* Encabezados de Tabla */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-center font-black text-sm md:text-base">
                        <div className={`${colorTema.badgeHeader} py-2 rounded-2xl shadow-sm`}>
                            Cantidad ($)
                        </div>
                        <div className="bg-white text-blue-900 border border-gray-200 py-2 rounded-2xl shadow-sm">
                            Concepto
                        </div>
                    </div>

                    {/* Filas */}
                    <div className="space-y-3">
                        {conceptos.map((c) => (
                            <div key={c.id} className="grid grid-cols-2 gap-3 items-center">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={estadoTabla[c.id]}
                                    onChange={(e) => handleInputChange(tipoTabla, c.id, e.target.value)}
                                    className="w-full bg-white border-2 border-amber-200 focus:border-amber-500 rounded-2xl p-3 text-center font-bold text-gray-800 text-lg outline-none shadow-inner"
                                />
                                <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center font-extrabold text-blue-900 text-sm md:text-base shadow-sm">
                                    {c.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contador de Totales */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
                    <div className="flex justify-between items-center font-black text-lg">
                        <span className="text-blue-900">Total asignado:</span>
                        <span className={suma === ingresoTotal ? "text-emerald-600" : "text-amber-600"}>
                            ${suma} / ${ingresoTotal}
                        </span>
                    </div>

                    {resta !== 0 && (
                        <p className={`text-xs font-bold text-center mt-2 ${resta > 0 ? "text-amber-600" : "text-rose-600"}`}>
                            {resta > 0 ? `Te faltan $${resta} por asignar` : `Te has pasado por $${Math.abs(resta)}`}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Barra superior */}
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

            {/* Tarjeta contenedora principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-5xl mx-auto" translate="no">
                
                {/* Banner superior */}
                <div className="bg-blue-900 text-white rounded-2xl p-4 md:p-6 text-center shadow-md mb-8">
                    <h1 className="text-2xl md:text-4xl font-black tracking-wide uppercase">
                        {config.titulo || "ACTIVIDAD"}
                    </h1>
                    <p className="text-amber-300 font-bold text-base md:text-lg mt-2">
                        "Suponiendo que recibes $1,200 al mes trabajando fines de semana..."
                    </p>
                </div>

                {/* Tablas lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderTabla(
                        config.escenario1?.titulo || "¿En qué lo utilizas?",
                        config.escenario1?.subtitulo || "Distribución inicial de tus $1,200",
                        tablaActual,
                        "actual",
                        {
                            bg: "bg-amber-50/50",
                            border: "border-amber-300",
                            titulo: "text-amber-600",
                            badgeHeader: "bg-amber-400 text-blue-950 font-bold"
                        }
                    )}

                    {renderTabla(
                        config.escenario2?.titulo || "Con una meta clara",
                        config.escenario2?.subtitulo || "¿Qué ajustes realizarías?",
                        tablaAjustada,
                        "ajustada",
                        {
                            bg: "bg-emerald-50/50",
                            border: "border-emerald-300",
                            titulo: "text-emerald-700",
                            badgeHeader: "bg-lime-400 text-blue-950 font-bold"
                        }
                    )}
                </div>

                {/* Botón Continuar */}
                <div className="mt-10 text-center">
                    <button
                        onClick={handleContinue}
                        disabled={!formularioValido}
                        className={`w-full md:w-2/3 py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !formularioValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        {formularioValido ? "Continuar" : "Asigna $1,200 exactos en ambas tablas"}
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act2;