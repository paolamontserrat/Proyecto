import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act04-${rango}-${userId}`;

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const d = progreso.datos_actividad;
                        if (d.opcionSeleccionada !== undefined) setOpcionSeleccionada(d.opcionSeleccionada);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.opcionSeleccionada !== undefined) setOpcionSeleccionada(d.opcionSeleccionada);
                    }
                }
            } catch (err) {
                console.warn("Error cargando datos:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Seleccionar opción y guardar en LocalStorage
    const handleSeleccionarOpcion = (id) => {
        setOpcionSeleccionada(id);
        const datos = { opcionSeleccionada: id };
        localStorage.setItem(storageKey, JSON.stringify(datos));
    };

    // Reiniciar estado
    const handleReset = () => {
        setOpcionSeleccionada(null);
        localStorage.removeItem(storageKey);
    };

    // Finalizar/Guardar en Supabase y Continuar
    const handleContinue = async () => {
        const datosAGuardar = {
            opcionSeleccionada,
            completada: true,
        };

        if (userId !== "anon" && data?.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: data.id,
                        datos_actividad: datosAGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6">
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

            {/* Contenedor Principal */}
            <div className="bg-amber-400/95 p-6 md:p-10 rounded-3xl border-4 border-alianza-azul shadow-2xl space-y-10 max-w-3xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN / INTRO */}
                {data?.estacion && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <span className="text-red-500 text-2xl">📍</span>
                            <h2 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.estacion}
                            </h2>
                        </div>

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Estación"
                                className="max-h-72 object-contain mx-auto animate-float-slow"
                            />
                        )}

                        {data?.descripcionEstacion && (
                            <p className="text-base md:text-lg font-medium text-blue-900 max-w-xl mx-auto">
                                {data.descripcionEstacion}
                            </p>
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: REFLEXIÓN Y METAS */}
                {data?.reflexion && (
                    <div className="space-y-6">
                        <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl shadow-xl space-y-4 border-4 border-alianza-azul">
                            {data.reflexion.pregunta && (
                                <p className="text-base md:text-xl font-bold text-center leading-relaxed">
                                    {data.reflexion.pregunta}
                                </p>
                            )}
                            {data.reflexion.subtexto && (
                                <p className="text-base md:text-lg font-medium text-center leading-relaxed text-gray-700">
                                    {data.reflexion.subtexto}
                                </p>
                            )}
                            {data.reflexion.conclusion && (
                                <p className="text-base md:text-xl font-bold text-center text-blue-900 border-t border-blue-100 pt-3">
                                    {data.reflexion.conclusion}
                                </p>
                            )}
                        </div>

                        {data?.imagenMetas && (
                            <div className="flex justify-center my-4">
                                <img
                                    src={data.imagenMetas}
                                    alt="Metas"
                                    className="max-h-60 object-contain animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 3: RETO (PREGUNTA Y OPCIONES) */}
                {data?.reto && (
                    <div className="space-y-6">
                        <div className="bg-white text-blue-950 p-6 rounded-2xl border-4 border-alianza-azul shadow-xl space-y-4 text-center">
                            {data.reto.imagen && (
                                <img
                                    src={data.reto.imagen}
                                    alt="Reto"
                                    className="max-h-32 object-contain mx-auto mb-2"
                                />
                            )}
                            {data.reto.titulo && (
                                <h3 className="text-xl md:text-2xl font-black text-yellow-600 uppercase">
                                    {data.reto.titulo}
                                </h3>
                            )}
                            {data.reto.pregunta && (
                                <p className="text-base md:text-lg font-semibold">
                                    {data.reto.pregunta}
                                </p>
                            )}
                        </div>

                        {/* Opciones */}
                        <div className="space-y-3">
                            {data.reto.opciones?.map((opc) => {
                                const seleccionada = opcionSeleccionada === opc.id;
                                return (
                                    <button
                                        key={opc.id}
                                        onClick={() => handleSeleccionarOpcion(opc.id)}
                                        className={`w-full text-left p-4 rounded-2xl font-bold text-sm md:text-base transition-all border-2 shadow-md ${
                                            seleccionada
                                                ? "bg-yellow-400 text-blue-950 border-yellow-300 scale-102"
                                                : "bg-white text-blue-950 border-blue-700 hover:bg-yellow-200"
                                        }`}
                                    >
                                        {opc.texto}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback tras seleccionar */}
                        {opcionSeleccionada && (
                            <div className="bg-blue-900 text-yellow-400 p-4 rounded-xl border-2 border-blue-950 font-black text-center text-lg animate-bounce-gentle">
                                {data.reto.opciones?.find((o) => o.id === opcionSeleccionada)?.feedback || data.reto.retroalimentacionGenerica}
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 4: TIP FINANCIERO */}
                {opcionSeleccionada && data?.tipFinanciero &&(
                    <div className="space-y-6 text-center">
                        <div className="bg-blue-950 p-8 rounded-3xl border-4 border-yellow-400 space-y-6 shadow-2xl">
                            {data.tipFinanciero.imagen && (
                                <img
                                    src={data.tipFinanciero.imagen}
                                    alt="Tip Financiero"
                                    className="max-h-56 object-contain mx-auto rounded-2xl border-2 border-yellow-400/30"
                                />
                            )}
                            {data.tipFinanciero.titulo && (
                                <h3 className="text-3xl font-black text-yellow-300 uppercase tracking-wider">
                                    {data.tipFinanciero.titulo}
                                </h3>
                            )}
                            {data.tipFinanciero.mensaje && (
                                <p className="text-lg md:text-xl font-medium text-blue-100 max-w-xl mx-auto leading-relaxed">
                                    {data.tipFinanciero.mensaje}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                {/* Grilla de Acciones: Reiniciar + Continuar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={handleReset}
                                className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-98 transition-all"
                            >
                                Reiniciar
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!opcionSeleccionada}
                                className={`py-4 rounded-full font-black text-xl shadow-lg transition-all uppercase ${
                                    !opcionSeleccionada
                                        ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
                                        : "bg-alianza-amarillo text-alianza-azul border-2 border-alianza-azul hover:scale-102 active:scale-98"
                                }`}
                            >
                                Continuar
                            </button>
                        </div>
            </div>
        </LayoutActividad>
    );
};

export default Act04;