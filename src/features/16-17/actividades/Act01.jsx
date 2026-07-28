import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act1 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const preguntas = config.preguntas || [];
    const imagenes = config.imagenes || [];

    // Formato de fecha mínima permitida (a partir de mañana)
    const hoyStr = new Date().toISOString().split("T")[0];

    // Estado para guardar las respuestas
    const [respuestas, setRespuestas] = useState({
        meta: "",
        costo: "",
        falta: "",
        fechaLimite: "",
        cuota: ""
    });

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act1-${rango}-${userId}`;

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
                        const respuestasNube = progreso.datos_actividad?.respuestas;
                        if (respuestasNube) {
                            setRespuestas(respuestasNube);
                            localStorage.setItem(storageKey, JSON.stringify({ respuestas: respuestasNube }));
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
                    if (parsed.respuestas) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.error("Error al cargar progreso local", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Calcular ahorro estimado de forma dinámica
    const calcularAhorroAutomatico = (montoFalta, fechaObjStr) => {
        const monto = parseFloat(montoFalta);
        if (!monto || isNaN(monto) || monto <= 0 || !fechaObjStr) {
            return "";
        }

        const fechaActual = new Date();
        const fechaLimite = new Date(fechaObjStr);
        
        // Calcular diferencia en días
        const diffTiempo = fechaLimite.getTime() - fechaActual.getTime();
        const diffDias = Math.ceil(diffTiempo / (1000 * 3600 * 24));

        if (diffDias <= 0) return "Selecciona una fecha futura válida";

        const semanas = Math.max(1, Math.round(diffDias / 7));
        const meses = Math.max(1, Math.round(diffDias / 30.44));

        const cuotaSemanal = (monto / semanas).toFixed(2);
        const cuotaMensual = (monto / meses).toFixed(2);

        if (meses <= 1) {
            return `$${cuotaSemanal} al mes / aprox. $${cuotaSemanal} por semana`;
        }

        return `$${cuotaSemanal} por semana o $${cuotaMensual} al mes`;
    };

    // Manejador de cambio en cada input
    const handleChange = (fieldId, value) => {
        let nuevasRespuestas = { ...respuestas, [fieldId]: value };

        // Si cambia el monto que falta o la fecha, recalculamos la cuota
        if (fieldId === "falta" || fieldId === "fechaLimite") {
            const montoActual = fieldId === "falta" ? value : respuestas.falta;
            const fechaActual = fieldId === "fechaLimite" ? value : respuestas.fechaLimite;

            nuevasRespuestas.cuota = calcularAhorroAutomatico(montoActual, fechaActual);
        }

        setRespuestas(nuevasRespuestas);
        localStorage.setItem(storageKey, JSON.stringify({ respuestas: nuevasRespuestas }));
    };

    // Validar que todos los campos requeridos tengan valor
    const estaCompleto = () => {
        return (
            respuestas.meta?.trim() !== "" &&
            respuestas.costo?.trim() !== "" &&
            respuestas.falta?.trim() !== "" &&
            respuestas.fechaLimite?.trim() !== "" &&
            respuestas.cuota?.trim() !== "" &&
            !respuestas.cuota.includes("válida")
        );
    };

    const handleContinue = async () => {
        if (!estaCompleto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas },
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

            {/* Barra superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto" translate="no">
                
                {/* Título */}
                <div className="text-center mb-8">
                    <h1 className="font-extrabold text-blue-900 leading-tight text-3xl md:text-5xl uppercase tracking-wide">
                        {config.titulo || "META PRINCIPAL"}
                    </h1>
                    
                    {config.descripcion && (
                        <p className="text-gray-700 font-medium text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
                            {config.descripcion}
                        </p>
                    )}

                    <div className="mt-6 inline-block bg-amber-100 border-2 border-amber-300 text-amber-900 px-6 py-2 rounded-full font-bold text-lg">
                        {config.subtitulo || "Para ayudarte, completa las siguientes preguntas:"}
                    </div>
                </div>

                {/* Preguntas */}
                <div className="space-y-6 max-w-2xl mx-auto">
                    {preguntas.map((p) => {
                        const esCalculado = p.type === "auto";
                        const esFecha = p.type === "date";

                        return (
                            <div key={p.id} className="flex flex-col gap-2">
                                <label className="font-extrabold text-blue-900 text-lg md:text-xl">
                                    {p.label}
                                </label>

                                {esFecha ? (
                                    <input
                                        type="date"
                                        min={hoyStr}
                                        value={respuestas[p.id] || ""}
                                        onChange={(e) => handleChange(p.id, e.target.value)}
                                        className="w-full bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white rounded-2xl p-4 text-gray-800 font-semibold text-base md:text-lg outline-none transition-all shadow-inner cursor-pointer"
                                    />
                                ) : (
                                    <input
                                        type={p.type === "number" ? "number" : "text"}
                                        readOnly={esCalculado}
                                        value={respuestas[p.id] || ""}
                                        onChange={(e) => handleChange(p.id, e.target.value)}
                                        placeholder={p.placeholder || "Escribe tu respuesta..."}
                                        className={`w-full rounded-2xl p-4 font-semibold text-base md:text-lg transition-all shadow-inner border-2 ${
                                            esCalculado
                                                ? "bg-amber-100 border-amber-300 text-blue-900 font-bold cursor-not-allowed"
                                                : "bg-amber-50 border-amber-200 focus:border-amber-500 focus:bg-white text-gray-800 outline-none"
                                        }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Resumen e Ilustración Animada */}
                <div className="mt-10 max-w-3xl mx-auto space-y-6">

                    {/* Contenedor principal con fondo suave */}
                    <div className="bg-gradient-to-br from-amber-50 to-sky-50 rounded-3xl p-6 md:p-8 border-2 border-amber-200/80 shadow-md">
                        
                        {/* Título destacado centrando el tema */}
                        {config.destacado && (
                            <h2 className="text-2xl md:text-3xl font-black text-amber-500 uppercase tracking-wide text-center mb-6">
                                {config.destacado}
                            </h2>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            
                            {/* Mensaje de reflexión */}
                            <div className="bg-white rounded-2xl p-5 border border-sky-200 shadow-sm relative">
                                <p className="text-sky-900 font-bold text-base leading-relaxed whitespace-pre-line">
                                    {config.mensajeConclusion}
                                </p>
                                {/* Triángulo simulando un globo de diálogo hacia el personaje */}
                                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white"></div>
                            </div>

                            {/* Puntos clave */}
                            {config.puntosClave && (
                                <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
                                    <p className="font-extrabold text-blue-900 text-lg mb-2">A esta edad ya:</p>
                                    <ul className="space-y-2 text-gray-700 font-semibold">
                                        {config.puntosClave.map((punto, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-500 font-bold">✓</span>
                                                <span>{punto}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Personaje animado integrado centrando la atención abajo */}
                        <div className="flex justify-center mt-6">
                            {imagenes[0] ? (
                                <img 
                                    src={imagenes[0]} 
                                    alt="Ilustración ahorro" 
                                    className="w-48 md:w-56 h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                                />
                            ) : (
                                <div className="w-40 h-40 bg-amber-100 rounded-full flex items-center justify-center text-5xl animate-float-slow select-none shadow-md">
                                    💰
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón de Finalización */}
                <div className="mt-10 text-center">
                    <button
                        onClick={handleContinue}
                        disabled={!estaCompleto()}
                        className={`w-full md:w-2/3 py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCompleto()
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-95"
                        }`}
                    >
                        {estaCompleto() ? "Continuar" : "Selecciona fecha y completa los campos"}
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act1;