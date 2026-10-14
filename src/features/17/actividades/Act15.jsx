import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act15 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estado para guardar las opciones seleccionadas
    const [checksIntereses, setChecksIntereses] = useState([]);
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act15-${rango}-${userId}`;

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
                        if (d.checksIntereses) setChecksIntereses(d.checksIntereses);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.checksIntereses) setChecksIntereses(d.checksIntereses);
                    }
                }
            } catch (err) {
                console.warn("Error cargando progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Alternar selección de casilla
    const handleToggleCheck = (id) => {
        const nuevaLista = checksIntereses.includes(id)
            ? checksIntereses.filter((item) => item !== id)
            : [...checksIntereses, id];

        setChecksIntereses(nuevaLista);
        localStorage.setItem(storageKey, JSON.stringify({ checksIntereses: nuevaLista }));
    };

    // Reiniciar selección
    const handleReset = () => {
        setChecksIntereses([]);
        localStorage.removeItem(storageKey);
    };

    // Finalizar actividad y módulo
    const handleContinue = async () => {
        const datosAGuardar = {
            checksIntereses,
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

    // Al menos 1 opción seleccionada para mostrar el cierre y habilitar el botón
    const todoCompletado = checksIntereses.length > 0;

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

            {/* Contenedor Principal (Actividad Impar: Azul Oscuro con Bordes Amarillos) */}
            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-10 max-w-4xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* Título y Encabezado */}
                {data?.titulo && (
                    <div className="text-center space-y-2">
                        <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                            {data.titulo}
                        </h1>
                    </div>
                )}

                {/* Contenido principal en dos columnas (Imagen e Intereses) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                    {/* Columna Izquierda: Imagen de la Cooperativa */}
                    {data?.imagen && (
                        <div className="flex justify-center">
                            <img
                                src={data.imagen}
                                alt="Caja Popular Alianza"
                                className="max-h-80 object-contain rounded-2xl border-2 border-yellow-400/30 shadow-xl animate-float-slow"
                            />
                        </div>
                    )}

                    {/* Columna Derecha: Opciones Checkbox */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            {data?.subtitulo && (
                                <span className="text-sm font-bold text-yellow-300 uppercase tracking-wider block">
                                    {data.subtitulo}
                                </span>
                            )}
                            {data?.pregunta && (
                                <h2 className="text-lg md:text-xl font-black uppercase text-white">
                                    {data.pregunta}
                                </h2>
                            )}
                        </div>

                        {/* Lista de Checkboxes */}
                        <div className="space-y-2.5">
                            {data?.opciones?.map((opc) => {
                                const checked = checksIntereses.includes(opc.id);
                                return (
                                    <button
                                        key={opc.id}
                                        type="button"
                                        onClick={() => handleToggleCheck(opc.id)}
                                        className={`w-full p-3.5 rounded-2xl border-2 font-bold text-xs md:text-sm text-left transition-all flex items-center gap-3 shadow ${
                                            checked
                                                ? "bg-yellow-400 text-blue-950 border-yellow-500 font-black scale-102"
                                                : "bg-blue-950 text-white border-blue-700 hover:border-yellow-400"
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded flex items-center justify-center font-black border flex-shrink-0 ${
                                            checked ? "bg-blue-950 text-yellow-300 border-blue-950" : "bg-blue-900 border-blue-600"
                                        }`}>
                                            {checked ? "✓" : ""}
                                        </span>
                                        <span>{opc.texto}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DESPLEGABLE DE CIERRE Y HABILIDADES DESBLOQUEADAS */}
                {todoCompletado && data?.cierre && (
                    <div className="space-y-8 pt-4">

                        {/* Tarjeta de Celebración Superior */}
                        <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl text-center space-y-3 relative overflow-hidden">
                            <div className="flex justify-between items-center text-2xl md:text-4xl">
                                <span>🏁</span>
                                <h2 className="text-xl md:text-3xl font-black text-blue-900 uppercase tracking-wide">
                                    {data.cierre.titulo}
                                </h2>
                                <span>🏁</span>
                            </div>
                            <p className="text-sm md:text-base font-semibold text-slate-700 max-w-2xl mx-auto leading-relaxed">
                                {data.cierre.mensaje}
                            </p>
                        </div>

                        {/* Cuaderno de Habilidades Desbloqueadas */}
                        <div className="bg-amber-50 text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-amber-300 shadow-2xl space-y-6 relative">
                            {/* Anillos superiores del cuaderno */}
                            <div className="flex justify-around -mt-10 md:-mt-12 mb-2">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="w-3 h-6 bg-slate-400 rounded-full border-2 border-slate-600 shadow-inner"></div>
                                ))}
                            </div>

                            {/* Encabezado Habilidades */}
                            <div className="text-center">
                                <span className="bg-yellow-400 text-blue-950 px-8 py-2.5 rounded-full text-xl md:text-2xl font-black uppercase border-2 border-yellow-500 shadow-md inline-block">
                                    {data.cierre.tituloHabilidades}
                                </span>
                            </div>

                            {/* Grilla de 9 Habilidades */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                {data.cierre.habilidades?.map((hab) => (
                                    <div
                                        key={hab.id}
                                        className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow flex items-center gap-3 font-extrabold text-xs md:text-sm text-blue-950"
                                    >
                                        <span className="text-2xl flex-shrink-0">{hab.icono}</span>
                                        <span>{hab.texto}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Personaje decorativo en la esquina inferior derecha */}
                            {data.cierre.imagenPersonaje && (
                                <div className="flex justify-end pt-2">
                                    <img
                                        src={data.cierre.imagenPersonaje}
                                        alt="Alianzito feliz"
                                        className="max-h-36 object-contain animate-bounce-gentle"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y FINALIZAR MÓDULO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!todoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !todoCompletado
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act15;