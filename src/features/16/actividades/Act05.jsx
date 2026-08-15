import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const filasIniciales = config.filasIniciales || 5;

    // Función auxiliar para asegurar que siempre haya un mínimo de filas iniciales
    const normalizarFilas = (arr) => {
        const base = Array.isArray(arr) ? arr : [];
        if (base.length >= filasIniciales) return base;
        
        const faltantes = filasIniciales - base.length;
        const rellenar = Array.from({ length: faltantes }, () => ({ concepto: "", cantidad: "" }));
        return [...base, ...rellenar];
    };

    // Estado para Ingresos (Mínimo 5 filas)
    const [ingresos, setIngresos] = useState(
        Array.from({ length: filasIniciales }, () => ({ concepto: "", cantidad: "" }))
    );

    // Estado para Gastos (Mínimo 5 filas)
    const [gastos, setGastos] = useState(
        Array.from({ length: filasIniciales }, () => ({ concepto: "", cantidad: "" }))
    );

    // Estado para porcentajes de Distribución
    const [distribucionPct, setDistribucionPct] = useState({
        ahorro: 40,
        gastos: 50,
        emergencias: 10
    });

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act5-${rango}-${userId}`;

    // Cargar progreso guardado desde Supabase o LocalStorage
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso, error } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) {
                        const datos = progreso.datos_actividad;
                        if (datos) {
                            if (datos.ingresos) setIngresos(normalizarFilas(datos.ingresos));
                            if (datos.gastos) setGastos(normalizarFilas(datos.gastos));
                            if (datos.distribucion) {
                                setDistribucionPct({
                                    ahorro: datos.distribucion.ahorro?.pct ?? 40,
                                    gastos: datos.distribucion.gastosPersonales?.pct ?? 50,
                                    emergencias: datos.distribucion.emergencias?.pct ?? 10
                                });
                            }
                            localStorage.setItem(storageKey, JSON.stringify({
                                ingresos: normalizarFilas(datos.ingresos),
                                gastos: normalizarFilas(datos.gastos),
                                distribucionPct: datos.distribucion ? {
                                    ahorro: datos.distribucion.ahorro?.pct ?? 40,
                                    gastos: datos.distribucion.gastosPersonales?.pct ?? 50,
                                    emergencias: datos.distribucion.emergencias?.pct ?? 10
                                } : undefined
                            }));
                            return;
                        }
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase, intentando local...", err);
                }
            }

            // Fallback al LocalStorage del dispositivo
            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.ingresos) setIngresos(normalizarFilas(parsed.ingresos));
                    if (parsed.gastos) setGastos(normalizarFilas(parsed.gastos));
                    if (parsed.distribucionPct) setDistribucionPct(parsed.distribucionPct);
                } catch (e) {
                    console.error("Error cargando guardado local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const guardarLocal = (nuevosIngresos, nuevosGastos, nuevaDist) => {
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                ingresos: nuevosIngresos,
                gastos: nuevosGastos,
                distribucionPct: nuevaDist
            })
        );
    };

    // Agregar filas extra dinámicamente si el usuario lo necesita
    const agregarFilaIngreso = () => {
        const nuevos = [...ingresos, { concepto: "", cantidad: "" }];
        setIngresos(nuevos);
        guardarLocal(nuevos, gastos, distribucionPct);
    };

    const agregarFilaGasto = () => {
        const nuevos = [...gastos, { concepto: "", cantidad: "" }];
        setGastos(nuevos);
        guardarLocal(ingresos, nuevos, distribucionPct);
    };

    // Manejadores de Ingresos
    const handleIngresoChange = (index, field, value) => {
        const actualizados = [...ingresos];
        actualizados[index][field] = field === "cantidad" ? (value === "" ? "" : Math.max(0, Number(value))) : value;
        setIngresos(actualizados);
        guardarLocal(actualizados, gastos, distribucionPct);
    };

    // Manejadores de Gastos
    const handleGastoChange = (index, field, value) => {
        const actualizados = [...gastos];
        actualizados[index][field] = field === "cantidad" ? (value === "" ? "" : Math.max(0, Number(value))) : value;
        setGastos(actualizados);
        guardarLocal(ingresos, actualizados, distribucionPct);
    };

    // Manejador de Porcentajes
    const handlePctChange = (key, val) => {
        const num = val === "" ? 0 : Math.max(0, Math.min(100, Number(val)));
        const nuevaDist = { ...distribucionPct, [key]: num };
        setDistribucionPct(nuevaDist);
        guardarLocal(ingresos, gastos, nuevaDist);
    };

    // Totales calculados
    const totalIngresos = ingresos.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    const totalGastos = gastos.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    const sumaPorcentajes = (Number(distribucionPct.ahorro) || 0) + (Number(distribucionPct.gastos) || 0) + (Number(distribucionPct.emergencias) || 0);

    // Validaciones
    const tieneAlMenosUnIngreso = ingresos.some(i => i.concepto.trim() !== "" && Number(i.cantidad) > 0);
    const gastosExcedenIngresos = totalGastos > totalIngresos;
    const porcentajesCorrectos = sumaPorcentajes === 100;

    const esFormularioValido = tieneAlMenosUnIngreso && !gastosExcedenIngresos && porcentajesCorrectos;

    const handleContinue = async () => {
        if (!esFormularioValido) return;

        const payload = {
            ingresos: ingresos,
            gastos: gastos,
            distribucion: {
                totalIngresos,
                totalGastos,
                ahorro: { pct: distribucionPct.ahorro, monto: (totalIngresos * distribucionPct.ahorro) / 100 },
                gastosPersonales: { pct: distribucionPct.gastos, monto: (totalIngresos * distribucionPct.gastos) / 100 },
                emergencias: { pct: distribucionPct.emergencias, monto: (totalIngresos * distribucionPct.emergencias) / 100 }
            }
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
                console.warn("Offline, guardado localmente", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
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

            {/* Contenedor Tarjeta Principal */}
            <div className="bg-white p-4 sm:p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* Banner Encabezado */}
                <div className="bg-sky-50 border-3 border-sky-300 text-sky-950 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide">
                        {config.titulo || "En acción . . . realiza tu propio presupuesto:"}
                    </h1>
                </div>

                {/* BLOQUE 1: INGRESOS */}
                <div className="bg-white rounded-3xl border-3 border-sky-400 p-4 sm:p-6 shadow-md relative pt-8">
                    <div className="absolute -top-5 left-4 sm:left-6 bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl font-black text-base sm:text-lg shadow-md uppercase">
                        INGRESOS
                    </div>

                    {/* Encabezados */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 font-black text-sky-900 text-center text-sm sm:text-lg italic">
                        <span>Cantidad ($)</span>
                        <span>Concepto</span>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        {ingresos.map((fila, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 sm:gap-4">
                                <input
                                    type="number"
                                    placeholder="$0.00"
                                    value={fila.cantidad}
                                    onChange={(e) => handleIngresoChange(idx, "cantidad", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-sky-300 focus:border-sky-600 rounded-xl p-2 sm:p-2.5 text-center font-bold text-gray-800 outline-none transition text-sm sm:text-base"
                                />
                                <input
                                    type="text"
                                    placeholder="Ej. Domingo..."
                                    value={fila.concepto}
                                    onChange={(e) => handleIngresoChange(idx, "concepto", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-sky-300 focus:border-sky-600 rounded-xl p-2 sm:p-2.5 font-semibold text-gray-800 outline-none transition text-sm sm:text-base"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Botón para añadir más filas */}
                    <div className="mt-3 text-right">
                        <button
                            type="button"
                            onClick={agregarFilaIngreso}
                            className="text-xs sm:text-sm text-sky-700 font-bold hover:underline"
                        >
                            + Añadir fila de ingreso
                        </button>
                    </div>

                    {/* Total Ingresos */}
                    <div className="mt-4 pt-3 border-t-2 border-sky-200 flex justify-between sm:justify-end items-center gap-2 sm:gap-4">
                        <span className="font-black text-sky-900 text-sm sm:text-lg italic">Total de ingresos:</span>
                        <span className="text-lg sm:text-2xl font-black text-sky-700 bg-sky-100 px-3 sm:px-6 py-1 sm:py-1.5 rounded-2xl shadow-inner">
                            ${totalIngresos.toLocaleString("es-MX")}
                        </span>
                    </div>
                </div>

                {/* BLOQUE 2: GASTOS */}
                <div className={`bg-white rounded-3xl border-3 transition-colors p-4 sm:p-6 shadow-md relative pt-8 ${
                    gastosExcedenIngresos ? "border-rose-500 bg-rose-50/20" : "border-purple-400"
                }`}>
                    <div className="absolute -top-5 left-4 sm:left-6 bg-purple-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl font-black text-base sm:text-lg shadow-md uppercase">
                        GASTOS
                    </div>

                    {/* Encabezados */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 font-black text-purple-900 text-center text-sm sm:text-lg italic">
                        <span>Cantidad ($)</span>
                        <span>Concepto</span>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        {gastos.map((fila, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 sm:gap-4">
                                <input
                                    type="number"
                                    placeholder="$0.00"
                                    value={fila.cantidad}
                                    onChange={(e) => handleGastoChange(idx, "cantidad", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-purple-300 focus:border-purple-600 rounded-xl p-2 sm:p-2.5 text-center font-bold text-gray-800 outline-none transition text-sm sm:text-base"
                                />
                                <input
                                    type="text"
                                    placeholder="Ej. Snacks..."
                                    value={fila.concepto}
                                    onChange={(e) => handleGastoChange(idx, "concepto", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-purple-300 focus:border-purple-600 rounded-xl p-2 sm:p-2.5 font-semibold text-gray-800 outline-none transition text-sm sm:text-base"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Botón para añadir más filas */}
                    <div className="mt-3 text-right">
                        <button
                            type="button"
                            onClick={agregarFilaGasto}
                            className="text-xs sm:text-sm text-purple-700 font-bold hover:underline"
                        >
                            + Añadir fila de gasto
                        </button>
                    </div>

                    {/* Total Gastos */}
                    <div className="mt-4 pt-3 border-t-2 border-purple-200 flex flex-col items-end gap-2">
                        <div className="flex justify-between sm:justify-end items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <span className="font-black text-purple-900 text-sm sm:text-lg italic">Total de gastos:</span>
                            <span className={`text-lg sm:text-2xl font-black px-3 sm:px-6 py-1 sm:py-1.5 rounded-2xl shadow-inner ${
                                gastosExcedenIngresos 
                                    ? "text-rose-700 bg-rose-100 border-2 border-rose-300" 
                                    : "text-purple-700 bg-purple-100"
                            }`}>
                                ${totalGastos.toLocaleString("es-MX")}
                            </span>
                        </div>

                        {/* Alerta si excede ingresos */}
                        {gastosExcedenIngresos && (
                            <div className="bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-3 rounded-r-xl text-xs sm:text-sm font-extrabold mt-1 w-full text-center shadow-sm">
                                ⚠️ Tus gastos (${totalGastos.toLocaleString("es-MX")}) superan tus ingresos (${totalIngresos.toLocaleString("es-MX")}) por ${(totalGastos - totalIngresos).toLocaleString("es-MX")}. Ajusta tus gastos para continuar.
                            </div>
                        )}
                    </div>
                </div>

                {/* BLOQUE 3: DISTRIBUCIÓN (Ajustes responsivos) */}
                <div className="bg-white rounded-3xl border-3 border-blue-900 p-4 sm:p-6 shadow-md relative pt-8">
                    <div className="absolute -top-5 left-4 sm:left-6 bg-blue-950 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl font-black text-base sm:text-lg shadow-md uppercase">
                        DISTRIBUCIÓN
                    </div>

                    {/* Encabezados ajustados para pantalla pequeña */}
                    <div className="grid grid-cols-12 gap-1 sm:gap-3 mb-4 font-black text-blue-950 text-center text-xs sm:text-base italic">
                        <span className="col-span-5 sm:col-span-5 text-left sm:text-center">Categoría recomendada</span>
                        <span className="col-span-3 sm:col-span-3">Porcentaje (%)</span>
                        <span className="col-span-4 sm:col-span-4">Cantidad ($)</span>
                    </div>

                    <div className="space-y-4">
                        {/* Ahorro Meta */}
                        <div className="grid grid-cols-12 gap-1 sm:gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="col-span-5 sm:col-span-5 font-bold text-gray-800 text-xs sm:text-base leading-tight">
                                Ahorro Meta <span className="text-gray-500 block sm:inline">(40%)</span>
                            </span>
                            <div className="col-span-3 sm:col-span-3 flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.ahorro}
                                    onChange={(e) => handlePctChange("ahorro", e.target.value)}
                                    className="w-12 sm:w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-1 sm:p-2 text-center font-black text-gray-800 outline-none text-xs sm:text-base"
                                />
                                <span className="ml-0.5 sm:ml-1 font-extrabold text-gray-600 text-xs sm:text-base">%</span>
                            </div>
                            <span className="col-span-4 sm:col-span-4 text-center font-black text-emerald-600 text-sm sm:text-lg">
                                ${((totalIngresos * (Number(distribucionPct.ahorro) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Gastos Personales */}
                        <div className="grid grid-cols-12 gap-1 sm:gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="col-span-5 sm:col-span-5 font-bold text-gray-800 text-xs sm:text-base leading-tight">
                                Gastos personales <span className="text-gray-500 block sm:inline">(50%)</span>
                            </span>
                            <div className="col-span-3 sm:col-span-3 flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.gastos}
                                    onChange={(e) => handlePctChange("gastos", e.target.value)}
                                    className="w-12 sm:w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-1 sm:p-2 text-center font-black text-gray-800 outline-none text-xs sm:text-base"
                                />
                                <span className="ml-0.5 sm:ml-1 font-extrabold text-gray-600 text-xs sm:text-base">%</span>
                            </div>
                            <span className="col-span-4 sm:col-span-4 text-center font-black text-blue-600 text-sm sm:text-lg">
                                ${((totalIngresos * (Number(distribucionPct.gastos) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Emergencias */}
                        <div className="grid grid-cols-12 gap-1 sm:gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="col-span-5 sm:col-span-5 font-bold text-gray-800 text-xs sm:text-base leading-tight">
                                Emergencias <span className="text-gray-500 block sm:inline">(10%)</span>
                            </span>
                            <div className="col-span-3 sm:col-span-3 flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.emergencias}
                                    onChange={(e) => handlePctChange("emergencias", e.target.value)}
                                    className="w-12 sm:w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-1 sm:p-2 text-center font-black text-gray-800 outline-none text-xs sm:text-base"
                                />
                                <span className="ml-0.5 sm:ml-1 font-extrabold text-gray-600 text-xs sm:text-base">%</span>
                            </div>
                            <span className="col-span-4 sm:col-span-4 text-center font-black text-purple-600 text-sm sm:text-lg">
                                ${((totalIngresos * (Number(distribucionPct.emergencias) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Fila Total */}
                        <div className="grid grid-cols-12 gap-1 sm:gap-3 items-center pt-2 font-black">
                            <span className="col-span-5 sm:col-span-5 text-blue-950 text-right pr-2 text-sm sm:text-lg">Total:</span>
                            <span className={`col-span-3 sm:col-span-3 text-center text-sm sm:text-lg ${sumaPorcentajes === 100 ? "text-emerald-600" : "text-rose-600"}`}>
                                {sumaPorcentajes}%
                            </span>
                            <span className="col-span-4 sm:col-span-4 text-center text-sm sm:text-xl text-blue-950">
                                ${totalIngresos.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {!porcentajesCorrectos && (
                            <p className="text-xs text-rose-600 font-bold text-center mt-1">
                                ⚠️ Los porcentajes deben sumar exactamente 100% (Suma actual: {sumaPorcentajes}%)
                            </p>
                        )}
                    </div>
                </div>

                {/* Botón Finalizar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        disabled={!esFormularioValido}
                        className={`w-full md:w-2/3 py-4 rounded-full font-black text-lg sm:text-xl shadow-lg transition-all ${
                            !esFormularioValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        {esFormularioValido
                            ? "Guardar Presupuesto"
                            : gastosExcedenIngresos
                            ? "Tus gastos superan a tus ingresos ⚠️"
                            : !tieneAlMenosUnIngreso
                            ? "Ingresa al menos un ingreso válido"
                            : "Asegúrate de que los porcentajes sumen 100%"}
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act05;