import React, { useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act02 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '1';
    const secciones = config.secciones || {};

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('usuario'));
        } catch {
            return null;
        }
    };

    const user = getUser();
    const userId = user?.id;
    const storageKey = `act01-${rango}-${userId || 'anon'}-${actividadId}`;

    // Cargar progreso desde Supabase
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId && actividadId) {
                try {
                    const { data: progreso } = await supabase
                        .from('progreso_actividades')
                        .select('completada')
                        .eq('usuario_id', userId)
                        .eq('actividad_id', actividadId)
                        .maybeSingle();

                    if (progreso) return;
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                }
            }
        };

        cargarProgreso();
    }, [actividadId, userId]);

    const handleContinue = async () => {
        const payload = { leido: true, fechaCompleto: new Date().toISOString() };

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
        if (onComplete) onComplete();
    };

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

            {/* CONTENEDOR PRINCIPAL RESPONSIVO */}
            <div
                className="bg-white/95 p-4 sm:p-8 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-10 box-border overflow-hidden"
                translate="no"
            >
                {/* TÍTULO PRINCIPAL */}
                {config.titulo && (
                    <div className="text-center px-2">
                        <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-blue-950 break-words leading-tight">
                            {config.titulo}
                        </h1>
                    </div>
                )}

                {/* TARJETA 2: CUENTA DE AHORRO */}
                {secciones.cuentaAhorro && (
                    <div className=" p-5 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-md space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-base sm:text-lg font-bold text-blue-900">
                                {secciones.cuentaAhorro.mensajeCaja}
                            </p>

                            <div className="flex items-center justify-center gap-3 bg-amber-400 py-3 px-6 rounded-2xl sm:rounded-full shadow-sm max-w-full break-words inline-flex my-2">
                                {secciones.cuentaAhorro.logoClub && (
                                    <img
                                        src={secciones.cuentaAhorro.logoClub}
                                        alt="Logo Club"
                                        className="h-8 sm:h-10 object-contain animate-bounce-gentle"
                                    />
                                )}
                                <h2 className="text-xl sm:text-3xl font-black text-blue-950">
                                    {secciones.cuentaAhorro.tituloCuenta}
                                </h2>
                            </div>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-blue-950 text-center max-w-2xl mx-auto">
                            {secciones.cuentaAhorro.descripcion}
                        </p>

                        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                            <div className="space-y-2 flex-1">
                                <p className="text-base sm:text-lg font-black text-blue-900">
                                    {secciones.cuentaAhorro.ejemploLabel}{' '}
                                    <span className="font-bold text-blue-950">
                                        {secciones.cuentaAhorro.ejemploTexto}
                                    </span>
                                </p>
                            </div>
                            {secciones.cuentaAhorro.imagenPlazo && (
                                <img
                                    src={secciones.cuentaAhorro.imagenPlazo}
                                    alt="Misión Corto Plazo"
                                    className="w-36 sm:w-48 object-contain flex-shrink-0 animate-float-slow"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* TARJETA 3: SUBCUENTA "CRECIENDO JUNTOS" */}
                {secciones.creciendoJuntos && (
                    <div className="p-5 sm:p-8 rounded-3xl border-2 border-sky-300 shadow-md space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                            {secciones.creciendoJuntos.logoSubcuenta && (
                                <img
                                    src={secciones.creciendoJuntos.logoSubcuenta}
                                    alt="Logo Subcuenta"
                                    className="h-12 sm:h-16 object-contain animate-bounce-gentle"
                                />
                            )}
                            <h2 className="text-xl sm:text-3xl font-black text-blue-950 break-words">
                                {secciones.creciendoJuntos.tituloSubcuenta}
                            </h2>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-blue-950 text-center max-w-2xl mx-auto">
                            {secciones.creciendoJuntos.descripcion}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-sky-200 space-y-3 shadow-sm">
                                <h3 className="font-black text-lg text-blue-900">Características:</h3>
                                <ul className="space-y-2 text-base sm:text-lg font-bold text-blue-950 list-disc list-inside">
                                    {secciones.creciendoJuntos.caracteristicas?.map((carac, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                            <span className="shrink-0 select-none">🪙</span>
                                            <span>{carac}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {secciones.creciendoJuntos.imagenPlazo && (
                                <div className="flex justify-center">
                                    <img
                                        src={secciones.creciendoJuntos.imagenPlazo}
                                        alt="Misión Largo Plazo"
                                        className="w-40 sm:w-52 object-contain animate-float-slow"
                                    />
                                </div>
                            )}
                        </div>

                        {/* MUESTRA DE EJEMPLOS DE METAS (IMAGEN O LISTA) */}
                        {secciones.creciendoJuntos.ejemplosMetas && (
                            <div className="bg-sky-100/70 p-4 rounded-2xl border border-sky-200 space-y-3">
                                <p className="font-black text-center text-blue-900 text-lg">Ejemplos de metas:</p>
                                
                                {typeof secciones.creciendoJuntos.ejemplosMetas === 'string' ? (
                                    <div className="flex justify-center">
                                        <img
                                            src={secciones.creciendoJuntos.ejemplosMetas}
                                            alt="Ejemplos de metas"
                                            className="w-full max-w-2xl object-contain rounded-xl border border-sky-300 shadow-sm animate-float-slow"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-black text-xs sm:text-sm text-blue-950">
                                        {secciones.creciendoJuntos.ejemplosMetas.map((ejemplo, index) => (
                                            <div
                                                key={index}
                                                className="bg-white p-3 rounded-xl border border-sky-200 shadow-sm flex flex-col justify-center items-center h-full"
                                            >
                                                <span>{ejemplo}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* BOTÓN CONTINUAR */}
                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full sm:w-2/3 py-4 rounded-full font-black text-xl sm:text-2xl shadow-xl transition-all bg-amber-400 text-blue-950 hover:bg-amber-300 hover:scale-105 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act02;