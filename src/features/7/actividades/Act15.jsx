import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act15 = ({ data, onComplete, onBack, rango }) => {
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

    // =========================
    // KEYS MULTIUSUARIO
    // =========================
    const keyFoto = `act15-foto-${safeUserId}-${config.id || 'act15'}`;
    const keyFile = `act15-file-${safeUserId}-${config.id || 'act15'}`;

    const [previewUrl, setPreviewUrl] = useState(null);
    const [subiendo, setSubiendo] = useState(false);

    // =========================
    // CARGAR LOCAL Y SUPABASE
    // =========================
    useEffect(() => {
        if (!userId) {
        // usuario anónimo: solo local
        const savedImage = localStorage.getItem(keyFoto);
        if (savedImage) setPreviewUrl(savedImage);
        return;
        }

        const cargar = async () => {
        const { data: db } = await supabase
            .from('progreso_actividades')
            .select('datos_actividad')
            .eq('usuario_id', userId)
            .eq('actividad_id', config.id || 'act15')
            .maybeSingle();

        if (db?.datos_actividad?.url) {
            setPreviewUrl(db.datos_actividad.url);
            localStorage.setItem(keyFoto, db.datos_actividad.url);
            localStorage.setItem(keyFile, db.datos_actividad.fileName || '');
        } else {
            const savedImage = localStorage.getItem(keyFoto);
            if (savedImage) setPreviewUrl(savedImage);
        }
        };

        cargar();
    }, [userId, config.id, keyFoto, keyFile]);

    // =========================
    // SYNC SUPABASE
    // =========================
    const syncDB = async (fileName, url, completada) => {
        if (!userId) return;

        await supabase
        .from('progreso_actividades')
        .upsert(
            {
            usuario_id: userId,
            actividad_id: config.id || 'act15',
            datos_actividad: { fileName, url },
            completada,
            },
            { onConflict: 'usuario_id,actividad_id' }
        );
    };

    // =========================
    // SUBIR IMAGEN
    // =========================
    const manejarCambioImagen = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSubiendo(true);

        try {
        // Guardar dentro de la carpeta ayudaMutua
        const fileName = `${safeUserId}/${config.id || 'act15'}-${Date.now()}`;

        const { error } = await supabase.storage
            .from('ayudaMutua')
            .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('ayudaMutua')
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // LOCAL
        localStorage.setItem(keyFoto, publicUrl);
        localStorage.setItem(keyFile, fileName);

        setPreviewUrl(publicUrl);

        // SUPABASE
        await syncDB(fileName, publicUrl, true);

        } catch (error) {
        console.error(error);
        alert("Error al subir la imagen");
        }

        setSubiendo(false);
    };

    // =========================
    // ELIMINAR IMAGEN
    // =========================
    const eliminarImagen = async () => {
        try {
        const fileName = localStorage.getItem(keyFile);

        if (fileName && userId) {
            await supabase.storage
            .from('ayudaMutua')
            .remove([fileName]);
        }

        // LOCAL
        localStorage.removeItem(keyFoto);
        localStorage.removeItem(keyFile);

        setPreviewUrl(null);

        // SUPABASE
        await syncDB(null, null, false);

        } catch (error) {
        console.error(error);
        alert("Error al eliminar la imagen");
        }
    };

    return (
        <LayoutActividad fondo={config.fondo || '/images/7/Fondo72.jpg'}>
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

        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 p-6 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8"
            translate="no"
        >
            {/* TÍTULO PRINCIPAL */}
            <h1 className="text-2xl sm:text-4xl font-black text-blue-950 text-center leading-tight">
            {config.titulo || "Actividad: Sube una foto tuya practicando el valor de ayuda mutua en casa o escuela."}
            </h1>

            {/* CONTENEDOR DE SUBIDA DE IMAGEN */}
            <div className="border-dashed border-4 border-sky-300 rounded-3xl p-6 text-center bg-sky-50/50 min-h-[260px] flex flex-col items-center justify-center shadow-inner">
            {subiendo && (
                <p className="text-blue-900 font-black text-lg animate-pulse">
                Subiendo tu foto...
                </p>
            )}

            {previewUrl ? (
                <div className="relative w-full flex justify-center">
                <img
                    src={previewUrl}
                    alt="Foto de ayuda mutua"
                    className="max-h-[320px] rounded-2xl border-4 border-amber-400 shadow-md object-contain"
                />
                <button
                    onClick={eliminarImagen}
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full font-black shadow-lg transition hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
                >
                    ✕
                </button>
                </div>
            ) : (
                <label className="bg-amber-400 hover:bg-amber-500 text-blue-950 px-8 py-5 rounded-full font-black text-xl sm:text-2xl cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition border-b-4 border-amber-600">
                📷 Subir Foto
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={manejarCambioImagen}
                    className="hidden"
                />
                </label>
            )}
            </div>

            {/* SECCIÓN REFLEXIVA DE LA COOPERATIVA */}
            <div className="bg-sky-100 border-3 border-sky-300 p-6 sm:p-8 rounded-3xl shadow-md text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-blue-900">
                {config.subtitulo || "La ayuda mutua en las cooperativas"}
            </h2>
            <p className="text-base sm:text-lg font-bold text-blue-950 leading-relaxed max-w-3xl mx-auto">
                {config.contenido?.textoCooperativa ||
                "Las cooperativas, como CAJA POPULAR CERANO, creen en la ayuda mutua. Esto significa que muchas personas trabajan juntas para apoyarse y crecer. Así como en una cooperativa las personas colaboran unas con otras, en la escuela, en casa y con nuestros amigos también podemos ayudarnos para lograr cosas importantes."}
            </p>
            </div>

            {/* BOTÓN CONTINUAR / RETO CUMPLIDO */}
            <div className="pt-2">
            <button
                onClick={onComplete}
                disabled={!previewUrl}
                className={`w-full py-5 rounded-full font-black text-2xl shadow-xl transition-all border-b-4 ${
                previewUrl
                    ? 'bg-amber-400 text-blue-950 hover:scale-105 active:scale-95 border-amber-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 opacity-70'
                }`}
            >
                {previewUrl ? 'Finalizar' : 'Sube tu foto'}
            </button>
            </div>
        </motion.div>
        </LayoutActividad>
    );
};

export default Act15;