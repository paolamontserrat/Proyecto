import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    // =========================
    // USER GLOBAL (UNIFICADO)
    // =========================
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

    // KEYS MULTIUSUARIO
    const keyRespuestas = `act02-respuestas-${safeUserId}-${config.id || 'act02'}`;

    // Estado para guardar las elecciones { 1: 'buena', 2: 'mala', ... }
    const [respuestas, setRespuestas] = useState({});

    const preguntas = config.preguntas || [];

    // =========================
    // CARGAR LOCAL Y SUPABASE
    // =========================
    useEffect(() => {
        if (!userId) {
        const saved = localStorage.getItem(keyRespuestas);
        if (saved) setRespuestas(JSON.parse(saved));
        return;
        }

        const cargar = async () => {
        const { data: db } = await supabase
            .from('progreso_actividades')
            .select('datos_actividad')
            .eq('usuario_id', userId)
            .eq('actividad_id', config.id || 'act02')
            .maybeSingle();

        if (db?.datos_actividad?.respuestas) {
            setRespuestas(db.datos_actividad.respuestas);
            localStorage.setItem(keyRespuestas, JSON.stringify(db.datos_actividad.respuestas));
        } else {
            const saved = localStorage.getItem(keyRespuestas);
            if (saved) setRespuestas(JSON.parse(saved));
        }
        };

        cargar();
    }, [userId, config.id, keyRespuestas]);

    // =========================
    // VERIFICAR SI TODAS SON CORRECTAS
    // =========================
    const todasCorrectas =
        preguntas.length > 0 &&
        preguntas.every((p) => respuestas[p.id] === p.respuestaCorrecta);

    // =========================
    // GUARDAR Y SINCRONIZAR
    // =========================
    const guardarProgreso = async (nuevasRespuestas) => {
        setRespuestas(nuevasRespuestas);
        localStorage.setItem(keyRespuestas, JSON.stringify(nuevasRespuestas));

        const completado = preguntas.every(
        (p) => nuevasRespuestas[p.id] === p.respuestaCorrecta
        );

        if (userId) {
        await supabase
            .from('progreso_actividades')
            .upsert(
            {
                usuario_id: userId,
                actividad_id: config.id || 'act02',
                datos_actividad: { respuestas: nuevasRespuestas },
                completada: completado,
            },
            { onConflict: 'usuario_id,actividad_id' }
            );
        }
    };

    // =========================
    // SELECCIONAR RESPUESTA
    // =========================
    const manejarSeleccion = (preguntaId, tipo) => {
        const pregunta = preguntas.find((p) => p.id === preguntaId);
        if (!pregunta) return;

        const respuestaActual = respuestas[preguntaId];

        // Si ya acertó correctamente, queda fija y no se deja cambiar
        if (respuestaActual === pregunta.respuestaCorrecta) return;

        const nuevasRespuestas = {
        ...respuestas,
        [preguntaId]: tipo,
        };

        guardarProgreso(nuevasRespuestas);
    };

    // =========================
    // REINICIAR ACTIVIDAD
    // =========================
    const handleReiniciar = async () => {
        setRespuestas({});
        localStorage.removeItem(keyRespuestas);

        if (userId) {
        await supabase
            .from('progreso_actividades')
            .upsert(
            {
                usuario_id: userId,
                actividad_id: config.id || 'act02',
                datos_actividad: { respuestas: {} },
                completada: false,
            },
            { onConflict: 'usuario_id,actividad_id' }
            );
        }
    };

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpg'}>
        {/* INYECCIÓN DE ESTILOS CSS CON ANIMACIONES */}
        <style>{`
            @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            }
            @keyframes pulse-subtle {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
            }
            .animate-float-slow {
            animation: float-slow 4s ease-in-out infinite;
            }
            .animate-pulse-subtle {
            animation: pulse-subtle 2s ease-in-out infinite;
            }
        `}</style>

        {/* NAVEGACIÓN SUPERIOR */}
        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto px-2">
            <button
            onClick={onBack}
            className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
            >
            ← Regresar
            </button>
            <button
            onClick={() => navigate(`/dashboard/${rango}`)}
            className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition text-base sm:text-lg"
            >
            🏠 Inicio
            </button>
        </div>

        <div
            className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8"
            translate="no"
        >
            {/* TÍTULO E INSTRUCCIONES */}
            <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black text-blue-950">
                {config.titulo || 'Detective de decisiones'}
            </h1>
            <p className="text-base sm:text-xl font-bold text-blue-900 max-w-xl mx-auto">
                {config.instrucciones || 'Lee cada situación y marca:'}
            </p>

            {/* SIMBOLOGÍA DE GUÍA */}
            <div className="flex justify-center items-center gap-6 pt-2">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-blue-600 shadow-sm">
                <span className="text-blue-600 text-xl font-black">✔</span>
                <span className="font-extrabold text-blue-950 text-sm sm:text-base">
                    Buena decisión
                </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-red-500 shadow-sm">
                <span className="text-red-500 text-xl font-black">✖</span>
                <span className="font-extrabold text-blue-950 text-sm sm:text-base">
                    Mala decisión
                </span>
                </div>
            </div>
            </div>

            {/* LISTADO DE PREGUNTAS */}
            <div className="space-y-6">
            {preguntas.map((p) => {
                const respuestaUsuario = respuestas[p.id];
                const esCorrecta = respuestaUsuario === p.respuestaCorrecta;
                const esIncorrecta = respuestaUsuario && !esCorrecta;

                return (
                <div
                    key={p.id}
                    className="bg-white p-5 sm:p-6 rounded-3xl border-3 border-sky-200 shadow-md flex flex-col items-center text-center space-y-4"
                >
                    <p className="text-lg sm:text-2xl font-black text-blue-950 leading-snug">
                    {p.texto}
                    </p>

                    {/* BOTONES DE SELECCIÓN */}
                    <div className="flex justify-center gap-4 w-full max-w-xs">
                    {/* BOTÓN BUENA DECISIÓN */}
                    {(() => {
                        const seleccionado = respuestaUsuario === 'buena';
                        const esEstaCorrecta = seleccionado && esCorrecta;
                        const esEstaIncorrecta = seleccionado && esIncorrecta;

                        let estilos =
                        'bg-gray-100 border-gray-300 text-gray-700 hover:bg-sky-50';

                        if (esEstaCorrecta) {
                        estilos = 'bg-blue-600 border-blue-700 text-white cursor-default ring-4 ring-blue-300';
                        } else if (esEstaIncorrecta) {
                        estilos = 'bg-red-500 border-red-600 text-white ring-4 ring-red-300';
                        }

                        return (
                        <button
                            onClick={() => manejarSeleccion(p.id, 'buena')}
                            disabled={esCorrecta}
                            className={`flex-1 py-3 px-4 rounded-2xl border-3 font-black text-lg sm:text-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${estilos}`}
                        >
                            ✔ Buena
                        </button>
                        );
                    })()}

                    {/* BOTÓN MALA DECISIÓN */}
                    {(() => {
                        const seleccionado = respuestaUsuario === 'mala';
                        const esEstaCorrecta = seleccionado && esCorrecta;
                        const esEstaIncorrecta = seleccionado && esIncorrecta;

                        let estilos =
                        'bg-gray-100 border-gray-300 text-gray-700 hover:bg-sky-50';

                        if (esEstaCorrecta) {
                        estilos = 'bg-blue-600 border-blue-700 text-white cursor-default ring-4 ring-blue-300';
                        } else if (esEstaIncorrecta) {
                        estilos = 'bg-red-500 border-red-600 text-white ring-4 ring-red-300';
                        }

                        return (
                        <button
                            onClick={() => manejarSeleccion(p.id, 'mala')}
                            disabled={esCorrecta}
                            className={`flex-1 py-3 px-4 rounded-2xl border-3 font-black text-lg sm:text-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${estilos}`}
                        >
                            ✖ Mala
                        </button>
                        );
                    })()}
                    </div>
                </div>
                );
            })}
            </div>

            {/* ACCIONES Y BOTONES (REINICIAR + AVANZAR) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                <button
                    onClick={handleReiniciar}
                    className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                >
                    Reiniciar
                </button>

                <button
                    onClick={onComplete}
                    disabled={!todasCorrectas}
                    className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                        !todasCorrectas
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                        : "bg-amber-400 text-blue-950 hover:scale-102 active:scale-98 cursor-pointer"
                    }`}
                >
                    Continuar
                </button>
            </div>
        </div>
        </LayoutActividad>
    );
};

export default Act02;