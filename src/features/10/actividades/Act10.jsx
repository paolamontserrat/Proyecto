import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const ejemplosVidaDiaria = config.ejemplosVidaDiaria || {};
    const seccionCooperativa = config.seccionCooperativa || {};

    const [leido, setLeido] = useState(false);

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

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

                    if (progreso?.completada) {
                        setLeido(true);
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
                    if (parsed.leido) setLeido(true);
                } catch (e) {
                    console.error("Error al cargar en LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleMarcarLeido = () => {
        setLeido(true);
        localStorage.setItem(storageKey, JSON.stringify({ leido: true }));
    };

    const handleContinue = async () => {
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { leido: true, completado: true },
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
        <LayoutActividad fondo={config.fondo}>
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

                {/* Encabezado Principal */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "LA DEMOCRACIA EN NUESTRA VIDA DIARIA"}
                    </h1>
                    <p className="text-gray-700 font-medium text-base md:text-lg">
                        {config.subtitulo}
                    </p>
                </div>

                {/* Bloque 1: Democracia en la vida diaria */}
                <div className="bg-blue-900 text-white p-6 rounded-3xl border-2 border-blue-950 shadow-md space-y-4">
                    <h2 className="text-amber-300 font-extrabold text-lg md:text-xl">
                        {ejemplosVidaDiaria.titulo}
                    </h2>
                    <ul className="space-y-2">
                        {ejemplosVidaDiaria.puntos?.map((punto, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm md:text-base font-medium">
                                <span className="text-amber-400 font-black">•</span>
                                <span>{punto}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bloque 2: Democracia en la Cooperativa */}
                <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-2">
                            {seccionCooperativa.titulo}
                        </h2>
                        <p className="text-gray-800 font-medium text-base md:text-lg">
                            {seccionCooperativa.descripcion}
                        </p>
                    </div>

                    <div className="bg-blue-900 text-white p-6 rounded-2xl space-y-3">
                        <h3 className="text-amber-300 font-bold text-lg">
                            {seccionCooperativa.subtitulo}
                        </h3>
                        <ul className="space-y-2">
                            {seccionCooperativa.puntos?.map((p, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm md:text-base font-medium">
                                    <span className="text-amber-400 font-black">•</span>
                                    <span>{p}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Frase clave + Imagen de Asamblea */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-7 bg-sky-100 p-6 rounded-2xl border-l-4 border-blue-900 space-y-3">
                            <p className="text-blue-900 font-black text-lg md:text-xl">
                                Por eso se dice: <br />
                                <span className="text-2xl md:text-3xl text-amber-600 block mt-1">
                                    {seccionCooperativa.fraseClave}
                                </span>
                            </p>
                            <p className="text-gray-800 font-semibold text-base md:text-lg">
                                {seccionCooperativa.explicacionFrase}
                            </p>
                        </div>

                        <div className="md:col-span-5 flex justify-center">
                            {seccionCooperativa.imagen && (
                                <img
                                    src={seccionCooperativa.imagen}
                                    alt="Asamblea Cooperativa"
                                    className="max-w-full h-auto max-h-72 object-cover rounded-2xl shadow-lg border-2 border-sky-300"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón de Confirmación / Continuar */}
                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act10;