import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act10 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '10';

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

    const keyRespuestas = `act10-respuestas-${safeUserId}-${actividadId}`;
    const keyFile = `act10-file-${safeUserId}-${actividadId}`;

    const [formulario, setFormulario] = useState({
        textoExplicacion: '',
        imagenUrl: '',
    });

    const [subiendoImagen, setSubiendoImagen] = useState(false);

    // FIX SINCRONIZACIÓN MULTIDISPOSITIVO (SUPABASE PRIMERO)
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

                    if (error) {
                        console.error("Error al consultar Supabase:", error.message);
                    } else if (db?.datos_actividad) {
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
                        console.error("Error al parsear respuestas de localStorage:", e);
                    }
                }
            }

            if (datosCargados) {
                setFormulario(datosCargados);
                localStorage.setItem(keyRespuestas, JSON.stringify(datosCargados));
            }
        };

        cargarProgreso();
    }, [userId, actividadId, keyRespuestas]);

    const syncDB = async (nuevoEstado) => {
        setFormulario(nuevoEstado);
        localStorage.setItem(keyRespuestas, JSON.stringify(nuevoEstado));

        if (!userId) return;

        const estaCompleto =
            (nuevoEstado.textoExplicacion?.trim() || '') !== '' &&
            Boolean(nuevoEstado.imagenUrl);

        try {
            const { error } = await supabase
                .from('progreso_actividades')
                .upsert(
                    {
                        usuario_id: userId,
                        actividad_id: actividadId,
                        datos_actividad: nuevoEstado,
                        completada: estaCompleto,
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );

            if (error) {
                console.error("Error al guardar en Supabase:", error.message);
            }
        } catch (err) {
            console.warn("Error guardando progreso en Supabase:", err);
        }
    };

    const manejarCambioTexto = (valor) => {
        const nuevoEstado = { ...formulario, textoExplicacion: valor };
        syncDB(nuevoEstado);
    };

    const handleReiniciar = async () => {
        const estadoVacio = { textoExplicacion: '', imagenUrl: '' };
        localStorage.removeItem(keyRespuestas);
        localStorage.removeItem(keyFile);
        await syncDB(estadoVacio);
    };

    const handleSubirImagen = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSubiendoImagen(true);

        try {
            const fileName = `${safeUserId}/${actividadId}-${Date.now()}`;

            const { error } = await supabase.storage
                .from('autorresponsabilidad')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('autorresponsabilidad')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            localStorage.setItem(keyFile, fileName);

            const nuevoEstado = { ...formulario, imagenUrl: publicUrl };
            await syncDB(nuevoEstado);

        } catch (error) {
            console.error(error);
            alert("Error al subir la imagen. Verifica el bucket 'autorresponsabilidad' en Supabase.");
        } finally {
            setSubiendoImagen(false);
        }
    };

    const eliminarImagen = async () => {
        try {
            const fileName = localStorage.getItem(keyFile);

            if (fileName && userId) {
                await supabase.storage
                    .from('autorresponsabilidad')
                    .remove([fileName]);
            }

            localStorage.removeItem(keyFile);
            const nuevoEstado = { ...formulario, imagenUrl: '' };
            await syncDB(nuevoEstado);

        } catch (error) {
            console.error(error);
            alert("Error al eliminar la imagen");
        }
    };

    const handleContinue = async () => {
        const payloadFinal = {
            ...formulario,
            leido: true,
            fechaCompleto: new Date().toISOString()
        };
        await syncDB(payloadFinal);
        if (onComplete) onComplete();
    };

    const estaFormularioValido =
        (formulario.textoExplicacion?.trim() || '') !== '' &&
        Boolean(formulario.imagenUrl);

    const seccionImagen = config.secciones?.find(s => s.tipo === 'imagen');
    const seccionTexto = config.secciones?.find(s => s.tipo === 'texto');

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>

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
                className="bg-white/95 p-4 sm:p-8 md:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8 box-border overflow-hidden"
                translate="no"
            >
                {/* TÍTULO RESPONSIVO */}
                <div className="text-center px-2">
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-blue-950 break-words leading-tight">
                        {config.titulo || 'AUTORRESPONSABILIDAD EN MI COOPERATIVA'}
                    </h1>
                </div>

                <div className="space-y-8">
                    {/* SECCIÓN 1: SUBIR IMAGEN */}
                    <div className="space-y-3 text-center">
                        <label className="block text-base sm:text-xl font-black text-blue-950 px-2 leading-snug">
                            {seccionImagen?.instrucciones || 'Coloca tu imagen o fotografía'}
                        </label>

                        <div className="bg-white p-4 sm:p-6 rounded-3xl border-3 border-sky-300 shadow-sm flex flex-col items-center justify-center space-y-4">
                            {subiendoImagen ? (
                                <p className="text-blue-900 font-black text-lg animate-pulse">
                                    Subiendo tu imagen...
                                </p>
                            ) : formulario.imagenUrl ? (
                                <div className="relative w-full flex justify-center">
                                    <img
                                        src={formulario.imagenUrl}
                                        alt="Evidencia autorresponsabilidad"
                                        className="max-h-64 object-contain rounded-2xl border-2 border-sky-200 shadow-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={eliminarImagen}
                                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full font-black shadow-lg transition hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer w-full py-8 sm:py-10 border-3 border-dashed border-sky-400 rounded-2xl flex flex-col items-center justify-center hover:bg-sky-50 transition px-2">
                                    <span className="text-4xl mb-2">📸</span>
                                    <span className="font-black text-blue-900 text-base sm:text-lg text-center">
                                        Haz clic aquí para seleccionar imagen
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSubirImagen}
                                        className="hidden"
                                        disabled={subiendoImagen}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 2: TEXTO DE EXPLICACIÓN */}
                    <div className="space-y-3">
                        <label className="block text-center text-base sm:text-xl font-black text-blue-950 px-2 leading-snug">
                            {seccionTexto?.instrucciones || 'Escribe tu explicación'}
                        </label>
                        <textarea
                            rows={4}
                            value={formulario.textoExplicacion || ''}
                            onChange={(e) => manejarCambioTexto(e.target.value)}
                            placeholder="Escribe aquí tu explicación..."
                            className="w-full p-4 rounded-2xl border-3 border-sky-300 font-bold text-blue-950 bg-white focus:outline-none focus:ring-4 focus:ring-sky-400 text-base sm:text-lg shadow-sm resize-none"
                        />
                    </div>
                </div>

                {/* BOTONES ACCIÓN */}
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
                        onClick={handleContinue}
                        disabled={!estaFormularioValido || subiendoImagen}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaFormularioValido || subiendoImagen
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 cursor-pointer"
                        }`}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act10;