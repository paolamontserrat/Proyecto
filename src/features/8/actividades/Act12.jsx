import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act12 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '12';

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

    const keyRespuestas = `act12-respuestas-${safeUserId}-${actividadId}`;

    const [opcionSeleccionada, setOpcionSeleccionada] = useState('');

    // CARGAR DESDE SUPABASE O LOCALSTORAGE
    useEffect(() => {
        const cargarProgreso = async () => {
            let datosCargados = null;

            if (userId) {
                try {
                    const { data: db, error } = await supabase
                        .from('progreso_actividades')
                        .select('datos_actividad')
                        .eq('usuario_id', userId)
                        .eq('actividad_id', actividadId)
                        .maybeSingle();

                    if (!error && db?.datos_actividad) {
                        datosCargados = db.datos_actividad;
                    }
                } catch (err) {
                    console.warn("Error leyendo de Supabase:", err);
                }
            }

            if (!datosCargados) {
                const localSaved = localStorage.getItem(keyRespuestas);
                if (localSaved) {
                    try {
                        datosCargados = JSON.parse(localSaved);
                    } catch (e) {
                        console.error("Error parseando localStorage:", e);
                    }
                }
            }

            if (datosCargados?.compromiso) {
                setOpcionSeleccionada(datosCargados.compromiso);
                localStorage.setItem(keyRespuestas, JSON.stringify(datosCargados));
            }
        };

        cargarProgreso();
    }, [userId, actividadId, keyRespuestas]);

    // SYNC SUPABASE & LOCALSTORAGE
    const syncDB = async (compromisoTexto) => {
        const payload = {
            compromiso: compromisoTexto,
            fechaActualizacion: new Date().toISOString()
        };

        setOpcionSeleccionada(compromisoTexto);
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
                        completada: Boolean(compromisoTexto),
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );

            if (error) console.error("Error al guardar en Supabase:", error.message);
        } catch (err) {
            console.warn("Error en syncDB:", err);
        }
    };

    const handleSeleccionar = (texto) => {
        syncDB(texto);
    };

    const handleContinue = async () => {
        const payloadFinal = {
            compromiso: opcionSeleccionada,
            completado: true,
            fechaCompleto: new Date().toISOString()
        };
        await syncDB(opcionSeleccionada);
        if (onComplete) onComplete();
    };

    const opciones = config.opciones || [
        { id: "opcion_1", texto: "Ahorraré un poco de dinero." },
        { id: "opcion_2", texto: "Cuidaré mis útiles." },
        { id: "opcion_3", texto: "Apagaré la luz." },
        { id: "opcion_4", texto: "Cerraré la llave del agua." },
        { id: "opcion_5", texto: "Ayudaré en casa." },
        { id: "opcion_6", texto: "Cumpliré mis responsabilidades." }
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
                className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-2xl mx-auto space-y-6 flex flex-col items-center"
                translate="no"
            >
                {/* PREGUNTA */}
                <h1 className="text-2xl sm:text-3xl font-black text-blue-950 text-center leading-tight">
                    {config.titulo || "¿Cuál será tu compromiso para esta semana?"}
                </h1>

                {/* OPCIONES DE SELECCIÓN ÚNICA */}
                <div className="w-full space-y-3 pt-2">
                    {opciones.map((opcion) => {
                        const estaSeleccionada = opcionSeleccionada === opcion.texto;
                        return (
                            <button
                                key={opcion.id}
                                type="button"
                                onClick={() => handleSeleccionar(opcion.texto)}
                                className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-md text-blue-950 border-3 cursor-pointer ${
                                    estaSeleccionada
                                        ? "bg-amber-400 border-amber-600 scale-102 shadow-lg ring-4 ring-amber-300"
                                        : "bg-amber-300 hover:bg-amber-400 border-amber-400 hover:scale-101"
                                }`}
                            >
                                {opcion.texto}
                            </button>
                        );
                    })}
                </div>

                {/* MASCOTA ALIANZITO */}
                <div className="pt-2 flex justify-center w-full">
                    <img
                        src={config.imagenMascota || "/images/alianzito-apuntando.png"}
                        alt="Alianzito"
                        className="max-h-56 object-contain select-none"
                    />
                </div>

                {/* BOTÓN CONTINUAR */}
                <div className="w-full pt-2">
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!opcionSeleccionada}
                        className={`w-full py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !opcionSeleccionada
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 cursor-pointer border-b-4 border-amber-600"
                        }`}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act12;