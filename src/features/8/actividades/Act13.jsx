import React, { useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act13 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '13';

    // USER GLOBAL
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('usuario'));
        } catch {
            return null;
        }
    };

    const getAnonId = () => {
        let anon = localStorage.getItem('anon_id');
        if (!anon) {
            anon = `anon-${crypto.randomUUID()}`;
            localStorage.setItem('anon_id', anon);
        }
        return anon;
    };

    const user = getUser();
    const userId = user?.id;
    const safeUserId = userId || getAnonId();

    const keyRespuestas = `act13-respuestas-${safeUserId}-${actividadId}`;

    // GUARDA EL PROGRESO/COMPLETADO
    const syncDB = async () => {
        const payload = {
            visto: true,
            fechaCompleto: new Date().toISOString()
        };

        localStorage.setItem(keyRespuestas, JSON.stringify(payload));

        if (!userId) return;

        try {
            const { error } = await supabase
                .from('progreso_actividades')
                .upsert(
                    {
                        usuario_id: userId,
                        actividad_id: actividadId,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );

            if (error) console.error("Error al guardar en Supabase:", error.message);
        } catch (err) {
            console.warn("Error en syncDB:", err);
        }
    };

    useEffect(() => {
        syncDB();
    }, [userId, actividadId]);

    const handleFinalizar = async () => {
        await syncDB();
        if (onComplete) {
            onComplete();
        } else {
            navigate(`/dashboard/${rango}`);
        }
    };

    const parrafos = config.parrafos || [
        "Ser autorresponsable significa hacer lo correcto incluso cuando nadie nos está observando.",
        "Cada decisión que tomamos nos acerca o nos aleja de nuestras metas.",
        "Así como el ahorro crece moneda por moneda, la confianza y la responsabilidad crecen acción por acción.",
        "Cuando soy responsable, construyo un mejor futuro para mí y para quienes me rodean."
    ];

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
            {/* NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg cursor-pointer"
                >
                    🏠 Inicio
                </button>
            </div>

            <div
                className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-2xl mx-auto space-y-8"
                translate="no"
            >
                {/* ENCABEZADO CON MASCOTA Y TÍTULO */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <img
                        src={config.imagenMascota || "/images/alianzito-sentado.png"}
                        alt="Alianzito"
                        className="w-40 sm:w-48 object-contain select-none"
                    />
                    <h1 className="text-3xl sm:text-4xl font-black text-blue-950 text-center sm:text-left leading-tight">
                        {config.titulo || "Mensaje final"}
                    </h1>
                </div>

                {/* TEXTO INSTRUCTIVO Y PARRAFOS */}
                <div className="space-y-6 text-center text-blue-950 font-extrabold italic text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
                    {parrafos.map((parrafo, idx) => (
                        <p key={idx}>{parrafo}</p>
                    ))}
                </div>

                {/* BOTÓN FINALIZAR */}
                <div className="pt-4 max-w-md mx-auto">
                    <button
                        type="button"
                        onClick={handleFinalizar}
                        className="w-full py-4 rounded-full font-black text-xl shadow-lg transition-all bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 cursor-pointer border-b-4 border-amber-600"
                    >
                        Finalizar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act13;