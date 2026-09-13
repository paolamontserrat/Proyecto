import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const reglasDisponibles = config.reglasDisponibles || [];
    const listaCompromisos = config.listaCompromisos || [];
    const habilidades = config.habilidades || [];
    const imagenes = config.imagenes || [];

    const [reglaFavorita, setReglaFavorita] = useState("");
    const [compromisosSeleccionados, setCompromisosSeleccionados] = useState([]);
    const [compromisoPersonal, setCompromisoPersonal] = useState("");
    const [habilidadElegida, setHabilidadElegida] = useState("");
    const [compromisoAceptado, setCompromisoAceptado] = useState(false);

    // Persistencia
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

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

                    if (progreso) {
                        if (progreso.completada || progreso.datos_actividad?.completado) {
                            setCompromisoAceptado(true);
                        }
                        if (progreso.datos_actividad) {
                            const d = progreso.datos_actividad;
                            if (d.reglaFavorita) setReglaFavorita(d.reglaFavorita);
                            if (d.compromisosSeleccionados) setCompromisosSeleccionados(d.compromisosSeleccionados);
                            if (d.compromisoPersonal) setCompromisoPersonal(d.compromisoPersonal);
                            if (d.habilidadElegida) setHabilidadElegida(d.habilidadElegida);
                        }
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso desde Supabase", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.reglaFavorita) setReglaFavorita(parsed.reglaFavorita);
                    if (parsed.compromisosSeleccionados) setCompromisosSeleccionados(parsed.compromisosSeleccionados);
                    if (parsed.compromisoPersonal) setCompromisoPersonal(parsed.compromisoPersonal);
                    if (parsed.habilidadElegida) setHabilidadElegida(parsed.habilidadElegida);
                    if (parsed.completado) setCompromisoAceptado(true);
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, storageKey, userId]);

    const handleToggleCompromiso = (item) => {
        if (compromisoAceptado) return;
        if (compromisosSeleccionados.includes(item)) {
            setCompromisosSeleccionados(compromisosSeleccionados.filter(c => c !== item));
        } else {
            setCompromisosSeleccionados([...compromisosSeleccionados, item]);
        }
    };

    const esFormularioValido = () => {
        return (
            reglaFavorita !== "" &&
            (compromisosSeleccionados.length > 0 || compromisoPersonal.trim() !== "") &&
            habilidadElegida !== ""
        );
    };

    const handleAceptarCompromiso = () => {
        if (!esFormularioValido()) return;

        setCompromisoAceptado(true);

        const datosGuardar = {
            reglaFavorita,
            compromisosSeleccionados,
            compromisoPersonal,
            habilidadElegida,
            completado: true,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosGuardar));
    };

    const handleReset = () => {
        setReglaFavorita("");
        setCompromisosSeleccionados([]);
        setCompromisoPersonal("");
        setHabilidadElegida("");
        setCompromisoAceptado(false);
        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        if (!compromisoAceptado) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: {
                            reglaFavorita,
                            compromisosSeleccionados,
                            compromisoPersonal,
                            habilidadElegida,
                            completado: true
                        },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, progreso guardado localmente", err);
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

            {/* Contenedor Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative overflow-visible" translate="no">

                {/* ENCABEZADO */}
                <div className="bg-sky-50 p-5 md:p-6 rounded-3xl border-2 border-sky-100 text-center space-y-3 relative mb-8">
                    <span className="bg-amber-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {imagenes[0] && (
                            <img
                                src={imagenes[0]}
                                alt="Alianzito Graduado"
                                className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg animate-float-slow"
                            />
                        )}
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="font-extrabold text-blue-900 text-xl md:text-3xl uppercase tracking-wide">
                                {config.regla?.numero}: {config.regla?.titulo}
                            </h1>
                            <p className="text-amber-600 font-extrabold text-base md:text-lg">
                                "{config.regla?.subtitulo}"
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-700 font-medium text-sm md:text-base leading-relaxed max-w-2xl mx-auto pt-2">
                        {config.regla?.descripcion}
                    </p>
                </div>

                {/* FORMULARIO DE COMPROMISO */}
                <div className="space-y-8 max-w-4xl mx-auto">
                    
                    {/* 1. MI REGLA FAVORITA */}
                    <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-5 md:p-6 space-y-4">
                        <h2 className="text-lg md:text-xl font-black text-amber-950 flex items-center gap-2 uppercase">
                            ⭐ Mi Regla Favorita
                        </h2>
                        <p className="text-xs md:text-sm font-semibold text-gray-600">
                            De las 8 reglas que abordamos, ¿cuál fue tu favorita y crees que te ayudará más en tu vida?
                        </p>
                        <select
                            value={reglaFavorita}
                            onChange={(e) => setReglaFavorita(e.target.value)}
                            disabled={compromisoAceptado}
                            className="w-full p-4 rounded-2xl border-2 border-amber-300 bg-white font-bold text-blue-950 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">-- Selecciona una regla --</option>
                            {reglasDisponibles.map((r) => (
                                <option key={r.id} value={r.titulo}>
                                    {r.titulo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. MI COMPROMISO FINANCIERO (CHECKBOXES + INPUT) */}
                    <div className="bg-sky-50/70 border-2 border-sky-200 rounded-3xl p-5 md:p-6 space-y-4">
                        {imagenes[1] && (
                                <img
                                    src={imagenes[1]}
                                    alt="Ilustración"
                                    className="w-28 h-28 md:w-32 md:h-32 object-contain animate-bounce-gentle animate-float-slow justify-center mx-auto mb-2"
                                />
                        )}
                        <h2 className="text-lg md:text-xl font-black text-blue-950 flex items-center gap-2 uppercase">
                            📝 Mi Compromiso Financiero
                        </h2>
                        <p className="text-xs md:text-sm font-semibold text-gray-600">
                            Elige uno o más compromisos que quieras poner en práctica a partir de hoy:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {listaCompromisos.map((item, idx) => {
                                const checked = compromisosSeleccionados.includes(item);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleToggleCompromiso(item)}
                                        disabled={compromisoAceptado}
                                        className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs md:text-sm transition-all flex items-center gap-3 ${
                                            checked
                                                ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                                                : "bg-white text-gray-700 border-sky-100 hover:border-sky-300"
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center font-black ${
                                            checked ? "bg-white text-blue-600 border-white" : "border-gray-400"
                                        }`}>
                                            {checked ? "✓" : ""}
                                        </span>
                                        <span>{item}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs md:text-sm font-black text-blue-950 mb-1">
                                Mi compromiso personal es:
                            </label>
                            <input
                                type="text"
                                value={compromisoPersonal}
                                onChange={(e) => setCompromisoPersonal(e.target.value)}
                                disabled={compromisoAceptado}
                                placeholder="Escribe tu compromiso personal..."
                                className="w-full p-4 rounded-2xl border-2 border-sky-200 bg-white font-semibold text-blue-950 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* 3. HABILIDAD QUE TE LLEVAS */}
                    <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-5 md:p-6 space-y-4">
                        <h2 className="text-lg md:text-xl font-black text-amber-950 flex items-center gap-2 uppercase">
                            🎓 ¿Qué habilidad te llevas?
                        </h2>
                        <p className="text-xs md:text-sm font-semibold text-gray-600">
                            Elige la habilidad principal que desarrollaste durante este módulo:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {habilidades.map((hab) => {
                                const seleccionada = habilidadElegida === hab.id;
                                return (
                                    <button
                                        key={hab.id}
                                        type="button"
                                        onClick={() => !compromisoAceptado && setHabilidadElegida(hab.id)}
                                        disabled={compromisoAceptado}
                                        className={`p-4 rounded-2xl border-2 text-center font-bold text-xs md:text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                                            seleccionada
                                                ? "bg-amber-400 border-amber-500 text-blue-950 ring-2 ring-amber-600 shadow-md scale-102"
                                                : "bg-white text-gray-700 border-amber-100 hover:bg-amber-100/50"
                                        }`}
                                    >
                                        <span className="text-2xl">{hab.emoji}</span>
                                        <span>{hab.texto}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* BOTÓN "ME COMPROMETO" / PANTALLA DE ÉXITO */}
                {!compromisoAceptado ? (
                    <div className="text-center pt-8 max-w-md mx-auto">
                        <button
                            onClick={handleAceptarCompromiso}
                            disabled={!esFormularioValido()}
                            className={`w-full py-5 rounded-full font-black text-xl shadow-xl uppercase tracking-wider transition-all ${
                                !esFormularioValido()
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                    : "bg-sky-500 hover:bg-sky-600 text-white hover:scale-105 active:scale-95"
                            }`}
                        >
                            🤝 ¡ME COMPROMETO!
                        </button>
                    </div>
                ) : (
                    /* CONFIRMACIÓN Y MENSAJE FINAL */
                    <div className="space-y-6 max-w-3xl mx-auto pt-8 animate-fade-in border-t-2 border-sky-100">
                        <div className="bg-sky-50 border-4 border-sky-400 p-6 md:p-8 rounded-3xl text-center space-y-3 shadow-xl">
                            <h2 className="text-3xl md:text-4xl font-black text-sky-900 uppercase">
                                🤝 {config.mensajeFinal?.titulo}
                            </h2>
                            <p className="text-base md:text-lg font-extrabold text-sky-950 max-w-xl mx-auto leading-relaxed">
                                {config.mensajeFinal?.recordatorio}
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleFinalizar}
                        disabled={!compromisoAceptado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !compromisoAceptado
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        Finalizar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;