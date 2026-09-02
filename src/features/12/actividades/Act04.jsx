import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const comparativa = config.seccionComparativa || {};
    const opciones = comparativa.opciones || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act04-${rango}-${userId}`;

    const handleContinue = async () => {
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { leido: true, completado: true },
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
            }
        }
        localStorage.setItem(storageKey, JSON.stringify({ leido: true }));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
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

            {/* Contenedor Vertical de la Actividad */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative space-y-10 max-w-4xl mx-auto" translate="no">
                
                {/* 1. CONCEPTO: COSTO DE OPORTUNIDAD */}
                <div className="space-y-6 text-center">
                    <h1 className="font-extrabold text-amber-500 leading-tight text-2xl md:text-4xl tracking-wide">
                        {config.titulo }
                        <span className="text-blue-900"> Aprender a Elegir</span>
                    </h1>

                    <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-100 text-gray-800 text-base md:text-xl font-semibold leading-relaxed max-w-3xl mx-auto">
                        {config.introduccion}
                    </div>

                    {/* Personajes Ilustrativos */}
                    <div className="flex flex-col items-center justify-center gap-6 pt-2">
                        {config.imagen_alianzito_pensando && (
                            <img
                                src={config.imagen_alianzito_pensando}
                                alt="Alianzito pensando"
                                className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow animate-bounce-gentle"
                            />
                        )}
                        {config.imagen_monedas_vs && (
                            <img
                                src={config.imagen_monedas_vs}
                                alt="Batalla de ahorro vs gasto"
                                className="w-64 md:w-80 object-contain drop-shadow animate-float-slow"
                            />
                        )}
                    </div>
                </div>

                {/* 2. SECCIÓN COMPARATIVA DE RIESGOS Y VENTAJAS */}
                <div className="space-y-6 pt-6 border-t-2 border-sky-100">
                    <div className="space-y-2 text-left md:text-center">
                        <p className="text-blue-950 font-extrabold text-lg md:text-2xl">
                            {comparativa.subtitulo}
                        </p>
                        <h2 className="text-blue-900 font-black text-xl md:text-3xl">
                            {comparativa.tituloTabla}
                        </h2>
                    </div>

                    {/* Tarjetas Comparativas (Filas) */}
                    <div className="space-y-8">
                        {opciones.map((opcion) => (
                            <div
                                key={opcion.id}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/60 p-5 rounded-3xl border-2 border-sky-100 shadow-sm"
                            >
                                {/* Columna 1: ¿Dónde dejas tu dinero? */}
                                <div className="bg-white p-5 rounded-2xl border border-sky-200 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        ¿Dónde dejas tu dinero?
                                    </span>
                                    <h3 className="font-extrabold text-blue-950 text-xl leading-snug">
                                        {opcion.lugar}
                                    </h3>
                                    {opcion.subtexto && (
                                        <p className="text-xs text-gray-500 font-medium">{opcion.subtexto}</p>
                                    )}
                                    {opcion.imagen && (
                                        <img
                                            src={opcion.imagen}
                                            alt={opcion.lugar}
                                            className="w-24 h-24 object-contain mt-2 animate-float-slow"
                                        />
                                    )}
                                </div>

                                {/* Columna 2: Ventajas */}
                                <div className="bg-white p-5 rounded-2xl border border-emerald-200 space-y-3 shadow-sm">
                                    <h4 className="font-black text-blue-700 text-lg border-b border-emerald-100 pb-2 flex items-center gap-2 justify-center">
                                        Ventajas
                                    </h4>
                                    <ul className="space-y-2 text-sm md:text-base font-semibold text-gray-700">
                                        {opcion.ventajas.map((ventaja, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-emerald-500 font-bold shrink-0">
                                                    {opcion.id === "casa" ? "🏠" : "🏛"}
                                                </span>
                                                <span>{ventaja}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Columna 3: Riesgos */}
                                <div className="bg-white p-5 rounded-2xl border border-amber-200 space-y-3 shadow-sm">
                                    <h4 className="font-black text-amber-700 text-lg border-b border-amber-100 pb-2 flex items-center gap-2 justify-center">
                                        Riesgos
                                    </h4>
                                    <ul className="space-y-2 text-sm md:text-base font-semibold text-gray-700">
                                        {opcion.riesgos.map((riesgo, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-500 font-bold shrink-0">
                                                    {opcion.id === "casa" ? "🏠" : "🏛"}
                                                </span>
                                                <span>{riesgo}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botón Entendido / Continuar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98 shadow-lg transition-all mx-auto block"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act04;