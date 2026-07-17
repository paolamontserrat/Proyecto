import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para las entradas de usuario
    const [ingresos, setIngresos] = useState("");
    const [gastos, setGastos] = useState("");
    const [ahorroPlaneado, setAhorroPlaneado] = useState("");
    const [error, setError] = useState("");

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act03-${rango}-${userId}`;

    // Cargar progreso guardado al montar (Supabase + LocalStorage)
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && data?.id) {
                try {
                    const { data: progreso, error } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.ingresos) setIngresos(datos.ingresos.toString());
                        if (datos.gastos) setGastos(datos.gastos.toString());
                        if (datos.ahorroPlaneado) setAhorroPlaneado(datos.ahorroPlaneado.toString());
                        
                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        return;
                    }
                } catch (err) {
                    console.warn("Error consultando Supabase, intentando local...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.ingresos) setIngresos(parsed.ingresos.toString());
                    if (parsed.gastos) setGastos(parsed.gastos.toString());
                    if (parsed.ahorroPlaneado) setAhorroPlaneado(parsed.ahorroPlaneado.toString());
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [data?.id, userId]);

    // Valores numéricos para validaciones dinámicas
    const ing = parseFloat(ingresos) || 0;
    const gas = parseFloat(gastos) || 0;
    const aho = parseFloat(ahorroPlaneado) || 0;

    // Validación interactiva en tiempo real
    useEffect(() => {
        setError("");

        if (ingresos && ing <= 0) {
            setError("Por favor, ingresa un monto válido para el dinero que recibes al mes (Paso 1).");
            return;
        }
        if (gastos && gas < 0) {
            setError("Por favor, ingresa un monto válido para el dinero que gastas al mes (Paso 2).");
            return;
        }
        if (ahorroPlaneado && aho < 0) {
            setError("Por favor, ingresa un monto de ahorro válido (Paso 3).");
            return;
        }

        if (ingresos && gastos && gas > ing) {
            setError("¡Cuidado! Tus gastos no pueden ser mayores que tus ingresos. Revisa tus números.");
            return;
        }

        if (ingresos && gastos && ahorroPlaneado) {
            const sumaAsignada = gas + aho;
            
            if (sumaAsignada < ing) {
                const sobrante = ing - sumaAsignada;
                setError(`Tienes $${sobrante.toFixed(2)} sobrantes sin asignar en tu presupuesto. ¡Ajusta tus gastos o tu ahorro para presupuestar cada centavo!`);
                return;
            }

            if (sumaAsignada > ing) {
                const exceso = sumaAsignada - ing;
                setError(`Te estás pasando por $${exceso.toFixed(2)}. La suma de tus gastos ($${gas}) y tu ahorro ($${aho}) supera tus ingresos de $${ing}.`);
                return;
            }
        }
    }, [ingresos, gastos, ahorroPlaneado, ing, gas, aho]);

    const pasosCompletadosYCuadrados = ing > 0 && gas > 0 && aho > 0 && (gas + aho === ing);

    // Guardar en Supabase / LocalStorage
    const guardarProgreso = async (datos) => {
        const datosAGuardar = datos || {
            ingresos: parseFloat(ingresos) || 0,
            gastos: parseFloat(gastos) || 0,
            ahorroPlaneado: parseFloat(ahorroPlaneado) || 0
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

        if (userId !== "anon" && data?.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: data.id,
                            datos_actividad: datosAGuardar,
                            completada: true,
                        },
                        {
                            onConflict: "usuario_id,actividad_id",
                        }
                    );
            } catch {
                console.warn("Offline, se sincroniza después");
            }
        }
    };

    // Auto-guardado en cambios de conectividad
    useEffect(() => {
        const handleOnline = () => guardarProgreso();
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [data?.id, ingresos, gastos, ahorroPlaneado]);

    const calculoAhorro = (ing * 0.40).toFixed(2);
    const calculoGastos = (ing * 0.50).toFixed(2);
    const calculoEmergencia = (ing * 0.10).toFixed(2);

    const handleReset = () => {
        setIngresos("");
        setGastos("");
        setAhorroPlaneado("");
        setError("");
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (error) return;

        if (!pasosCompletadosYCuadrados) {
            setError("Debes completar y cuadrar los pasos 1, 2 y 3 exactamente antes de finalizar.");
            return;
        }

        const datosCompletos = {
            ingresos: ing,
            gastos: gas,
            ahorroPlaneado: aho,
            distribucionSugerida: {
                ahorro: parseFloat(calculoAhorro),
                gastos: parseFloat(calculoGastos),
                emergencia: parseFloat(calculoEmergencia)
            }
        };

        await guardarProgreso(datosCompletos);
        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo}>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
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

            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                <h1 className="text-center font-extrabold text-blue-900 mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2.3rem)" }}>
                    {data?.titulo || "Te invito a que realices tu propio presupuesto..."}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Paso 1 */}
                    <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm relative pt-10">
                        <div className="absolute -top-6 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-black text-2xl text-blue-900 border-4 border-white shadow-md">
                            1
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 mb-4">
                            Dinero que <span className="text-sky-600 block">recibes</span> al mes.
                        </h3>
                        <div className="relative w-full mt-auto">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={ingresos}
                                onChange={(e) => setIngresos(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-lg text-gray-800"
                            />
                        </div>
                    </div>

                    {/* Paso 2 */}
                    <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm relative pt-10">
                        <div className="absolute -top-6 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-black text-2xl text-blue-900 border-4 border-white shadow-md">
                            2
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 mb-4">
                            Dinero que <span className="text-sky-600 block">gastas</span> al mes.
                        </h3>
                        <div className="relative w-full mt-auto">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={gastos}
                                onChange={(e) => setGastos(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-lg text-gray-800"
                            />
                        </div>
                    </div>

                    {/* Paso 3 */}
                    <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm relative pt-10">
                        <div className="absolute -top-6 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-black text-2xl text-blue-900 border-4 border-white shadow-md">
                            3
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 mb-4">
                            Cuánto vas a <span className="text-sky-600 block">ahorrar</span>
                        </h3>
                        <div className="relative w-full mt-auto">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={ahorroPlaneado}
                                onChange={(e) => setAhorroPlaneado(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-lg text-gray-800"
                            />
                        </div>
                    </div>
                </div>

                {/* Paso 4 */}
                {pasosCompletadosYCuadrados && !error && (
                    <div className="flex flex-col lg:flex-row gap-6 items-center bg-sky-50 p-6 rounded-3xl border-2 border-sky-100 mb-8 transition-all duration-500 animate-fadeIn">
                        <div className="w-16 h-16 flex-shrink-0 rounded-full bg-yellow-400 flex items-center justify-center font-black text-4xl text-blue-900 shadow-md">
                            4
                        </div>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[400px]">
                                <div className="grid grid-cols-3 gap-3 mb-2 text-center font-black text-white text-lg">
                                    <div className="bg-blue-900 py-3 rounded-2xl">Categoría</div>
                                    <div className="bg-sky-600 py-3 rounded-2xl">Porcentaje</div>
                                    <div className="bg-blue-900 py-3 rounded-2xl">Dinero</div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-2 text-center text-xl font-bold">
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">Ahorro</div>
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">40%</div>
                                    <div className="bg-sky-100/80 py-3 rounded-2xl border border-sky-200 text-blue-900 font-black">${calculoAhorro}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-2 text-center text-xl font-bold">
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">Gastos</div>
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">50%</div>
                                    <div className="bg-sky-100/80 py-3 rounded-2xl border border-sky-200 text-blue-900 font-black">${calculoGastos}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center text-xl font-bold">
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">Emergencia</div>
                                    <div className="bg-white/80 py-3 rounded-2xl border border-sky-100 text-gray-700">10%</div>
                                    <div className="bg-sky-100/80 py-3 rounded-2xl border border-sky-200 text-blue-900 font-black">${calculoEmergencia}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-100 border-l-8 border-red-500 text-red-900 p-4 rounded-xl font-bold text-lg">
                        ⚠️ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!!error || !pasosCompletadosYCuadrados}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            error || !pasosCompletadosYCuadrados
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