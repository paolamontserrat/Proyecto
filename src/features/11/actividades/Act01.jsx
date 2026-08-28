import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const seccionInfo = config.seccionInformativa || {};
    const seccionInter = config.seccionInteractiva || {};
    const campos = seccionInter.campos || [
        { id: "gastaria", concepto: "GASTARÍA", placeholder: "Monto en $" },
        { id: "ahorraria", concepto: "AHORRARÍA", placeholder: "Monto en $" },
        { id: "compraria", concepto: "COMPRARÍA", placeholder: "Monto en $" }
    ];

    const presupuestoTotal = seccionInter.presupuestoTotal || 500;

    const [valores, setValores] = useState({
        gastaria: "",
        ahorraria: "",
        compraria: ""
    });

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act1-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.valores) {
                        setValores(progreso.datos_actividad.valores);
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.valores) {
                        setValores(parsed.valores);
                    }
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleInputChange = (id, valor) => {
        // Solo permitir números positivos
        const num = valor === "" ? "" : Math.max(0, Number(valor));
        const nuevosValores = { ...valores, [id]: num };
        
        setValores(nuevosValores);
        localStorage.setItem(storageKey, JSON.stringify({ valores: nuevosValores }));
    };

    // Cálculos de suma
    const sumaActual = Object.values(valores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    const restante = presupuestoTotal - sumaActual;
    const esValido = sumaActual === presupuestoTotal;

    const handleReset = () => {
        const estadoInicial = { gastaria: "", ahorraria: "", compraria: "" };
        setValores(estadoInicial);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!esValido) return;

        const estadoGuardar = {
            valores,
            completado: true,
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo || "/images/11/Fondo.png"}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* Encabezado */}
                <div className="text-center">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "EL USO DEL DINERO"}
                    </h1>
                </div>

                {/* SECCIÓN INFORMATIVA */}
                <div className="bg-sky-50 p-6 rounded-2xl border-2 border-sky-200 space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {config.imagen_moneda_carro && (
                            <img
                                src={config.imagen_moneda_carro}
                                alt="Moneda en compras"
                                className="w-28 md:w-36 object-contain"
                            />
                        )}
                        <p className="text-gray-800 font-medium text-base md:text-lg flex-1">
                            {seccionInfo.introduccion}
                        </p>
                    </div>

                    <div className="pt-2">
                        <h2 className="font-bold text-blue-900 text-base md:text-lg mb-3">
                            {seccionInfo.subtitulo}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {seccionInfo.puntos?.map((punto, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-sky-100 shadow-sm">
                                    <span className="text-emerald-600 font-extrabold text-xl">✓</span>
                                    <span className="text-gray-700 font-semibold">{punto}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECCIÓN INTERACTIVA */}
                <div className="space-y-6 pt-2">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl md:text-2xl font-black text-blue-950 uppercase">
                            {seccionInter.titulo || "Reflexiona con Alianzito"}
                        </h2>
                        <p className="text-gray-700 font-bold text-base md:text-lg">
                            {seccionInter.instrucciones}
                        </p>
                    </div>

                    {/* Contador de Presupuesto */}
                    <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
                        <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 px-4 py-2 rounded-2xl font-black text-center flex-1">
                            <span className="block text-xs uppercase text-amber-800">Presupuesto</span>
                            ${presupuestoTotal}
                        </div>
                        <div className={`border-2 px-4 py-2 rounded-2xl font-black text-center flex-1 ${
                            restante < 0 ? "bg-red-100 border-red-400 text-red-900" : "bg-blue-50 border-blue-300 text-blue-900"
                        }`}>
                            <span className="block text-xs uppercase">Restante</span>
                            ${restante}
                        </div>
                    </div>

                    {/* Formulario de Filas (USO | CANTIDAD) */}
                    <div className="max-w-xl mx-auto space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-blue-900 text-white font-black py-3 px-6 rounded-2xl text-center text-lg shadow-md">
                            <span>USO</span>
                            <span>CANTIDAD</span>
                        </div>

                        {campos.map((campo) => (
                            <div key={campo.id} className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-2xl border-2 border-slate-200">
                                <label className="font-black text-blue-900 text-center text-base md:text-lg">
                                    {campo.concepto}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={presupuestoTotal}
                                        value={valores[campo.id]}
                                        onChange={(e) => handleInputChange(campo.id, e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-2 rounded-xl border-2 border-slate-300 focus:border-amber-400 outline-none text-right font-extrabold text-blue-950 text-lg bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mensajes de Validación */}
                    {restante < 0 && (
                        <p className="text-center font-black text-red-600 animate-pulse">
                            ⚠️ Te has excedido del presupuesto por ${Math.abs(restante)}.
                        </p>
                    )}
                </div>

                {/* Botones de Acción (Reiniciar y Completar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esValido}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act01;