import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const preguntas = config.preguntas || {};

    const [form, setForm] = useState({
        meta: "",
        importancia: "",
        montoTotal: "",
        meses: ""
    });

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act03-${rango}-${userId}`;

    // Cargar avance guardado
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

                    if (progreso?.datos_actividad?.form) {
                        setForm(progreso.datos_actividad.form);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ form: progreso.datos_actividad.form })
                        );
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando de Supabase, buscando en LocalStorage...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.form) setForm(parsed.form);
                } catch (e) {
                    console.error("Error al parsear LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const handleChange = (campo, valor) => {
        const nuevoForm = { ...form, [campo]: valor };
        setForm(nuevoForm);
        localStorage.setItem(storageKey, JSON.stringify({ form: nuevoForm }));

        if (userId !== "anon" && config.id) {
            supabase.from("progreso_actividades").upsert(
                {
                    usuario_id: userId,
                    actividad_id: config.id,
                    datos_actividad: { form: nuevoForm, completado: false },
                    completada: false
                },
                { onConflict: "usuario_id,actividad_id" }
            ).then();
        }
    };

    // Cálculo automático para el Punto 5
    const montoNum = parseFloat(form.montoTotal);
    const mesesNum = parseInt(form.meses, 10);

    const ahorroMensual =
        !isNaN(montoNum) && !isNaN(mesesNum) && montoNum > 0 && mesesNum > 0
            ? (montoNum / mesesNum).toFixed(2)
            : null;

    // Validación de formulario completo
    const esFormularioValido = () => {
        return (
            form.meta.trim().length > 0 &&
            form.importancia.trim().length > 0 &&
            !isNaN(montoNum) &&
            montoNum > 0 &&
            !isNaN(mesesNum) &&
            mesesNum > 0
        );
    };

    const handleReset = async () => {
        const formLimpio = { meta: "", importancia: "", montoTotal: "", meses: "" };
        setForm(formLimpio);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { form: formLimpio, completado: false },
                        completada: false
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar progreso", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!esFormularioValido()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { form, ahorroMensual, completado: true },
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando finalización", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 3s ease-in-out infinite;
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

            {/* Tarjeta Contenedora Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative max-w-4xl mx-auto space-y-6" translate="no">
                
                {/* Encabezado */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl uppercase tracking-wide">
                        {config.titulo || "DISEÑA TU PROYECTO FINANCIERO"}
                    </h1>
                    <p className="text-gray-700 font-bold text-base md:text-lg">
                        {config.instrucciones || "Elige una meta que de verdad te emocione para este año y haz los cálculos matemáticos para lograrla:"}
                    </p>
                </div>

                <div>
                    
                    {/* Formulario con los 5 puntos */}
                    <div className="md:col-span-8 space-y-5">
                        
                        {/* Punto 1 */}
                        <div className="space-y-1">
                            <label className="block font-extrabold text-blue-950 text-base md:text-lg">
                                {preguntas.p1 || "1. Mi meta es:"}
                            </label>
                            <input
                                type="text"
                                value={form.meta}
                                onChange={(e) => handleChange("meta", e.target.value)}
                                placeholder="Ej. Comprar una bicicleta nueva, una laptop..."
                                className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition bg-sky-50/30"
                            />
                        </div>

                        {/* Punto 2 */}
                        <div className="space-y-1">
                            <label className="block font-extrabold text-blue-950 text-base md:text-lg">
                                {preguntas.p2 || "2. ¿Por qué es importante para mí?"}
                            </label>
                            <textarea
                                rows={2}
                                value={form.importancia}
                                onChange={(e) => handleChange("importancia", e.target.value)}
                                placeholder="Ej. Me ayudará a trasportarme a la escuela y hacer ejercicio..."
                                className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition bg-sky-50/30 resize-none"
                            />
                        </div>

                        {/* Punto 3 */}
                        <div className="space-y-1">
                            <label className="block font-extrabold text-blue-950 text-base md:text-lg">
                                {preguntas.p3 || "3. ¿Cuánto dinero necesito en total?"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500 text-lg">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.montoTotal}
                                    onChange={(e) => handleChange("montoTotal", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-blue-600 outline-none text-base font-extrabold text-blue-900 shadow-sm transition bg-sky-50/30"
                                />
                            </div>
                        </div>

                        {/* Punto 4 */}
                        <div className="space-y-1">
                            <label className="block font-extrabold text-blue-950 text-base md:text-lg">
                                {preguntas.p4 || "4. ¿En cuántos meses lo quiero lograr?"}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={form.meses}
                                onChange={(e) => handleChange("meses", e.target.value)}
                                placeholder="Ej. 6, 12..."
                                className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-blue-600 outline-none text-base font-extrabold text-blue-900 shadow-sm transition bg-sky-50/30"
                            />
                        </div>

                        {/* Punto 5 - AUTO CÁLCULO */}
                        <div className="space-y-1 pt-2">
                            <label className="block font-extrabold text-blue-950 text-base md:text-lg leading-tight">
                                {preguntas.p5 || "5. Haz la cuenta (Monto total entre número de meses) / Tengo que ahorrar al mes la cantidad de: $"}
                            </label>
                            <div className={`p-4 rounded-2xl border-2 text-center transition-all ${
                                ahorroMensual !== null
                                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-md"
                                    : "bg-gray-100 border-gray-300 text-gray-400"
                            }`}>
                                {ahorroMensual !== null ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm md:text-base font-extrabold text-emerald-800">Ahorro mensual requerido:</span>
                                        <span className="text-2xl md:text-3xl font-black text-emerald-600">${ahorroMensual}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm md:text-base font-bold italic">
                                        Ingresa un monto total y meses válidos en los puntos 3 y 4 para calcular.
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Personaje Ilustrativo (Alianzito) */}
                    <div className="md:col-span-4 flex justify-center items-end">
                        <img
                            src={config.imagen_alianzito || "/images/12/alianzito_meta.png"}
                            alt="Alianzito apuntando a la meta"
                            className="w-36 md:w-full max-w-[192px] object-contain drop-shadow-xl animate-bounce-gentle"
                        />
                    </div>
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 border-t border-sky-100">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esFormularioValido()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esFormularioValido()
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