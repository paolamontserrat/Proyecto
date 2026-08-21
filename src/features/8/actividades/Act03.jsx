import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const actividadId = config.id || '3';

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

    // KEYS MULTIUSUARIO
    const keyRespuestas = `act03-respuestas-${safeUserId}-${actividadId}`;
    const keyFile = `act03-file-${safeUserId}-${actividadId}`;

    const [formulario, setFormulario] = useState({
        meta: '',
        porQue: '',
        queHare: '',
        imagenUrl: '',
    });

    const [subiendoImagen, setSubiendoImagen] = useState(false);

    // =========================
    // CARGAR DESDE SUPABASE Y LOCALSTORAGE
    // =========================
    useEffect(() => {
        const cargarProgreso = async () => {
            let datosCargados = null;

            // 1. Intentar cargar prioritariamente de Supabase si hay un userId válido
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

            // 2. Si no se encontró en la nube (o no hay userId), usar el almacenamiento local como respaldo
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

            // 3. Actualizar el estado local con los datos recuperados
            if (datosCargados) {
                setFormulario(datosCargados);
                localStorage.setItem(keyRespuestas, JSON.stringify(datosCargados));
            }
        };

        cargarProgreso();
    }, [userId, actividadId, keyRespuestas]);

    // =========================
    // SYNC SUPABASE Y LOCALSTORAGE
    // =========================
    const syncDB = async (nuevoEstado) => {
        setFormulario(nuevoEstado);
        localStorage.setItem(keyRespuestas, JSON.stringify(nuevoEstado));

        if (!userId) return;

        const estaCompleto = validarFormulario(nuevoEstado);

        try {
            const { error } = await supabase
                .from('progreso_actividades')
                .upsert(
                    {
                        usuario_id: userId,
                        actividad_id: actividadId,
                        datos_actividad: nuevoEstado, // Conserva el formulario con las respuestas e imagen
                        completada: estaCompleto,
                    },
                    { onConflict: 'usuario_id,actividad_id' }
                );

            if (error) console.error("Error al actualizar Supabase:", error.message);
        } catch (err) {
            console.warn("Error en syncDB:", err);
        }
    };

    const manejarCambio = (campo, valor) => {
        const nuevoEstado = { ...formulario, [campo]: valor };
        syncDB(nuevoEstado);
    };

    const handleSubirImagen = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSubiendoImagen(true);

        try {
            const fileName = `${safeUserId}/${actividadId}-${Date.now()}`;

            const { error: uploadError } = await supabase.storage
                .from('metas')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('metas')
                .getPublicUrl(fileName);

            localStorage.setItem(keyFile, fileName);

            const nuevoEstado = { ...formulario, imagenUrl: urlData.publicUrl };
            await syncDB(nuevoEstado);

        } catch (error) {
            console.error(error);
            alert("Error al subir la imagen a Supabase Storage.");
        } finally {
            setSubiendoImagen(false);
        }
    };

    const eliminarImagen = async () => {
        try {
            const fileName = localStorage.getItem(keyFile);

            if (fileName && userId) {
                await supabase.storage
                    .from('metas')
                    .remove([fileName]);
            }

            localStorage.removeItem(keyFile);
            const nuevoEstado = { ...formulario, imagenUrl: '' };
            await syncDB(nuevoEstado);

        } catch (error) {
            console.error(error);
        }
    };

    const validarFormulario = (estado) => {
        if (!config.campos) {
            return Boolean(estado.imagenUrl) && 
                   Boolean(estado.meta?.trim()) && 
                   Boolean(estado.porQue?.trim()) && 
                   Boolean(estado.queHare?.trim());
        }

        return config.campos.every((campo) => {
            if (campo.id === 'imagen') return Boolean(estado.imagenUrl);
            const valor = estado[campo.id];
            return typeof valor === 'string' && valor.trim() !== '';
        });
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

    const estaFormularioValido = validarFormulario(formulario);

    return (
        <LayoutActividad fondo={config.fondo || '/images/8/Fondo81.jpeg'}>
            <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto px-2">
                <button onClick={onBack} className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg">
                    ← Regresar
                </button>
                <button onClick={() => navigate(`/dashboard/${rango}`)} className="bg-blue-900 text-white px-6 py-3 rounded-full font-extrabold shadow-lg">
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8" translate="no">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-blue-950">
                        {config.titulo || 'Diseña tu meta'}
                    </h1>
                </div>

                <div className="space-y-6">
                    {config.campos?.map((campo) => {
                        if (campo.tipo === 'input') {
                            return (
                                <div key={campo.id} className="space-y-2">
                                    <label className="block text-center text-xl font-black text-blue-950">{campo.label}</label>
                                    <input
                                        type="text"
                                        value={formulario[campo.id] || ''}
                                        onChange={(e) => manejarCambio(campo.id, e.target.value)}
                                        placeholder={campo.placeholder}
                                        className="w-full p-4 rounded-2xl border-3 border-sky-300 font-bold text-blue-950 bg-white"
                                    />
                                </div>
                            );
                        }

                        if (campo.tipo === 'textarea') {
                            return (
                                <div key={campo.id} className="space-y-2">
                                    <label className="block text-center text-xl font-black text-blue-950">{campo.label}</label>
                                    <textarea
                                        rows={3}
                                        value={formulario[campo.id] || ''}
                                        onChange={(e) => manejarCambio(campo.id, e.target.value)}
                                        placeholder={campo.placeholder}
                                        className="w-full p-4 rounded-2xl border-3 border-sky-300 font-bold text-blue-950 bg-white resize-none"
                                    />
                                </div>
                            );
                        }

                        if (campo.id === 'imagen' || campo.tipo === 'file') {
                            return (
                                <div key={campo.id} className="space-y-3 text-center">
                                    <label className="block text-xl font-black text-blue-950">{campo.label}</label>
                                    <div className="bg-white p-6 rounded-3xl border-3 border-sky-300 shadow-sm flex flex-col items-center justify-center">
                                        {subiendoImagen ? (
                                            <p className="text-blue-900 font-black animate-pulse">Subiendo imagen...</p>
                                        ) : formulario.imagenUrl ? (
                                            <div className="relative w-full flex justify-center">
                                                <img src={formulario.imagenUrl} alt="Meta cargada" className="max-h-56 object-contain rounded-2xl" />
                                                <button type="button" onClick={eliminarImagen} className="absolute -top-3 -right-3 bg-red-500 text-white w-10 h-10 rounded-full font-black">✕</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer w-full py-8 border-3 border-dashed border-sky-400 rounded-2xl flex flex-col items-center justify-center">
                                                <span className="text-4xl mb-2">📸</span>
                                                <span className="font-black text-blue-900">Seleccionar imagen</span>
                                                <input type="file" accept="image/*" onChange={handleSubirImagen} className="hidden" disabled={subiendoImagen} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!estaFormularioValido || subiendoImagen}
                        className={`w-full py-4 rounded-full font-black text-xl shadow-lg ${
                            !estaFormularioValido || subiendoImagen
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-amber-400 text-blue-950 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act03;