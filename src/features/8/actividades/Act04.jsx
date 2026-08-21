import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const secciones = config.secciones || {};

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

    const keyRespuestas = `act04-respuestas-${safeUserId}-${config.id || '4'}`;

    // ESTADO DEL FORMULARIO
    const [formulario, setFormulario] = useState({
        paso1: '',
        paso2: '',
        paso3: '',
        paso4: '',
    });

    // CARGAR LOCAL Y SUPABASE
    useEffect(() => {
        if (!userId) {
            const saved = localStorage.getItem(keyRespuestas);
            if (saved) setFormulario(JSON.parse(saved));
            return;
        }

        const cargar = async () => {
            const { data: db } = await supabase
                .from('progreso_actividades')
                .select('datos_actividad')
                .eq('usuario_id', userId)
                .eq('actividad_id', config.id || '4')
                .maybeSingle();

            if (db?.datos_actividad) {
                setFormulario(db.datos_actividad);
                localStorage.setItem(keyRespuestas, JSON.stringify(db.datos_actividad));
            } else {
                const saved = localStorage.getItem(keyRespuestas);
                if (saved) setFormulario(JSON.parse(saved));
            }
        };

        cargar();
    }, [userId, config.id, keyRespuestas]);

    // SYNC SUPABASE
    const syncDB = async (nuevoEstado) => {
        setFormulario(nuevoEstado);
        localStorage.setItem(keyRespuestas, JSON.stringify(nuevoEstado));

        if (!userId) return;

        const estaCompleto =
            nuevoEstado.paso1?.trim() !== '' &&
            nuevoEstado.paso2?.trim() !== '' &&
            nuevoEstado.paso3?.trim() !== '' &&
            nuevoEstado.paso4?.trim() !== '';

        await supabase
            .from('progreso_actividades')
            .upsert(
                {
                    usuario_id: userId,
                    actividad_id: config.id || '4',
                    datos_actividad: nuevoEstado,
                    completada: estaCompleto,
                },
                { onConflict: 'usuario_id,actividad_id' }
            );
    };

    const manejarCambio = (campo, valor) => {
        const nuevoEstado = { ...formulario, [campo]: valor };
        syncDB(nuevoEstado);
    };

    const handleReiniciar = async () => {
        const estadoVacio = { paso1: '', paso2: '', paso3: '', paso4: '' };
        localStorage.removeItem(keyRespuestas);
        await syncDB(estadoVacio);
    };

    // VALIDACIÓN
    const estaFormularioValido =
        formulario.paso1?.trim() !== '' &&
        formulario.paso2?.trim() !== '' &&
        formulario.paso3?.trim() !== '' &&
        formulario.paso4?.trim() !== '';

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
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

            {/* NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto px-2">
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
                className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8"
                translate="no"
            >
                {/* TARJETA 1: PLANEAR ANTES DE GASTAR */}
                {secciones.planear && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl space-y-4 text-blue-950">
                        <h1 className="text-2xl sm:text-4xl font-black text-center text-blue-900">
                            {secciones.planear.titulo}
                        </h1>
                        <p className="text-lg sm:text-xl font-bold text-center">
                            {secciones.planear.descripcion}
                        </p>
                        <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl space-y-2">
                            <p className="font-black text-lg text-blue-900 text-center">
                                {secciones.planear.preguntaAhorro}
                            </p>
                            <ul className="space-y-1 font-extrabold text-center text-sky-900 text-base sm:text-lg">
                                {secciones.planear.preguntas?.map((pregunta, idx) => (
                                    <li key={idx}>• {pregunta}</li>
                                ))}
                            </ul>
                        </div>
                        {secciones.planear.imagen && (
                            <div className="flex justify-center pt-2">
                                <img
                                    src={secciones.planear.imagen}
                                    alt={secciones.planear.titulo}
                                    className="max-h-64 object-contain rounded-2xl animate-float-slow"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* TARJETA 2: EL ESFUERZO TRAE RECOMPENSAS */}
                {secciones.esfuerzo && (
                    <div className="bg-amber-100/90 p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-md space-y-4 text-blue-950">
                        {secciones.esfuerzo.imagen && (
                            <div className="flex justify-center pb-2">
                                <img
                                    src={secciones.esfuerzo.imagen}
                                    alt={secciones.esfuerzo.titulo}
                                    className="max-h-64 object-contain rounded-2xl animate-bounce-gentle"
                                />
                            </div>
                        )}
                        <h2 className="text-2xl sm:text-3xl font-black text-center text-blue-900">
                            {secciones.esfuerzo.titulo}
                        </h2>
                        <p className="text-lg font-bold text-center text-amber-800 bg-amber-50 py-2 px-4 rounded-xl border border-amber-200">
                            <span className="font-black">{secciones.esfuerzo.reflexion}</span>
                        </p>
                        <p className="font-extrabold text-base sm:text-lg text-center">
                            {secciones.esfuerzo.ejemplos}
                        </p>
                    </div>
                )}

                {/* TARJETA 3: FORMULARIO DINÁMICO */}
                {secciones.formulario && (
                    <div className="space-y-6 pt-2">
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl sm:text-3xl font-black text-blue-950">
                                {secciones.formulario.titulo}
                            </h3>
                            <p className="text-lg font-extrabold text-blue-900">
                                {secciones.formulario.subtitulo}
                            </p>
                        </div>

                        <div className="space-y-5">
                            {secciones.formulario.pasos?.map((paso) => (
                                <div key={paso.id} className="space-y-2">
                                    <label className="block font-black text-lg sm:text-xl text-blue-950">
                                        {paso.label}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formulario[paso.id] || ''}
                                        onChange={(e) => manejarCambio(paso.id, e.target.value)}
                                        placeholder={paso.placeholder}
                                        className="w-full p-4 rounded-2xl border-3 border-sky-300 font-bold text-blue-950 bg-white focus:outline-none focus:ring-4 focus:ring-sky-400 text-base sm:text-lg shadow-sm resize-none"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* BOTONES ACCIÓN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                            <button
                                type="button"
                                onClick={handleReiniciar}
                                className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                Reiniciar
                            </button>

                            <button
                                type="button"
                                onClick={onComplete}
                                disabled={!estaFormularioValido}
                                className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                                    !estaFormularioValido
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                        : "bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 cursor-pointer"
                                }`}
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </LayoutActividad>
    );
};

export default Act04;