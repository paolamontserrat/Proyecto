import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '2';
    const preguntas = config.preguntas || [];

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('usuario'));
        } catch {
            return null;
        }
    };

    const user = getUser();
    const userId = user?.id;
    const storageKey = `act02-${rango}-${userId || 'anon'}-${actividadId}`;

    const [respuestas, setRespuestas] = useState({
        meta: '',
        monto: '',
        motivo: ''
    });

    const [guardado, setGuardado] = useState(false);

    // Cargar progreso desde Supabase / LocalStorage
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

            if (userId && actividadId) {
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
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
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

    const handleSave = async () => {
        const payload = {
            respuestas,
            fechaCompleto: new Date().toISOString()
        };

        if (userId && actividadId) {
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
            } catch (err) {
                console.warn("Error guardando progreso en Supabase:", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        setGuardado(true);
        setTimeout(() => setGuardado(false), 3000);

        if (onComplete) onComplete();
    };

    const esFormularioValido = Object.values(respuestas).every(val => val.trim() !== '');

    return (
        <LayoutActividad fondo={config.fondo || '/images/10/Fondo.jpeg'}>
            {/* ESTILOS DE ANIMACIONES */}
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
            <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto px-2">
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

            {/* CONTENEDOR PRINCIPAL */}
            <div
                className="bg-sky-50/95 p-4 sm:p-8 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-6 box-border overflow-hidden"
                translate="no"
            >
                {/* TÍTULO E INSTRUCCIONES */}
                <div className="text-center space-y-2">
                    {config.titulo && (
                        <h1 className="text-3xl sm:text-4xl font-black text-blue-950 uppercase tracking-wider">
                            {config.titulo}
                        </h1>
                    )}
                    {config.instrucciones && (
                        <p className="text-lg sm:text-2xl font-black text-sky-800">
                            {config.instrucciones}
                        </p>
                    )}
                    {config.subinstruccion && (
                        <p className="text-base sm:text-xl font-bold text-blue-900">
                            {config.subinstruccion}
                        </p>
                    )}
                </div>

                {/* CAMPOS DE FORMULARIO DINÁMICOS */}
                <div className="space-y-6 max-w-3xl mx-auto">
                    {preguntas.map((preg) => {
                        const esPrimeraPregunta = preg.id === 'meta';

                        return (
                            <div key={preg.id} className="space-y-2 relative">
                                <label className="block text-base sm:text-xl font-black text-blue-950">
                                    {preg.label}
                                </label>

                                <div className="relative flex items-center">
                                    {preg.tipo === 'textarea' ? (
                                        <textarea
                                            value={respuestas[preg.id] || ''}
                                            onChange={(e) => handleChange(preg.id, e.target.value)}
                                            placeholder={preg.placeholder || ''}
                                            rows={3}
                                            className={`w-full p-4 rounded-2xl border-2 border-sky-300 bg-white text-blue-950 font-bold text-base sm:text-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-300 shadow-inner resize-none transition ${
                                                esPrimeraPregunta ? 'pr-16 sm:pr-24' : ''
                                            }`}
                                        />
                                    ) : (
                                        <div className="flex items-center w-full bg-white rounded-2xl border-2 border-sky-300 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-300 shadow-inner px-4 overflow-hidden">
                                            {preg.simbolo && (
                                                <span className="text-xl sm:text-2xl font-black text-blue-900 mr-2">
                                                    {preg.simbolo}
                                                </span>
                                            )}
                                            <input
                                                type="number"
                                                value={respuestas[preg.id] || ''}
                                                onChange={(e) => handleChange(preg.id, e.target.value)}
                                                placeholder={preg.placeholder || ''}
                                                className="w-full py-3 bg-transparent text-blue-950 font-bold text-base sm:text-lg focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* BOTÓN COMPLETAR */}
                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!esFormularioValido}
                        className={`w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all uppercase tracking-wider cursor-pointer ${
                            esFormularioValido
                                ? 'bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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