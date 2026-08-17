import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act06 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const definicion = config.definicion || {};
    const ejemplos = config.ejemplos || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act6-${rango}-${userId}`;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso) return;
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleContinue = async () => {
        const payload = { leido: true, fechaCompleto: new Date().toISOString() };

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
                console.warn("Error guardando avance local/Supabase", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8 min-w-0 box-border"
                translate="no"
            >
                {/* ILUSTRACIÓN CABECERA */}
                {definicion.imagenCabecera && (
                    <div className="flex justify-center">
                        <img
                            src={definicion.imagenCabecera}
                            alt="Niño alcanzando la meta"
                            className="w-full max-w-md h-auto object-contain rounded-3xl"
                        />
                    </div>
                )}

                {/* CONCEPTO / DEFINICIÓN */}
                <div className="bg-sky-50 p-6 sm:p-8 rounded-3xl border-2 border-sky-200 text-center space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-blue-900 uppercase">
                        {config.titulo}
                    </h1>
                    <p className="text-gray-800 font-bold text-lg sm:text-2xl leading-relaxed max-w-2xl mx-auto">
                        {definicion.concepto}
                    </p>
                </div>

                {/* LISTA DE EJEMPLOS */}
                {ejemplos.lista && (
                    <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                            {ejemplos.titulo}
                        </h2>

                        <div className="space-y-6">
                            {ejemplos.lista.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-sky-50 p-4 sm:p-6 rounded-3xl border-2 border-sky-200 flex flex-col md:flex-row items-center gap-6 shadow-sm"
                                >
                                    <p className="text-blue-900 font-bold text-lg sm:text-xl flex-1 text-center md:text-left">
                                        {item.texto}
                                    </p>
                                    {item.imagen && (
                                        <img
                                            src={item.imagen}
                                            alt={item.id}
                                            className="w-48 sm:w-56 h-40 sm:h-48 object-cover rounded-2xl border-2 border-white shadow-md shrink-0"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTÓN CONTINUAR */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-lg sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act06;