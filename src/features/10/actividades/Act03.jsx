import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '3';
    const recursos = config.recursos || {};
    const casoPractico = config.casoPractico || {};
    const actividadConfig = config.actividad || {};
    const preguntas = actividadConfig.preguntas || [];

    const [guardado, setGuardado] = useState(false);
    const [syncStatus, setSyncStatus] = useState('saved');

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('usuario'));
        } catch {
            return null;
        }
    };

    const user = getUser();
    const userId = user?.id || 'anon';
    const storageKey = `act03-${rango}-${userId}-${actividadId}`;

    const [respuestas, setRespuestas] = useState({
        opcionFuturo: '',
        porQue: ''
    });

    // Cargar progreso guardado (LocalStorage / Supabase)
    useEffect(() => {
        const cargarProgreso = async () => {
            const localData = localStorage.getItem(storageKey);
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (parsed.respuestas) {
                        setRespuestas(parsed.respuestas);
                    }
                } catch (e) {
                    console.warn("Error leyendo localStorage", e);
                }
            }

            if (userId !== 'anon' && actividadId) {
                setSyncStatus('saving');
                try {
                    const { data: progreso } = await supabase
                        .from('progreso_actividades')
                        .select('datos_actividad')
                        .eq('usuario_id', userId)
                        .eq('actividad_id', actividadId)
                        .maybeSingle();

                    if (progreso?.datos_actividad?.respuestas) {
                        setRespuestas(progreso.datos_actividad.respuestas);
                    }
                    setSyncStatus('saved');
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                    setSyncStatus('error');
                }
            }
        };

        cargarProgreso();
    }, [actividadId, userId, storageKey]);

    const handleChange = (id, value) => {
        setRespuestas(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Lógica para reiniciar las respuestas (limpia estado local, LocalStorage y Supabase)
    const handleReiniciar = async () => {
        const estadoVacio = {
            opcionFuturo: '',
            porQue: ''
        };

        setRespuestas(estadoVacio);
        localStorage.removeItem(storageKey);

        if (userId !== 'anon' && actividadId) {
            setSyncStatus('saving');
            try {
                await supabase.from('progreso_actividades').upsert(
                    {
                        usuario_id: userId,
                        actividad_id: actividadId,
                        datos_actividad: { respuestas: estadoVacio },
                        completada: false,
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );
                setSyncStatus('saved');
            } catch (err) {
                console.warn("Error al reiniciar en Supabase:", err);
                setSyncStatus('error');
            }
        }
    };

    // Lógica para guardar y continuar
    const handleSave = async () => {
        const payload = {
            respuestas,
            fechaCompleto: new Date().toISOString()
        };

        setSyncStatus('saving');
        if (userId !== 'anon' && actividadId) {
            try {
                await supabase.from('progreso_actividades').upsert(
                    {
                        usuario_id: userId,
                        actividad_id: actividadId,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );
                setSyncStatus('saved');
            } catch (err) {
                console.warn("Error guardando progreso en Supabase:", err);
                setSyncStatus('error');
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        setGuardado(true);
        setTimeout(() => setGuardado(false), 3000);

        if (onComplete) onComplete();
    };

    const esFormularioValido = preguntas.length > 0 && preguntas.every(preg => (respuestas[preg.id] || '').trim() !== '');

    return (
        <LayoutActividad fondo={recursos.fondoImg || '/images/10/Fondo.png'}>
            {/* ANIMACIONES */}
            <style>{`
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* BARRA SUPERIOR DE NAVEGACIÓN Y ESTADO */}
            <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-6 py-2.5 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer text-base sm:text-lg"
                >
                    ← Regresar
                </button>

                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-6 py-2.5 rounded-full font-extrabold shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer text-base sm:text-lg"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* CONTENEDOR UNIFICADO EN UNA SOLA PANTALLA */}
            <div
                className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-2xl mx-auto space-y-8"
                translate="no"
            >
                
                {/* 1. SECCIÓN INFORMATIVA / EXPLICACIÓN (ARRIBA) */}
                <div className="bg-sky-50/95 p-6 sm:p-10 rounded-[35px] border-4 border-sky-400 shadow-2xl space-y-6">
                    <h1 className="text-center text-2xl sm:text-4xl font-black text-blue-950 uppercase tracking-wide">
                        {config.titulo}
                    </h1>

                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* EXPLICACIÓN */}
                        {config.explicacion && (
                            <div className="bg-white p-5 rounded-2xl border-2 border-sky-200 shadow-sm space-y-1">
                                <h2 className="text-xl sm:text-2xl font-black text-blue-900">Explicación</h2>
                                <p className="text-blue-950 font-medium text-base sm:text-lg">
                                    {config.explicacion}
                                </p>
                            </div>
                        )}

                        {/* CASO PRÁCTICO */}
                        {casoPractico.descripcion && (
                            <div className="bg-white p-5 rounded-2xl border-2 border-sky-200 shadow-sm space-y-3">
                                <h2 className="text-xl sm:text-2xl font-black text-blue-900">Caso práctico</h2>
                                <p className="text-blue-950 font-bold text-base sm:text-lg">
                                    {casoPractico.descripcion}
                                </p>

                                {casoPractico.subtitulo && (
                                    <p className="text-sky-800 font-extrabold pt-1 text-base sm:text-lg">
                                        {casoPractico.subtitulo}
                                    </p>
                                )}

                                {casoPractico.opciones && (
                                    <ul className="list-disc list-inside space-y-1 text-blue-950 font-semibold pl-2 text-base sm:text-lg">
                                        {casoPractico.opciones.map((opcion, index) => (
                                            <li key={index}>{opcion}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* IMÁGENES DE ILUSTRACIÓN */}
                        <div className="flex justify-around items-center pt-2">
                            {recursos.personaje1 && (
                                <img
                                    src={recursos.personaje1}
                                    alt="Alianzito Pensando"
                                    className="w-32 sm:w-44 object-contain animate-bounce-gentle"
                                />
                            )}

                            {recursos.monedas && (
                                <img
                                    src={recursos.monedas}
                                    alt="Ilustración Decisiones"
                                    className="w-44 sm:w-64 object-contain animate-bounce-gentle"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. SECCIÓN DE ACTIVIDAD / PREGUNTAS (ABAJO) */}
                <div className="bg-sky-50/95 p-6 sm:p-10 rounded-[35px] border-4 border-sky-400 shadow-2xl space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-3xl sm:text-4xl font-black text-blue-950 uppercase tracking-wider">
                            {actividadConfig.titulo || 'Actividad'}
                        </h2>
                        {actividadConfig.subtitulo && (
                            <p className="text-lg sm:text-2xl font-black text-sky-800">
                                {actividadConfig.subtitulo}
                            </p>
                        )}
                    </div>

                    <div className="space-y-6 max-w-3xl mx-auto">
                        {preguntas.map((preg, index) => {
                            const esUltimaPregunta = index === preguntas.length - 1;

                            return (
                                <div key={preg.id} className="space-y-2 relative">
                                    <label className="block text-lg sm:text-xl font-black text-blue-950">
                                        {preg.label}
                                    </label>
                                    <div className="relative flex items-center">
                                        <textarea
                                            value={respuestas[preg.id] || ''}
                                            onChange={(e) => handleChange(preg.id, e.target.value)}
                                            placeholder={preg.placeholder || ''}
                                            rows={3}
                                            className={`w-full p-4 rounded-2xl border-2 border-sky-300 bg-white text-blue-950 font-bold text-base sm:text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-300 shadow-inner resize-none transition ${
                                                esUltimaPregunta && recursos.personaje2 ? 'pr-20 sm:pr-28' : ''
                                            }`}
                                        />

                                        {/* PERSONAJE 2 EN LA ESQUINA DEL ÚLTIMO CAMPO */}
                                        {esUltimaPregunta && recursos.personaje2 && (
                                            <img
                                                src={recursos.personaje2}
                                                alt="Alianzito Señalando"
                                                className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-20 sm:w-28 object-contain pointer-events-none z-10 animate-bounce-gentle"
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                        <button
                            type="button"
                            onClick={handleReiniciar}
                            className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            Reiniciar
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!esFormularioValido}
                            className={`py-4 rounded-full font-black text-xl shadow-lg transition-all tracking-wider ${
                                !esFormularioValido
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                    : "bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 cursor-pointer"
                            }`}
                        >
                            Continuar
                        </button>
                    </div>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act03;