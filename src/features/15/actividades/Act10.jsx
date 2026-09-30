import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Secciones del JSON
    const secIntro = data?.secciones?.introduccion;
    const secTabla = data?.secciones?.tablaPlanificacion;
    const secTip = data?.secciones?.tipFinanciero;

    // Filas iniciales dinámicas desde el JSON
    const filasIniciales = secTabla?.filasDefecto || [
        { semana: "semana 1", recibo: "", gastos: "", ahorro: "", cuidado: "" },
        { semana: "semana 2", recibo: "", gastos: "", ahorro: "", cuidado: "" },
        { semana: "semana 3", recibo: "", gastos: "", ahorro: "", cuidado: "" },
        { semana: "semana 4", recibo: "", gastos: "", ahorro: "", cuidado: "" },
    ];

    const [filas, setFilas] = useState(filasIniciales);
    const [respuestasPreguntas, setRespuestasPreguntas] = useState({});

    const [actividadCompletada, setActividadCompletada] = useState(false);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act10-${rango}-${userId}`;

    // 1. CARGA DE PROGRESO
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
                        const datos = progreso.datos_actividad;
                        if (datos.filas) setFilas(datos.filas);
                        if (datos.respuestasPreguntas) setRespuestasPreguntas(datos.respuestasPreguntas);
                        if (datos.actividadCompletada !== undefined) setActividadCompletada(datos.actividadCompletada);

                        localStorage.setItem(storageKey, JSON.stringify(datos));
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const guardadoLocal = localStorage.getItem(storageKey);
                    if (guardadoLocal) {
                        const parsed = JSON.parse(guardadoLocal);
                        if (parsed.filas) setFilas(parsed.filas);
                        if (parsed.respuestasPreguntas) setRespuestasPreguntas(parsed.respuestasPreguntas);
                        if (parsed.actividadCompletada !== undefined) setActividadCompletada(parsed.actividadCompletada);
                    }
                }
            } catch (err) {
                console.warn("Error al cargar progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // 2. GUARDADO EN LOCALSTORAGE
    useEffect(() => {
        if (cargandoProgreso) return;

        const datosAGuardar = {
            filas,
            respuestasPreguntas,
            actividadCompletada,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));
    }, [filas, respuestasPreguntas, actividadCompletada, cargandoProgreso, storageKey]);

    // Manejo de cambios en la tabla
    const handleInputChange = (index, campo, valor) => {
        const nuevasFilas = [...filas];
        nuevasFilas[index][campo] = valor;
        setFilas(nuevasFilas);
        verificarCompletado(nuevasFilas, respuestasPreguntas);
    };

    // Manejo de cambios en las preguntas
    const handlePreguntaChange = (idPregunta, valor) => {
        const nuevasRespuestas = {
            ...respuestasPreguntas,
            [idPregunta]: valor,
        };
        setRespuestasPreguntas(nuevasRespuestas);
        verificarCompletado(filas, nuevasRespuestas);
    };

    const verificarCompletado = (currentFilas, currentRespuestas) => {
        const algunDatoTabla = currentFilas.some(
            (f) => f.recibo !== "" || f.gastos !== "" || f.ahorro !== "" || f.cuidado !== ""
        );
        const algunaRespuesta = Object.values(currentRespuestas).some((val) => val && val.trim() !== "");

        if (algunDatoTabla || algunaRespuesta) {
            setActividadCompletada(true);
        }
    };

    const handleReset = () => {
        setFilas(filasIniciales);
        setRespuestasPreguntas({});
        setActividadCompletada(false);
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            filas,
            respuestasPreguntas,
            actividadCompletada: true,
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

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
                console.warn("Offline, guardado en LocalStorage", err);
            }
        }

        onComplete();
    };

    return (
        <LayoutActividad fondo={data?.fondo || "bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600"}>
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
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="bg-blue-950 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-950 text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-8" translate="no">

                {/* 1. SECCIÓN INTRODUCCIÓN */}
                {secIntro && (
                    <div className="bg-blue-950 backdrop-blur-md rounded-3xl p-6 md:p-8 border-4 border-yellow-400 shadow-2xl text-white space-y-6">
                        <h1 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase tracking-wide text-center drop-shadow-md">
                            {secIntro.titulo}
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {secIntro.imagenAlianzito && (
                                <div className="flex justify-center md:col-span-1">
                                    <img
                                        src={secIntro.imagenAlianzito}
                                        alt="Alianzito"
                                        className="w-44 md:w-52 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 animate-bounce-gentle"
                                    />
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-4">
                                <p className="text-base md:text-lg text-yellow-300 font-extrabold leading-relaxed">
                                    {secIntro.mensajeGeneral}
                                </p>
                                <div className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed bg-blue-900/60 p-4 rounded-2xl border border-blue-700 space-y-2">
                                    <p>{secIntro.mensajeDetalle}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SECCIÓN TABLA: PLANIFICO MIS SEMANAS */}
                {secTabla && (
                    <div className="bg-blue-900 rounded-3xl p-4 md:p-6 border-4 border-yellow-400 shadow-2xl space-y-6 text-white">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-2xl font-black text-yellow-300 uppercase">
                                {secTabla.titulo}
                            </h2>
                            <p className="text-xs md:text-sm font-medium text-blue-100 leading-relaxed">
                                <strong>Instrucciones:</strong> {secTabla.instrucciones}
                            </p>
                        </div>

                        {/* Tabla de Registro */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[650px] space-y-3">
                                {/* Encabezados dinámicos */}
                                {secTabla.columnas && (
                                    <div className="grid grid-cols-5 gap-2 text-center font-bold text-xs md:text-sm text-blue-950">
                                        {secTabla.columnas.map((col, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-full flex items-center justify-center shadow">
                                                {col}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Filas */}
                                {filas.map((fila, index) => (
                                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                                        <div className="bg-white text-blue-950 font-bold p-3 rounded-full text-center text-xs md:text-sm shadow">
                                            {fila.semana}
                                        </div>

                                        {/* Dinero Recibido */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900 font-bold text-sm">$</span>
                                            <input
                                                type="number"
                                                value={fila.recibo}
                                                onChange={(e) => handleInputChange(index, "recibo", e.target.value)}
                                                className="w-full bg-white text-blue-950 pl-7 pr-3 py-2.5 rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow"
                                            />
                                        </div>

                                        {/* Gastos */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900 font-bold text-sm">$</span>
                                            <input
                                                type="number"
                                                value={fila.gastos}
                                                onChange={(e) => handleInputChange(index, "gastos", e.target.value)}
                                                className="w-full bg-white text-blue-950 pl-7 pr-3 py-2.5 rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow"
                                            />
                                        </div>

                                        {/* Dinero Ahorrado */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900 font-bold text-sm">$</span>
                                            <input
                                                type="number"
                                                value={fila.ahorro}
                                                onChange={(e) => handleInputChange(index, "ahorro", e.target.value)}
                                                className="w-full bg-white text-blue-950 pl-7 pr-3 py-2.5 rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow"
                                            />
                                        </div>

                                        {/* ¿En qué debó cuidar mi dinero? */}
                                        <div>
                                            <input
                                                type="text"
                                                value={fila.cuidado}
                                                onChange={(e) => handleInputChange(index, "cuidado", e.target.value)}
                                                className="w-full bg-white text-blue-950 px-3 py-2.5 rounded-full font-semibold text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preguntas Finales Dinámicas */}
                        {secTabla.preguntas && (
                            <div className="pt-4 space-y-4">
                                <h3 className="font-extrabold text-yellow-300 text-sm md:text-base">
                                    Al terminar, responde:
                                </h3>

                                {secTabla.preguntas.map((preg) => (
                                    <div key={preg.id} className="space-y-2">
                                        <label className="block text-xs md:text-sm font-bold">
                                            {preg.label}
                                        </label>
                                        <input
                                            type="text"
                                            value={respuestasPreguntas[preg.id] || ""}
                                            onChange={(e) => handlePreguntaChange(preg.id, e.target.value)}
                                            className="w-full bg-white text-blue-950 px-4 py-2.5 rounded-full font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TIP FINANCIERO */}
                {secTip && (
                    <section className="space-y-6 pt-2">
                        <div className="bg-blue-900 rounded-3xl border-4 border-amber-400 p-6 md:p-8 text-white shadow-2xl text-center space-y-6 max-w-xl mx-auto overflow-hidden">
                            <h2 className="text-2xl md:text-3xl font-black tracking-wider text-yellow-300 uppercase">
                                {secTip.titulo}
                            </h2>

                            {secTip.imagen && (
                                <div className="flex justify-center">
                                    <img
                                        src={secTip.imagen}
                                        alt="Tip Financiero"
                                        className="w-64 md:w-80 object-contain drop-shadow-2xl animate-bounce-gentle"
                                    />
                                </div>
                            )}

                            <p className="text-base md:text-lg font-bold text-sky-100 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-blue-700">
                                {secTip.mensaje}
                            </p>
                        </div>
                    </section>
                )}

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 max-w-4xl mx-auto">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!actividadCompletada}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !actividadCompletada
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
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

export default Act10;