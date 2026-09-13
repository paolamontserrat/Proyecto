import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const presupuestosInicial = 1000;

    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
    const [criteriosSeleccionados, setCriteriosSeleccionados] = useState([]);

    const seccionArgumentosRef = useRef(null);
    const seccionReflexionRef = useRef(null);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act01-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad) {
                        const { opcion, criterios } = progreso.datos_actividad;
                        if (opcion) setOpcionSeleccionada(opcion);
                        if (criterios) setCriteriosSeleccionados(criterios);
                        return;
                    }
                } catch (err) {
                    console.warn("Cargando desde LocalStorage...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.opcion) setOpcionSeleccionada(parsed.opcion);
                    if (parsed.criterios) setCriteriosSeleccionados(parsed.criterios);
                } catch (e) {
                    console.error("Error al leer LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const handleSeleccionarOpcion = (id) => {
        setOpcionSeleccionada(id);
        setTimeout(() => {
            seccionArgumentosRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
    };

    const toggleCriterio = (id) => {
        const nuevosCriterios = criteriosSeleccionados.includes(id)
            ? criteriosSeleccionados.filter((item) => item !== id)
            : [...criteriosSeleccionados, id];

        setCriteriosSeleccionados(nuevosCriterios);

        if (nuevosCriterios.length > 0) {
            setTimeout(() => {
                seccionReflexionRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        }
    };

    // Función para reiniciar la actividad
    const handleReset = async () => {
        setOpcionSeleccionada(null);
        setCriteriosSeleccionados([]);
        localStorage.removeItem(storageKey);
    };

    const handleFinalizar = async () => {
        const payload = {
            opcion: opcionSeleccionada,
            criterios: criteriosSeleccionados,
            completado: true
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando progreso en Supabase", err);
            }
        }

        onComplete();
    };

    const opcionActual = config.actividad?.opciones?.find(
        (o) => o.id === opcionSeleccionada
    );
    const sobrante = opcionActual ? presupuestosInicial - opcionActual.precio : 0;

    // Condición para habilitar el botón de continuar
    const estaTodoContestado = Boolean(opcionSeleccionada && criteriosSeleccionados.length > 0);

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
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fadeInDown 0.5s ease-out forwards;
                }
            `}</style>

            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta Principal Contenedora */}
            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-10 max-w-4xl mx-auto mb-10" translate="no">
                
                {/* ENCABEZADO Y REGLA #1 CON ALIANZITO */}
                <div className="bg-sky-50 p-5 md:p-6 rounded-3xl border-2 border-sky-100 text-center space-y-3 relative">
                    <span className="bg-amber-400 text-blue-950 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                        {config.enfoque}
                    </span>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                        {config.imagenes?.alianzito && (
                            <img
                                src={config.imagenes.alianzito}
                                alt="Alianzito"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg animate-float-slow"
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

                {/* BLOQUE IMPORTANCIA */}
                {config.importancia && (
                    <div className="bg-amber-50/80 p-5 rounded-3xl border border-amber-200 text-center space-y-1">
                        <span className="text-amber-800 font-black text-sm uppercase tracking-wide">
                            📌 {config.importancia.titulo}
                        </span>
                        <p className="text-gray-800 font-bold text-base md:text-lg">
                            {config.importancia.texto}
                        </p>
                    </div>
                )}

                {/* SECCIÓN 1: SELECCIÓN DE AUDÍFONOS CON BILLETE */}
                <div className="space-y-6 pt-2 border-t-2 border-sky-100">
                    <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            {config.imagenes?.billete && (
                                <img
                                    src={config.imagenes.billete}
                                    alt="Billete"
                                    className="w-20 h-20 md:w-24 md:h-24 object-contain animate-bounce-gentle"
                                />
                            )}
                            <div>
                                <h2 className="text-blue-900 font-black text-lg md:text-xl">
                                    🛒 {config.actividad?.titulo}
                                </h2>
                                <p className="text-gray-700 font-bold text-sm md:text-base">
                                    {config.actividad?.escenario}
                                </p>
                            </div>
                        </div>
                        <span className="bg-sky-500 text-white font-black px-4 py-2 rounded-xl text-lg shadow shrink-0">
                            Presupuesto: $1,000
                        </span>
                    </div>

                    <p className="font-extrabold text-blue-900 text-center text-lg">
                        {config.actividad?.pregunta}
                    </p>

                    {/* Tarjetas de opciones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {config.actividad?.opciones?.map((opcion) => {
                            const seleccionada = opcionSeleccionada === opcion.id;
                            return (
                                <div
                                    key={opcion.id}
                                    onClick={() => handleSeleccionarOpcion(opcion.id)}
                                    className={`cursor-pointer p-5 rounded-2xl border-3 transition-all flex flex-col justify-between ${
                                        seleccionada
                                            ? "border-blue-900 bg-sky-100 scale-102 shadow-xl ring-2 ring-blue-500"
                                            : "border-sky-200 bg-sky-50/50 hover:bg-sky-100 hover:scale-101"
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="bg-blue-900 text-white font-black text-lg px-3 py-1 rounded-lg">
                                                Opción {opcion.id}
                                            </span>
                                            <span className="text-sky-700 font-black text-2xl">
                                                ${opcion.precio}
                                            </span>
                                        </div>
                                        <ul className="text-gray-700 font-bold text-sm space-y-1.5 pt-2 border-t border-sky-200">
                                            <li>✨ {opcion.calidad}</li>
                                            <li>⏳ {opcion.duracion}</li>
                                            <li>🛡️ {opcion.garantia}</li>
                                            <li>🎧 {opcion.incluye}</li>
                                        </ul>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-sky-200 flex justify-between items-center text-xs font-extrabold text-gray-500">
                                        <span>Sobrante:</span>
                                        <span className="text-blue-900 text-sm font-black">
                                            ${presupuestosInicial - opcion.precio}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SECCIÓN 2: ARGUMENTACIÓN */}
                {opcionSeleccionada && (
                    <div
                        ref={seccionArgumentosRef}
                        className="space-y-6 pt-8 border-t-2 border-sky-100 animate-fade-in"
                    >
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex justify-between items-center">
                            <span className="font-extrabold text-blue-900 text-base">
                                Elegiste: <strong className="text-amber-600">Opción {opcionSeleccionada} (${opcionActual?.precio})</strong>
                            </span>
                            <span className="font-extrabold text-sky-600 text-base">
                                Dinero libre: ${sobrante}
                            </span>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="font-extrabold text-blue-900 text-lg md:text-xl">
                                💭 Argumenta tu decisión
                            </h3>
                            <p className="text-gray-600 text-sm font-bold">
                                {config.actividad?.argumentacion?.instruccion}
                            </p>
                        </div>

                        {/* Criterios */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {config.actividad?.argumentacion?.criterios?.map((criterio) => {
                                const activo = criteriosSeleccionados.includes(criterio.id);
                                return (
                                    <button
                                        key={criterio.id}
                                        onClick={() => toggleCriterio(criterio.id)}
                                        className={`p-4 rounded-2xl font-extrabold text-base transition-all border-2 ${
                                            activo
                                                ? "bg-blue-900 text-white border-blue-900 shadow-md scale-102"
                                                : "bg-sky-50 text-blue-950 border-sky-200 hover:bg-sky-100"
                                        }`}
                                    >
                                        {activo ? "✓ " : "+ "} {criterio.etiqueta}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 3: REFLEXIÓN Y TIP FINANCIERO */}
                {criteriosSeleccionados.length > 0 && (
                    <div
                        ref={seccionReflexionRef}
                        className="space-y-8 pt-8 border-t-2 border-sky-100 animate-fade-in"
                    >
                        <div className="bg-amber-400/90 text-blue-950 p-6 rounded-3xl font-black text-xl md:text-2xl text-center shadow-lg leading-relaxed">
                            💡 "{config.actividad?.argumentacion?.reflexion}"
                        </div>

                        <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-3">
                            <span className="bg-blue-900 text-amber-300 font-black text-xs md:text-sm px-3 py-1 rounded-full uppercase">
                                💡 {config.tipFinanciero?.titulo}
                            </span>
                            <p className="text-gray-800 font-extrabold text-base md:text-lg leading-relaxed">
                                "{config.tipFinanciero?.texto}"
                            </p>
                        </div>

                        <div className="bg-sky-50 border-2 border-sky-300 p-5 rounded-3xl text-center space-y-2 shadow-inner">
                            <span className="text-xs font-black text-sky-600 uppercase tracking-widest">
                                🔓 HABILIDAD DESBLOQUEADA
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-sky-800">
                                {config.tipFinanciero?.habilidad}
                            </h2>
                        </div>
                    </div>
                )}

                {/* BARRA DE ACCIONES FIJA (REINICIAR Y CONTINUAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleFinalizar}
                        disabled={!estaTodoContestado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaTodoContestado
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