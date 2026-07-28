import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onComplete, onBack, rango }) => {
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

        localStorage.setItem(`act7-${rango}-${userId}`, JSON.stringify({ completada: true }));
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
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-700 to-sky-600 text-white rounded-2xl p-6 text-center shadow-md">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider">
                        {config.titulo || "Al cumplir 18 tú podrás:"}
                    </h1>
                </div>

                {/* Lista de Puntos 1 a 4 (Línea de tiempo estilizada) */}
                <div className="space-y-6 relative">
                    
                    {/* PASO 1 */}
                    {pasos[0] && (
                        <div className="bg-sky-50 rounded-3xl p-5 border-2 border-sky-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-8 flex items-center gap-4 order-2 md:order-1">
                                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                                        1
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-sky-950">
                                        {pasos[0].titulo}
                                    </h3>
                                </div>
                                <div className="md:col-span-4 flex justify-center order-1 md:order-2">
                                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 border-sky-400 overflow-hidden shadow-md animate-float-slow">
                                        <img src={pasos[0].imagen} alt={pasos[0].titulo} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 2 */}
                    {pasos[1] && (
                        <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4 flex justify-center">
                                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 border-amber-400 overflow-hidden shadow-md animate-float-slow">
                                        <img src={pasos[1].imagen} alt={pasos[1].titulo} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="md:col-span-8 flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-full bg-amber-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                                        2
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-amber-950">
                                        {pasos[1].titulo}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 3 */}
                    {pasos[2] && (
                        <div className="bg-sky-50 rounded-3xl p-5 border-2 border-sky-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-8 flex items-center gap-4 order-2 md:order-1">
                                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                                        3
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-sky-950">
                                        {pasos[2].titulo}
                                    </h3>
                                </div>
                                <div className="md:col-span-4 flex justify-center order-1 md:order-2">
                                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 border-sky-400 overflow-hidden shadow-md animate-float-slow">
                                        <img src={pasos[2].imagen} alt={pasos[2].titulo} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4 */}
                    {pasos[3] && (
                        <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4 flex justify-center">
                                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 border-amber-400 overflow-hidden shadow-md animate-float-slow">
                                        <img src={pasos[3].imagen} alt={pasos[3].titulo} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                    <div className="flex items-center gap-4">
                                        <span className="w-12 h-12 rounded-full bg-amber-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                                            4
                                        </span>
                                        <h3 className="text-xl md:text-2xl font-black text-amber-950">
                                            {pasos[3].titulo}
                                        </h3>
                                    </div>
                                    {pasos[3].subtitulo && (
                                        <p className="text-amber-800 font-bold italic text-base md:text-lg pl-16">
                                            {pasos[3].subtitulo}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* PASO 5: BLOQUE DE INE */}
                {pasos[4] && (
                    <div className="bg-sky-50 rounded-3xl p-6 md:p-8 shadow-sm border-2 border-sky-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            {/* Texto e Información INE */}
                            <div className="md:col-span-7 space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                                        5
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-blue-950 leading-snug">
                                        {pasos[4].titulo}
                                    </h3>
                                </div>

                                <ul className="space-y-2.5 pl-2 md:pl-16">
                                    {pasos[4].puntosIne?.map((item, idx) => {
                                        const esDestacado = item.includes("Caja ALIANZA");
                                        return (
                                            <li key={idx} className="flex items-start gap-2 text-base md:text-lg font-bold">
                                                <span className="text-blue-600 font-black text-lg">•</span>
                                                <span className={esDestacado ? "text-amber-600 font-extrabold" : "text-gray-800"}>
                                                    {item}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* Imagen Joven con INE */}
                            <div className="md:col-span-5 flex justify-center">
                                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white border-4 border-sky-400 p-3 shadow-lg flex items-center justify-center animate-float-slow overflow-hidden">
                                    <img 
                                        src={pasos[4].imagen} 
                                        alt="Tramitar INE" 
                                        className="w-full h-full object-cover rounded-full select-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

export default Act07;