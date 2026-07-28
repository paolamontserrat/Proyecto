import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act5 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const filasIniciales = config.filasIniciales || 4;

    // Estado para Ingresos (4 filas por defecto)
    const [ingresos, setIngresos] = useState(
        Array.from({ length: filasIniciales }, () => ({ concepto: "", cantidad: "" }))
    );

    // Estado para Gastos (4 filas por defecto)
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

    // Cargar borrador previo si existe
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (parsed.ingresos) setIngresos(parsed.ingresos);
                if (parsed.gastos) setGastos(parsed.gastos);
                if (parsed.distribucionPct) setDistribucionPct(parsed.distribucionPct);
            } catch (e) {
                console.error("Error cargando guardado local", e);
            }
        }
    }, [config.id]);

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
            ingresos: ingresos.filter(i => i.concepto || i.cantidad),
            gastos: gastos.filter(g => g.concepto || g.cantidad),
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
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Tarjeta Principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* Banner Encabezado */}
                <div className="bg-sky-50 border-3 border-sky-300 text-sky-950 rounded-2xl p-5 text-center shadow-sm">
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide">
                        {config.titulo || "En acción . . . realiza tu propio presupuesto:"}
                    </h1>
                </div>

                {/* BLOQUE 1: INGRESOS */}
                <div className="bg-white rounded-3xl border-3 border-sky-400 p-6 shadow-md relative pt-8">
                    <div className="absolute -top-5 left-6 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-lg shadow-md uppercase">
                        INGRESOS
                    </div>

                    {/* Encabezados */}
                    <div className="grid grid-cols-2 gap-4 mb-3 font-black text-sky-900 text-center text-lg italic">
                        <span>Cantidad ($)</span>
                        <span>Concepto</span>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        {ingresos.map((fila, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    placeholder="$0.00"
                                    value={fila.cantidad}
                                    onChange={(e) => handleIngresoChange(idx, "cantidad", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-sky-300 focus:border-sky-600 rounded-xl p-2.5 text-center font-bold text-gray-800 outline-none transition"
                                />
                                <input
                                    type="text"
                                    placeholder="Ej. Domingo, Trabajo..."
                                    value={fila.concepto}
                                    onChange={(e) => handleIngresoChange(idx, "concepto", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-sky-300 focus:border-sky-600 rounded-xl p-2.5 font-semibold text-gray-800 outline-none transition"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Total Ingresos */}
                    <div className="mt-6 pt-3 border-t-2 border-sky-200 flex justify-end items-center gap-4">
                        <span className="font-black text-sky-900 text-lg italic">Total de ingresos:</span>
                        <span className="text-2xl font-black text-sky-700 bg-sky-100 px-6 py-1.5 rounded-2xl shadow-inner">
                            ${totalIngresos.toLocaleString("es-MX")}
                        </span>
                    </div>
                </div>

                {/* BLOQUE 2: GASTOS */}
                <div className={`bg-white rounded-3xl border-3 transition-colors p-6 shadow-md relative pt-8 ${
                    gastosExcedenIngresos ? "border-rose-500 bg-rose-50/20" : "border-purple-400"
                }`}>
                    <div className="absolute -top-5 left-6 bg-purple-700 text-white px-6 py-2 rounded-2xl font-black text-lg shadow-md uppercase">
                        GASTOS
                    </div>

                    {/* Encabezados */}
                    <div className="grid grid-cols-2 gap-4 mb-3 font-black text-purple-900 text-center text-lg italic">
                        <span>Cantidad ($)</span>
                        <span>Concepto</span>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        {gastos.map((fila, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    placeholder="$0.00"
                                    value={fila.cantidad}
                                    onChange={(e) => handleGastoChange(idx, "cantidad", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-purple-300 focus:border-purple-600 rounded-xl p-2.5 text-center font-bold text-gray-800 outline-none transition"
                                />
                                <input
                                    type="text"
                                    placeholder="Ej. Snacks, Salidas..."
                                    value={fila.concepto}
                                    onChange={(e) => handleGastoChange(idx, "concepto", e.target.value)}
                                    className="w-full bg-slate-50 border-b-2 border-purple-300 focus:border-purple-600 rounded-xl p-2.5 font-semibold text-gray-800 outline-none transition"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Total Gastos */}
                    <div className="mt-6 pt-3 border-t-2 border-purple-200 flex flex-col items-end gap-2">
                        <div className="flex justify-end items-center gap-4">
                            <span className="font-black text-purple-900 text-lg italic">Total de gastos:</span>
                            <span className={`text-2xl font-black px-6 py-1.5 rounded-2xl shadow-inner ${
                                gastosExcedenIngresos 
                                    ? "text-rose-700 bg-rose-100 border-2 border-rose-300" 
                                    : "text-purple-700 bg-purple-100"
                            }`}>
                                ${totalGastos.toLocaleString("es-MX")}
                            </span>
                        </div>

                        {/* Alerta si excede ingresos */}
                        {gastosExcedenIngresos && (
                            <div className="bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-3 rounded-r-xl text-sm font-extrabold mt-1 w-full text-center shadow-sm">
                                ⚠️ Tus gastos (${totalGastos.toLocaleString("es-MX")}) superan tus ingresos (${totalIngresos.toLocaleString("es-MX")}) por ${(totalGastos - totalIngresos).toLocaleString("es-MX")}. Ajusta tus gastos para continuar.
                            </div>
                        )}
                    </div>
                </div>

                {/* BLOQUE 3: DISTRIBUCIÓN */}
                <div className="bg-white rounded-3xl border-3 border-blue-900 p-6 shadow-md relative pt-8">
                    <div className="absolute -top-5 left-6 bg-blue-950 text-white px-6 py-2 rounded-2xl font-black text-lg shadow-md uppercase">
                        DISTRIBUCIÓN
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4 font-black text-blue-950 text-center text-sm md:text-base italic">
                        <span>Categoría recomendada</span>
                        <span>Porcentaje (%)</span>
                        <span>Cantidad ($)</span>
                    </div>

                    <div className="space-y-4">
                        {/* Ahorro Meta */}
                        <div className="grid grid-cols-3 gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="font-bold text-gray-800 text-sm md:text-base">Ahorro Meta (40%)</span>
                            <div className="flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.ahorro}
                                    onChange={(e) => handlePctChange("ahorro", e.target.value)}
                                    className="w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-2 text-center font-black text-gray-800 outline-none"
                                />
                                <span className="ml-1 font-extrabold text-gray-600">%</span>
                            </div>
                            <span className="text-center font-black text-emerald-600 text-lg">
                                ${((totalIngresos * (Number(distribucionPct.ahorro) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Gastos Personales */}
                        <div className="grid grid-cols-3 gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="font-bold text-gray-800 text-sm md:text-base">Gastos personales (50%)</span>
                            <div className="flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.gastos}
                                    onChange={(e) => handlePctChange("gastos", e.target.value)}
                                    className="w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-2 text-center font-black text-gray-800 outline-none"
                                />
                                <span className="ml-1 font-extrabold text-gray-600">%</span>
                            </div>
                            <span className="text-center font-black text-blue-600 text-lg">
                                ${((totalIngresos * (Number(distribucionPct.gastos) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Emergencias */}
                        <div className="grid grid-cols-3 gap-3 items-center border-b border-gray-100 pb-3">
                            <span className="font-bold text-gray-800 text-sm md:text-base">Emergencias (10%)</span>
                            <div className="flex justify-center items-center">
                                <input
                                    type="number"
                                    value={distribucionPct.emergencias}
                                    onChange={(e) => handlePctChange("emergencias", e.target.value)}
                                    className="w-20 bg-amber-50 border-2 border-amber-300 focus:border-amber-500 rounded-xl p-2 text-center font-black text-gray-800 outline-none"
                                />
                                <span className="ml-1 font-extrabold text-gray-600">%</span>
                            </div>
                            <span className="text-center font-black text-purple-600 text-lg">
                                ${((totalIngresos * (Number(distribucionPct.emergencias) || 0)) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Fila Total */}
                        <div className="grid grid-cols-3 gap-3 items-center pt-2 font-black">
                            <span className="text-blue-950 text-right pr-4 text-lg">Total:</span>
                            <span className={`text-center text-lg ${sumaPorcentajes === 100 ? "text-emerald-600" : "text-rose-600"}`}>
                                {sumaPorcentajes}%
                            </span>
                            <span className="text-center text-xl text-blue-950">
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
                        className={`w-full md:w-2/3 py-4 rounded-full font-black text-xl shadow-lg transition-all ${
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

export default Act5;