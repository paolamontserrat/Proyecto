import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const pasos = config.pasos || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";

    const handleContinue = async () => {
        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { leido: true },
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado localmente", err);
            }
        }
        
        localStorage.setItem(`act3-${rango}-${userId}`, JSON.stringify({ completada: true }));
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

            {/* Navegación superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
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

            {/* Contenedor principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-10" translate="no">
                
                {/* Banner Header */}
                <div className="bg-gradient-to-r from-sky-600 to-blue-800 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "¿CÓMO ELABORAR MI PRIMER PRESUPUESTO?"}
                    </h1>
                </div>

                {/* PASO 1 */}
                {pasos[0] && (
                    <div className="bg-amber-50 rounded-3xl p-6 md:p-8 border-3 border-amber-300 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            <div className="md:col-span-5 flex justify-center order-2 md:order-1">
                                <img 
                                    src={pasos[0].imagen} 
                                    alt="Ilustración Paso 1" 
                                    className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                                />
                            </div>

                            <div className="md:col-span-7 space-y-4 order-1 md:order-2">
                                <div className="flex items-start gap-3">
                                    <span className="text-5xl font-black text-sky-500 leading-none">1</span>
                                    <div className="bg-sky-400 text-white p-4 rounded-2xl shadow-md -rotate-1">
                                        <p className="font-extrabold text-lg md:text-xl">
                                            {pasos[0].instruccion}
                                        </p>
                                        <p className="text-sm text-sky-100 font-semibold mt-1">
                                            {pasos[0].detalle}
                                        </p>
                                    </div>
                                </div>

                                {pasos[0].ejemplo && (
                                    <div className="bg-white border-2 border-dashed border-sky-300 rounded-2xl p-5 shadow-inner space-y-2">
                                        <p className="font-black text-sky-900 text-center tracking-wider text-sm">EJEMPLO:</p>
                                        {pasos[0].ejemplo.filas.map((f, idx) => (
                                            <div key={idx} className="flex justify-between text-sm md:text-base font-bold text-gray-700 border-b border-gray-100 pb-1">
                                                <span>{f.concepto}</span>
                                                <span className="text-sky-800">{f.monto}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-black text-base md:text-lg text-amber-600 pt-2 border-t-2 border-amber-400">
                                            <span>{pasos[0].ejemplo.totalLabel}</span>
                                            <span>{pasos[0].ejemplo.totalMonto}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* PASO 2 */}
                {pasos[1] && (
                    <div className="bg-sky-50 rounded-3xl p-6 md:p-8 border-3 border-sky-300 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            <div className="md:col-span-7 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-5xl font-black text-lime-600 leading-none">2</span>
                                    <div className="bg-lime-400 text-blue-950 p-4 rounded-2xl shadow-md rotate-1">
                                        <p className="font-extrabold text-lg md:text-xl">
                                            {pasos[1].instruccion}
                                        </p>
                                        <p className="text-sm font-bold text-blue-900 mt-1">
                                            {pasos[1].detalle}
                                        </p>
                                    </div>
                                </div>

                                {pasos[1].ejemplo && (
                                    <div className="bg-white border-2 border-dashed border-lime-400 rounded-2xl p-5 shadow-inner space-y-2">
                                        <p className="font-black text-lime-700 text-center tracking-wider text-sm">EJEMPLO:</p>
                                        {pasos[1].ejemplo.filas.map((f, idx) => (
                                            <div key={idx} className="flex justify-between text-sm md:text-base font-bold text-gray-700 border-b border-gray-100 pb-1">
                                                <span>{f.concepto}</span>
                                                <span className="text-gray-900">{f.monto}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-black text-base md:text-lg text-amber-600 pt-2 border-t-2 border-amber-400">
                                            <span>{pasos[1].ejemplo.totalLabel}</span>
                                            <span>{pasos[1].ejemplo.totalMonto}</span>
                                        </div>

                                        {pasos[1].preguntas && (
                                            <div className="pt-3 text-xs md:text-sm font-extrabold text-blue-900 space-y-1">
                                                <p>Ahora te preguntas:</p>
                                                {pasos[1].preguntas.map((p, idx) => (
                                                    <p key={idx} className="text-sky-700 font-bold">• {p}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-5 flex justify-center">
                                <img 
                                    src={pasos[1].imagen} 
                                    alt="Ilustración Paso 2" 
                                    className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* PASO 3 */}
                {pasos[2] && (
                    <div className="bg-amber-50 rounded-3xl p-6 md:p-8 border-3 border-amber-300 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            <div className="md:col-span-5 flex justify-center order-2 md:order-1">
                                <img 
                                    src={pasos[2].imagen} 
                                    alt="Ilustración Paso 3" 
                                    className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                                />
                            </div>

                            <div className="md:col-span-7 space-y-4 order-1 md:order-2">
                                <div className="flex items-start gap-3">
                                    <span className="text-6xl font-black text-amber-500 leading-none">3</span>
                                    <div className="bg-amber-300 text-blue-950 p-6 rounded-3xl shadow-lg border-2 border-amber-400 rotate-1 space-y-3">
                                        <h3 className="font-black text-xl md:text-2xl text-blue-950">
                                            {pasos[2].instruccion}
                                        </h3>
                                        <div className="bg-white/80 p-3 rounded-2xl border border-amber-400">
                                            <p className="font-extrabold text-amber-900 text-sm md:text-base">
                                                {pasos[2].regla}
                                            </p>
                                        </div>
                                        <p className="font-bold text-blue-900 text-sm md:text-base leading-relaxed">
                                            {pasos[2].ejemploAhorro}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* PASO 4 */}
                {pasos[3] && (
                    <div className="bg-sky-50 rounded-3xl p-6 md:p-8 border-3 border-sky-300 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            {/* Contenido Izquierda Paso 4 */}
                            <div className="md:col-span-7 space-y-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-6xl font-black text-red-500 leading-none">4</span>
                                    <div className="bg-red-400 text-blue-950 p-4 rounded-2xl shadow-md rotate-1">
                                        <h3 className="text-xl md:text-2xl font-black text-sky-950 uppercase">
                                            {pasos[3].instruccion}
                                        </h3>
                                        <p className="text-sky-700 font-bold text-sm">
                                            {pasos[3].subtitulo}
                                        </p>
                                    </div>
                                </div>

                                {/* Tabla de Distribución */}
                                <div className="bg-white rounded-2xl p-4 border-2 border-sky-200 shadow-sm space-y-3">
                                    <div className="grid grid-cols-2 text-center font-black text-sm text-sky-900 border-b border-sky-100 pb-2">
                                        <span>Categoría</span>
                                        <span>Ejemplo</span>
                                    </div>
                                    {pasos[3].distribucion?.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-2 text-center font-bold text-gray-700 text-sm md:text-base">
                                            <span className="text-left pl-4">{item.categoria}</span>
                                            <span className="text-sky-700">{item.porcentaje}</span>
                                        </div>
                                    ))}

                                    {/* Ejemplo Desglosado */}
                                    {pasos[3].ejemploCalculo && (
                                        <div className="pt-3 border-t border-dashed border-sky-200 mt-2 space-y-1">
                                            <p className="font-black text-xs text-sky-900 uppercase">
                                                {pasos[3].ejemploCalculo.titulo}
                                            </p>
                                            {pasos[3].ejemploCalculo.filas?.map((f, idx) => (
                                                <div key={idx} className="flex justify-between px-2 text-xs md:text-sm font-extrabold text-gray-700">
                                                    <span>{f.cat}</span>
                                                    <span>{f.pct} ➔ <strong className="text-amber-600">{f.monto}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Post-it Reflexión Final */}
                                {pasos[3].reflexion && (
                                    <div className="bg-amber-300 text-blue-950 p-5 rounded-2xl shadow-md border-2 border-amber-400 rotate-1 space-y-2">
                                        {pasos[3].reflexion.map((ref, idx) => (
                                            <p key={idx} className="font-extrabold text-sm md:text-base">
                                                {ref}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Imagen Personaje 4 (12.png) */}
                            <div className="md:col-span-5 flex justify-center">
                                <img 
                                    src={pasos[3].imagen} 
                                    alt="Ilustración Paso 4" 
                                    className="w-full max-w-[250px] md:max-w-[300px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* Botón Finalizar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Actividad
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act04;