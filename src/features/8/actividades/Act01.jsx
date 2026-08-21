import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act01 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

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
    const keySeleccion = `act01-opcion-${safeUserId}-${config.id || '1'}`;
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

    // Extraer secciones del JSON
    const secIntro = config.secciones?.find((s) => s.tipo === 'introduccion') || {};
    const secEjemplo = config.secciones?.find((s) => s.tipo === 'ejemplo') || {};

    // =========================
    // CARGAR LOCAL Y SUPABASE
    // =========================
    useEffect(() => {
        if (!userId) {
        const savedChoice = localStorage.getItem(keySeleccion);
        if (savedChoice) setOpcionSeleccionada(savedChoice);
        return;
        }

        const cargar = async () => {
        const { data: db } = await supabase
            .from('progreso_actividades')
            .select('datos_actividad')
            .eq('usuario_id', userId)
            .eq('actividad_id', config.id || '1')
            .maybeSingle();

        if (db?.datos_actividad?.opcionSeleccionada) {
            setOpcionSeleccionada(db.datos_actividad.opcionSeleccionada);
            localStorage.setItem(keySeleccion, db.datos_actividad.opcionSeleccionada);
        } else {
            const savedChoice = localStorage.getItem(keySeleccion);
            if (savedChoice) setOpcionSeleccionada(savedChoice);
        }
        };

        cargar();
    }, [userId, config.id, keySeleccion]);

    // =========================
    // SELECCIONAR OPCIÓN & SYNC
    // =========================
    const seleccionarOpcion = async (opcionId) => {
        setOpcionSeleccionada(opcionId);
        localStorage.setItem(keySeleccion, opcionId);

        if (userId) {
        await supabase
            .from('progreso_actividades')
            .upsert(
            {
                usuario_id: userId,
                actividad_id: config.id || '1',
                datos_actividad: { opcionSeleccionada: opcionId },
                completada: true,
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
            {/* TÍTULO PRINCIPAL */}
            <div className="bg-amber-400 p-4 sm:p-6 rounded-2xl border-4 border-amber-500 text-center shadow-md">
            <h1 className="text-2xl sm:text-4xl font-black text-blue-950 leading-tight">
                {config.titulo}
            </h1>
            </div>

            {/* SECCIÓN INTRODUCCIÓN */}
            <div className="bg-sky-50 p-6 rounded-3xl border-3 border-sky-200 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-blue-900">
                {secIntro.texto}
            </h2>
            <p className="text-lg font-bold text-sky-800">{secIntro.subtexto}</p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {secIntro.decisiones?.map((dec, index) => (
                <li
                    key={index}
                    className="bg-white p-3 rounded-2xl border-2 border-sky-300 font-bold text-blue-950 shadow-sm flex items-center gap-2"
                >
                    <span className="text-amber-500 font-black">🌟</span> {dec}
                </li>
                ))}
            </ul>

            <div className="bg-blue-900 text-white p-5 rounded-2xl mt-4 shadow-md">
                <p className="text-base sm:text-lg font-bold leading-relaxed">
                {secIntro.reflexion}
                </p>
            </div>
            </div>

            {/* SECCIÓN EJEMPLO E INTERACCIÓN */}
            <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-3xl font-black text-blue-950">
                {secEjemplo.titulo}
                </h3>
                <p className="text-lg font-extrabold text-blue-800">
                {secEjemplo.subtitulo}
                </p>
            </div>

            {/* TARJETAS DE OPCIONES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {secEjemplo.opciones?.map((opcion) => {
                const estaSeleccionada = opcionSeleccionada === opcion.id;
                return (
                    <div
                    key={opcion.id}
                    onClick={() => seleccionarOpcion(opcion.id)}
                    className={`cursor-pointer p-6 rounded-3xl border-4 transition-all flex flex-col justify-between items-center text-center shadow-lg hover:scale-105 active:scale-95 ${
                        estaSeleccionada
                        ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-300 scale-105'
                        : 'bg-amber-400 border-amber-500 hover:bg-amber-300'
                    }`}
                    >
                    <p className="text-lg sm:text-xl font-black text-blue-950 mb-4 leading-snug">
                        {opcion.texto}
                    </p>

                    {opcion.imagen && (
                        <img
                        src={opcion.imagen}
                        alt={opcion.id}
                        className={`max-h-[180px] object-contain drop-shadow-md my-2 transition-transform duration-300 ${
                            estaSeleccionada ? 'animate-bounce-gentle scale-110' : ''
                        }`}
                        />
                    )}

                    <div className="mt-4">
                        <span
                        className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-wider transition-colors ${
                            estaSeleccionada
                            ? 'bg-blue-950 text-white'
                            : 'bg-white text-blue-950 border-2 border-blue-950'
                        }`}
                        >
                        {estaSeleccionada ? 'Elegido' : 'Elegir esta opción'}
                        </span>
                    </div>
                    </div>
                );
                })}
            </div>

            {/* PREGUNTA FINAL */}
            <p className="text-center text-lg sm:text-xl font-black text-blue-900 pt-2">
                {secEjemplo.pregunta}
            </p>
            </div>

            {/* BOTÓN CONTINUAR */}
            <div className="pt-2">
            <button
                onClick={onComplete}
                disabled={!opcionSeleccionada}
                className={`w-full py-5 rounded-full font-black text-2xl shadow-xl transition-all border-b-4 ${
                opcionSeleccionada
                    ? 'bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 border-amber-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 opacity-70'
                }`}
            >
                {opcionSeleccionada ? 'Continuar' : 'Selecciona una opción para avanzar'}
            </button>
            </div>
        </div>
        </LayoutActividad>
    );
};

export default Act01;