import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const [dibujoValido, setDibujoValido] = useState(false);
    const [datosDibujo, setDatosDibujo] = useState([]);

    // --- OBTENER USUARIO ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act08-${rango}-${userId}`;

    // Callback que recibe el estado del dibujo desde TipoDibujar
    const handleDibujoChange = (estadoCanvas) => {
        setDibujoValido(estadoCanvas.tieneDibujo);
        setDatosDibujo(estadoCanvas.dataDibujo);
    };

    // Al continuar, forzamos un guardado final en Supabase y avanzamos
    const handleContinue = async () => {
        localStorage.setItem(storageKey, JSON.stringify({ dibujo: datosDibujo }));

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { dibujo: datosDibujo },
                        completada: true,
                    },
                    {
                        onConflict: "usuario_id,actividad_id",
                    }
                );
            } catch (err) {
                console.warn("Offline, guardado localmente en local storage primero", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Barra de navegación superior */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Tarjeta de Contenido Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                
                {/* Títulos */}
                <div className="text-center mb-6">
                    <h1
                        className="font-extrabold text-blue-900 leading-tight"
                        style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.3rem)" }}
                    >
                        {config.titulo || 'Alianzito ayúdanos a completar: "La decisión consciente"'}
                    </h1>
                    <p className="text-lg md:text-xl font-semibold text-sky-600 mt-2">
                        {config.subtitulo || "(Reinicia la escena correctamente)"}
                    </p>
                </div>

                {/* Contenedor del Lienzo */}
                <div className="max-w-4xl mx-auto rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden relative">
                    {/* Componente de Dibujo interactivo */}
                    <div className="relative z-10 opacity-90">
                        <TipoDibujar
                            userId={userId}
                            actividadId={config.id}
                            onChange={handleDibujoChange}
                            gestionarPropio={true}
                            canalId="act08-canal"
                        />
                    </div>
                </div>

                {/* Indicador de ayuda para el usuario */}
                <p className="text-center text-sm font-bold text-gray-500 mt-4 italic">
                    ¡Usa los colores de arriba a la izquierda para dibujar las mejores decisiones en cada viñeta!
                </p>

                {/* Botón de Guardar e Ir a la Siguiente Actividad */}
                <div className="flex justify-center mt-8 max-w-md mx-auto">
                    <button
                        onClick={handleContinue}
                        disabled={!dibujoValido}
                        className={`w-full py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !dibujoValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-105 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act08;