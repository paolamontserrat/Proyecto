import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const explicacion = config.explicacion || {};
    const reto = config.reto || {};
    const dias = reto.dias || [];

    // Estado para guardar la entrada de cada día
    const [gastos, setGastos] = useState({
        lunes: "",
        martes: "",
        miercoles: "",
        jueves: "",
        viernes: "",
        sabado: "",
        domingo: ""
    });

    // --- Persistencia de Datos (Supabase + LocalStorage) ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.gastos) {
                        setGastos(progreso.datos_actividad.gastos);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ gastos: progreso.datos_actividad.gastos })
                        );
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando de Supabase, intentando local...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.gastos) {
                        setGastos(parsed.gastos);
                    }
                } catch (e) {
                    console.error("Error al cargar en LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleInputChange = (diaId, value) => {
        const nuevosGastos = { ...gastos, [diaId]: value };
        setGastos(nuevosGastos);
        localStorage.setItem(storageKey, JSON.stringify({ gastos: nuevosGastos }));
    };

    // Validar que se hayan llenado los 7 días
    const estanTodosLlenos = dias.length > 0 && dias.every((d) => (gastos[d.id] || "").trim().length > 0);

    const handleReset = () => {
        const vacio = {
            lunes: "",
            martes: "",
            miercoles: "",
            jueves: "",
            viernes: "",
            sabado: "",
            domingo: ""
        };
        setGastos(vacio);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!estanTodosLlenos) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { gastos, completado: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error de conexión, guardado local", err);
            }
        }
        onComplete();
    };

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
            {/* Navegación */}
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
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* Título Principal */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "¿QUÉ ES EL GASTO HORMIGA?"}
                    </h1>
                </div>

                {/* SECCIÓN 1: Explicación + Imagen / Pizarra Verde */}
                <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-6">
                    <p className="text-gray-800 text-base md:text-lg font-medium leading-relaxed">
                        {explicacion.introduccion}
                    </p>
                    <p className="text-gray-800 text-base md:text-lg font-medium leading-relaxed">
                        {explicacion.analogia}
                    </p>

                    {/* Imagen informativa o Pizarra de Ejemplos */}
                    {config.imagenes ? (
                        <div className="flex justify-center my-4">
                            <img
                                src={config.imagenes}
                                alt="Ejemplo gasto hormiga"
                                className="max-w-full h-auto max-h-80 object-contain rounded-2xl shadow-md animate-float-slow"
                            />
                        </div>
                    ) : (
                        <div className="bg-emerald-900 text-white p-6 rounded-3xl border-4 border-amber-400 font-mono text-center max-w-xl mx-auto shadow-inner space-y-3">
                            <p className="text-xl md:text-2xl font-bold">
                                🍬 $10 + 🍦 $15 = $25 DIARIO
                            </p>
                            <p className="text-lg md:text-xl font-bold text-yellow-300">
                                $25 x 7 = $175 1 SEMANA
                            </p>
                            <p className="text-lg md:text-xl font-bold text-yellow-300">
                                $25 x 30 = $750 1 MES
                            </p>
                        </div>
                    )}

                    <p className="text-blue-950 font-extrabold text-lg md:text-xl text-center">
                        {explicacion.impacto}
                    </p>
                    <p className="text-gray-700 font-medium text-base md:text-lg">
                        {explicacion.reflexion}
                    </p>
                    <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-2xl">
                        <p className="text-amber-900 font-bold text-base md:text-lg">
                            {explicacion.ejemploAhorro}
                        </p>
                    </div>
                </div>

                {/* SECCIÓN 2: El Reto de la Semana */}
                <div className="bg-sky-50/60 p-6 rounded-3xl border-2 border-sky-100">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900">
                            {reto.subtitulo || "El enemigo invisible: los gastos hormiga"}
                        </h2>
                        <p className="text-gray-700 font-semibold mt-1">
                            {reto.descripcion}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Formulario de días */}
                        <div className="md:col-span-8 space-y-3">
                            <h3 className="text-blue-950 font-black text-lg mb-4">
                                {reto.instruccion || "Anota tus gastos pequeños de una semana."}
                            </h3>

                            {dias.map((d) => (
                                <div key={d.id} className="grid grid-cols-12 gap-2 items-center">
                                    <span className="col-span-4 bg-blue-900 text-white font-bold text-center py-2 px-3 rounded-xl shadow-sm text-sm md:text-base">
                                        {d.dia}
                                    </span>
                                    <input
                                        type="text"
                                        value={gastos[d.id] || ""}
                                        onChange={(e) => handleInputChange(d.id, e.target.value)}
                                        placeholder="Gasto realizado..."
                                        className="col-span-8 p-2.5 rounded-xl border-2 border-sky-200 focus:border-blue-500 focus:outline-none font-medium text-gray-800 bg-white shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Imagen Alianzito u Mascotas */}
                        <div className="md:col-span-4 flex justify-center items-center">
                            {reto.imagenes && (
                                <img
                                    src={reto.imagenes}
                                    alt="Alianzito buscando gastos"
                                    className="max-w-full h-auto max-h-72 object-contain hover:scale-105 transition-transform animate-float-slow"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estanTodosLlenos}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estanTodosLlenos
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

export default Act08;