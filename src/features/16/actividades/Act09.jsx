import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const intro = config.introduccion || {};
    const beneficios = config.beneficios || [];

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

        localStorage.setItem(`act9-${rango}-${userId}`, JSON.stringify({ completada: true }));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
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
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-10" translate="no">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "¿Qué es la aportación social?"}
                    </h1>
                </div>

                {/* SECCIÓN 1: Concepto Inicial */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border-3 border-amber-300 shadow-md space-y-6">
                    <div className="bg-white border-l-8 border-amber-500 p-5 rounded-r-2xl shadow-sm">
                        <p className="text-base md:text-xl font-bold text-gray-800 leading-relaxed">
                            {intro.definicion}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                        {/* Personaje Socio (38.png) */}
                        <div className="md:col-span-5 flex justify-center">
                            <img 
                                src={intro.personaje} 
                                alt="Socio con tarjeta" 
                                className="w-full max-w-[220px] md:max-w-[260px] h-auto object-contain drop-shadow-xl animate-float-slow select-none"
                            />
                        </div>

                        {/* Infografía $1,000 (39.png) */}
                        <div className="md:col-span-7 flex justify-center">
                            <div className="animate-float-slow">
                                <img 
                                    src={intro.montoGrafico} 
                                    alt="Aportación de $1,000" 
                                    className="w-full h-full object-contain select-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nota de devolución */}
                    <div className="bg-amber-500 text-white p-4 rounded-2xl text-center shadow-md">
                        <p className="text-base md:text-lg font-black italic">
                            “{intro.notaFooter}”
                        </p>
                    </div>
                </div>

                {/* SECCIÓN 2: Título de Beneficios */}
                <div className="bg-sky-900 text-white rounded-2xl p-6 text-center shadow-md">
                    <h2 className="text-lg md:text-2xl font-black leading-snug">
                        {config.subtituloBeneficios}
                    </h2>
                </div>

                {/* SECCIÓN 3: Grid de 6 Beneficios */}
                <div className="space-y-6">
                    {beneficios.map((item, index) => {
                        const esIzquierda = item.posicion === "izquierda";
                        const esModuloAzul = index >= 3; // Beneficios 4, 5 y 6 (App, Medio Ambiente, Comunidad)

                        return (
                            <div 
                                key={item.id}
                                className={`rounded-3xl p-5 border-2 shadow-sm transition-all ${
                                    esModuloAzul 
                                        ? "bg-blue-50 border-blue-200" 
                                        : "bg-amber-50 border-amber-200"
                                }`}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    
                                    {/* Imagen Círculo */}
                                    <div className={`md:col-span-4 flex justify-center ${
                                        esIzquierda ? "order-1" : "order-1 md:order-2"
                                    }`}>
                                        <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 shadow-md overflow-hidden animate-float-slow shrink-0 ${
                                            esModuloAzul ? "border-blue-500" : "border-amber-400"
                                        }`}>
                                            <img 
                                                src={item.imagen} 
                                                alt={item.texto} 
                                                className="w-full h-full object-cover select-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Texto del beneficio */}
                                    <div className={`md:col-span-8 flex items-center ${
                                        esIzquierda ? "order-2" : "order-2 md:order-1"
                                    }`}>
                                        <div className={`bg-white p-5 rounded-2xl shadow-sm w-full border-l-8 ${
                                            esModuloAzul ? "border-blue-600" : "border-amber-500"
                                        }`}>
                                            <p className={`text-base md:text-xl font-bold leading-snug ${
                                                esModuloAzul ? "text-blue-950" : "text-amber-950"
                                            }`}>
                                                {item.texto}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Botón Continuar */}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleContinue}
                        className="w-full md:w-2/3 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act09;