import React from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const secciones = config.secciones || [];

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
            {/* Animación flotante para las imágenes */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                .animate-float-slow {
                    animation: float-slow 4.5s ease-in-out infinite;
                }
            `}</style>

            {/* Barra superior de navegación */}
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

            {/* Tarjeta contenedora principal */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                
                {/* Encabezado */}
                <div className="bg-sky-50 border-3 border-sky-300 text-sky-950 rounded-2xl p-6 text-center shadow-sm">
                    <h1 className="text-2xl md:text-4xl font-black leading-tight uppercase tracking-wide">
                        {config.titulo || "¿Por qué es importante tener un presupuesto a tu edad?"}
                    </h1>
                </div>

                {/* Lista de Secciones */}
                <div className="space-y-8">
                    {secciones.map((s) => {
                        const esAzul = s.numero === 1 || s.numero === 3;
                        
                        // Tamaño de imagen personalizado (más grande para la 2 y la 3)
                        const tamanoImagen = (s.numero === 2 || s.numero === 3) 
                            ? "w-52 md:w-64" 
                            : "w-40 md:w-48";

                        return (
                            <div 
                                key={s.numero} 
                                className={`relative rounded-3xl p-6 md:p-8 border-3 shadow-md transition-all ${
                                    esAzul 
                                        ? "bg-sky-50/90 text-sky-950 border-sky-300" 
                                        : "bg-amber-50/90 text-amber-950 border-amber-300"
                                }`}
                            >
                                {/* Círculo con número indicador */}
                                <div className={`absolute -left-3 -top-3 w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl shadow-md border-2 ${
                                    esAzul 
                                        ? "bg-sky-400 text-white border-sky-100" 
                                        : "bg-amber-400 text-blue-950 border-amber-100"
                                }`}>
                                    {s.numero}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                    {/* Contenido de Texto */}
                                    <div className={s.imagen ? "md:col-span-8 space-y-3" : "md:col-span-12 space-y-3"}>
                                        <h2 className={`text-xl md:text-2xl font-black ${
                                            esAzul ? "text-sky-900" : "text-amber-900"
                                        }`}>
                                            {s.titulo}
                                        </h2>

                                        {s.subtitulo && (
                                            <p className="font-semibold text-gray-700">
                                                {s.subtitulo}
                                            </p>
                                        )}

                                        {s.descripcion && (
                                            <p className="font-semibold text-lg text-gray-700">
                                                {s.descripcion}
                                            </p>
                                        )}

                                        {s.puntos && (
                                            <ul className="space-y-1.5 pl-2 font-semibold text-gray-800">
                                                {s.puntos.map((punto, idx) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <span className={esAzul ? "text-sky-500 font-bold" : "text-amber-500 font-bold"}>•</span>
                                                        <span>{punto}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {s.notaPie && (
                                            <p className="italic font-bold text-gray-600 mt-1">
                                                {s.notaPie}
                                            </p>
                                        )}

                                        {s.comparativa && (
                                            <div className="bg-white/90 text-gray-800 p-4 rounded-2xl border border-sky-200 space-y-1 font-extrabold my-2 shadow-sm">
                                                <p className="text-gray-600">{s.comparativa.sin}</p>
                                                <p className="text-sky-700 text-lg">{s.comparativa.con}</p>
                                            </div>
                                        )}

                                        {s.destacado && (
                                            <div className={`mt-3 p-4 rounded-2xl font-extrabold border-l-4 shadow-sm ${
                                                esAzul 
                                                    ? "bg-white/80 border-sky-400 text-sky-950" 
                                                    : "bg-white/80 border-amber-400 text-amber-950"
                                            }`}>
                                                {s.destacado}
                                            </div>
                                        )}

                                        {s.conclusion && (
                                            <p className="text-lg font-black text-amber-600 mt-2">
                                                {s.conclusion}
                                            </p>
                                        )}
                                    </div>

                                    {/* Imagen Animada para las secciones con imagen */}
                                    {s.imagen && (
                                        <div className="md:col-span-4 flex justify-center items-center">
                                            <img
                                                src={s.imagen}
                                                alt={`Ilustración ${s.titulo}`}
                                                className={`${tamanoImagen} h-auto object-contain drop-shadow-lg animate-float-slow select-none`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Botón de Finalización */}
                <div className="pt-6 text-center">
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

export default Act03;