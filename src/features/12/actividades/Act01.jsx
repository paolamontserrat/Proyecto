import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const seccionInfo = config.seccionInformativa || {};
    const puntos = seccionInfo.puntos || [];
    const seccionInter = config.seccionInteractiva || {};
    const filas = seccionInter.filas || [];

    // Estado del carrusel/diapositivas para los 4 puntos
    const [diapositivaActual, setDiapositivaActual] = useState(0);

    // Estado de la sección interactiva (inputs del usuario)
    const [respuestas, setRespuestas] = useState({
        ahorro: { monto: "", meta: "" },
        gustos: { monto: "", meta: "" },
        compartir: { monto: "", meta: "" }
    });

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act01-${rango}-${userId}`;

    // Cargar avance desde Supabase / LocalStorage
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

                    if (progreso?.datos_actividad?.respuestas) {
                        setRespuestas(progreso.datos_actividad.respuestas);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ respuestas: progreso.datos_actividad.respuestas })
                        );
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando de Supabase, intentando LocalStorage...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestas) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.error("Error al parsear LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId, storageKey]);

    const handleInputChange = (filaId, campo, valor) => {
        const nuevasRespuestas = {
            ...respuestas,
            [filaId]: {
                ...respuestas[filaId],
                [campo]: valor
            }
        };
        setRespuestas(nuevasRespuestas);
        localStorage.setItem(storageKey, JSON.stringify({ respuestas: nuevasRespuestas }));

        if (userId !== "anon" && config.id) {
            supabase.from("progreso_actividades").upsert(
                {
                    usuario_id: userId,
                    actividad_id: config.id,
                    datos_actividad: { respuestas: nuevasRespuestas, completado: false },
                    completada: false
                },
                { onConflict: "usuario_id,actividad_id" }
            ).then();
        }
    };

    // Validar si el usuario calculó bien los 3 montos ($250, $150, $100) y redactó una meta
    const esCorrectoYCompleto = () => {
        return filas.every((fila) => {
            const res = respuestas[fila.id];
            if (!res) return false;
            const montoValido = parseInt(res.monto, 10) === fila.montoEsperado;
            const metaValida = res.meta.trim().length > 0;
            return montoValido && metaValida;
        });
    };

    const handleReset = async () => {
        const resInicial = {
            ahorro: { monto: "", meta: "" },
            gustos: { monto: "", meta: "" },
            compartir: { monto: "", meta: "" }
        };
        setRespuestas(resInicial);
        setDiapositivaActual(0);
        localStorage.removeItem(storageKey);

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas: resInicial, completado: false },
                        completada: false
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error al reiniciar en Supabase", err);
            }
        }
    };

    const handleContinue = async () => {
        if (!esCorrectoYCompleto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { respuestas, completado: true },
                        completada: true
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado en local", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Estilos de animación personalizados */}
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
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Vertical de la Actividad */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative space-y-8" translate="no">
                
                {/* 1. TÍTULO Y SECCIÓN INFORMATIVA SUPERIOR */}
                <div className="space-y-6 text-center max-w-4xl mx-auto">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <h1 className="font-extrabold text-blue-900 leading-tight text-2xl md:text-4xl tracking-wide uppercase">
                            {config.titulo}
                        </h1>
                        {config.imagen_moneda_carro && (
                            <img
                                src={config.imagen_moneda_carro}
                                alt="Moneda en carro"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow animate-float-slow"
                            />
                        )}
                    </div>

                    <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-100 text-gray-800 text-base md:text-xl font-bold leading-relaxed">
                        {seccionInfo.introduccion}
                    </div>

                    <div className="bg-gradient-to-r from-blue-900 to-sky-600 text-white p-6 rounded-3xl shadow-md space-y-3 relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                        <div className="space-y-2 text-left z-10">
                            <p className="text-base md:text-lg font-medium">{seccionInfo.previo}</p>
                            <p className="text-lg md:text-2xl font-black text-amber-300">{seccionInfo.subtitulo}</p>
                        </div>
                        {/* Imagen Moneda Subiendo la Montaña (6.png) */}
                        {seccionInfo.imagen_moneda_monta && (
                            <img
                                src={seccionInfo.imagen_moneda_monta}
                                alt="Moneda subiendo montaña"
                                className="w-32 h-32 md:w-40 md:h-40 object-contain mt-4 md:mt-0 z-10 shrink-0 animate-bounce-gentle"
                            />
                        )}
                    </div>
                </div>

                {/* 2. SLIDER / DIAPOSITIVAS PARA LOS 4 PUNTOS CLAVE */}
                {puntos.length > 0 && (
                    <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-950 to-blue-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-sky-300 relative">
                        
                        {/* Indicador de Diapositiva */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="bg-amber-400 text-blue-950 font-black px-3 py-1 rounded-full text-xs md:text-sm">
                                Punto {diapositivaActual + 1} de {puntos.length}
                            </span>
                            <div className="flex space-x-2">
                                {puntos.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setDiapositivaActual(idx)}
                                        className={`w-3 h-3 rounded-full transition-all ${
                                            idx === diapositivaActual ? "bg-amber-400 w-6" : "bg-sky-700"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Contenido de la Diapositiva Actual */}
                        <div className="flex flex-col md:flex-row items-center gap-6 min-h-[200px] py-4">
                            {puntos[diapositivaActual].imagen && (
                                <img
                                    src={puntos[diapositivaActual].imagen}
                                    alt={puntos[diapositivaActual].titulo}
                                    className="w-28 h-28 md:w-36 md:h-36 object-contain bg-white/10 p-3 rounded-2xl backdrop-blur-sm shrink-0"
                                />
                            )}
                            <div className="space-y-3 text-center md:text-left">
                                <h3 className="text-xl md:text-3xl font-black text-amber-300 tracking-wider">
                                    {puntos[diapositivaActual].id}. {puntos[diapositivaActual].titulo}
                                </h3>
                                <p className="text-base md:text-xl font-medium text-sky-100 leading-relaxed">
                                    {puntos[diapositivaActual].texto}
                                </p>
                            </div>
                        </div>

                        {/* Botones de Navegación del Carrusel */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-sky-800">
                            <button
                                onClick={() => setDiapositivaActual((prev) => Math.max(0, prev - 1))}
                                disabled={diapositivaActual === 0}
                                className={`px-5 py-2 rounded-full font-bold text-sm md:text-base transition ${
                                    diapositivaActual === 0
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-40"
                                        : "bg-sky-500 hover:bg-sky-400 text-white shadow"
                                }`}
                            >
                                ← Anterior
                            </button>

                            <button
                                onClick={() => setDiapositivaActual((prev) => Math.min(puntos.length - 1, prev + 1))}
                                disabled={diapositivaActual === puntos.length - 1}
                                className={`px-5 py-2 rounded-full font-bold text-sm md:text-base transition ${
                                    diapositivaActual === puntos.length - 1
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-40"
                                        : "bg-amber-400 hover:bg-amber-300 text-blue-950 shadow"
                                }`}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. SECCIÓN INTERACTIVA: EL RETO DE LOS $500 */}
                <div className="max-w-4xl mx-auto pt-6 border-t-2 border-sky-100 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <h2 className="font-extrabold text-blue-950 text-2xl md:text-3xl">
                                {seccionInter.titulo || "El Reto de los $500"}
                            </h2>
                            {seccionInter.imagen_alianzito && (
                                <img
                                    src={seccionInter.imagen_alianzito}
                                    alt="Alianzito"
                                    className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow animate-float-slow"
                                />
                            )}
                        </div>
                        <p className="text-gray-700 font-semibold text-base md:text-lg">
                            {seccionInter.introduccion}
                        </p>
                        <p className="text-blue-900 font-bold text-base md:text-lg">
                            {seccionInter.instruccion}
                        </p>
                    </div>

                    {/* Tabla Interactiva */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[550px]">
                            <thead>
                                <tr className="bg-blue-900 text-white text-xs md:text-sm uppercase tracking-wider text-center">
                                    <th className="p-4 rounded-tl-2xl">¿A dónde va?</th>
                                    <th className="p-4 text-center">Porcentaje</th>
                                    <th className="p-4 text-center">Cantidad ($)</th>
                                    <th className="p-4 rounded-tr-2xl">¿Para qué exactamente lo vas a usar?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-100 bg-sky-50/50">
                                {filas.map((fila) => {
                                    const res = respuestas[fila.id] || { monto: "", meta: "" };
                                    const esMontoCorrecto = parseInt(res.monto, 10) === fila.montoEsperado;

                                    return (
                                        <tr key={fila.id} className="hover:bg-sky-100/50 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-blue-950 text-base">{fila.categoria}</div>
                                                <div className="text-xs text-gray-500 font-medium">{fila.subtexto}</div>
                                            </td>
                                            <td className="p-4 text-center font-black text-xl text-blue-900">
                                                {fila.porcentaje}%
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="relative flex items-center justify-center">
                                                    <span className="absolute left-4 text-gray-500 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={res.monto}
                                                        onChange={(e) => handleInputChange(fila.id, "monto", e.target.value)}
                                                        placeholder="0"
                                                        className={`w-28 pl-8 pr-3 py-2 rounded-xl border-2 font-bold text-center text-lg outline-none transition ${
                                                            res.monto === ""
                                                                ? "border-gray-300 focus:border-blue-500"
                                                                : esMontoCorrecto
                                                                ? "border-green-500 bg-green-50 text-green-900"
                                                                : "border-red-400 bg-red-50 text-red-900"
                                                        }`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    value={res.meta}
                                                    onChange={(e) => handleInputChange(fila.id, "meta", e.target.value)}
                                                    placeholder="Escribe tu meta..."
                                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 text-sm md:text-base font-semibold outline-none bg-white shadow-sm"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. BOTONES DE CONTROL Y REINICIO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esCorrectoYCompleto()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !esCorrectoYCompleto()
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

export default Act01;