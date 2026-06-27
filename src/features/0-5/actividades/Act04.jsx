import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act04 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

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
  const keyFoto = `act04-foto-${safeUserId}-${data.id}`;
  const keyFile = `act04-file-${safeUserId}-${data.id}`;

  const [previewUrl, setPreviewUrl] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // =========================
  // CARGAR LOCAL
  // =========================
  useEffect(() => {
    const savedImage = localStorage.getItem(keyFoto);
    if (savedImage) setPreviewUrl(savedImage);
  }, [safeUserId, data.id]);

  // =========================
  // SYNC SUPABASE
  // =========================
// =========================
// CARGAR DESDE SUPABASE (multi-dispositivo)
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
      .eq('actividad_id', data.id)
      .maybeSingle();

    if (db?.datos_actividad?.url) {
      setPreviewUrl(db.datos_actividad.url);
      // sincronizar local también
      localStorage.setItem(keyFoto, db.datos_actividad.url);
      localStorage.setItem(keyFile, db.datos_actividad.fileName || '');
    } else {
      // fallback local por si acaso
      const savedImage = localStorage.getItem(keyFoto);
      if (savedImage) setPreviewUrl(savedImage);
    }
  };

  cargar();
}, [userId, data.id]);

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
        actividad_id: data.id,
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
      // carpeta por usuario + actividad
      const fileName = `${safeUserId}/${data.id}-${Date.now()}`;

      const { error } = await supabase.storage
        .from('alcancias')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('alcancias')
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
      alert("Error al subir imagen");
    }

    setSubiendo(false);
  };

  // =========================
  // ELIMINAR
  // =========================
  const eliminarImagen = async () => {
    try {
      const fileName = localStorage.getItem(keyFile);

      if (fileName && userId) {
        await supabase.storage
          .from('alcancias')
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
      alert("Error al eliminar imagen");
    }
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo || '/images/0-5/Fondo0-5.png'}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/95 p-4 md:p-10 rounded-[2rem] shadow-2xl border-[6px] border-alianza-amarillo"
      >

        <h2 className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-6">
          {data.titulo}
        </h2>

        {/* INSTRUCCIONES */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 bg-pink-50 p-6 rounded-[2rem] border-4 border-pink-200">
          
          {data.recursos?.puerquitoInstrucciones && (
            <img
              src={data.recursos.puerquitoInstrucciones}
              className="w-32 h-32 md:w-48 mx-auto object-contain"
            />
          )}

          <div className="flex-1">
            <p className="text-xl font-black text-pink-500 mb-2">
              {data.subtitulo}
            </p>

            <ol className="text-base md:text-xl font-bold text-gray-800 space-y-2 list-decimal pl-5">
              {data.contenido?.historia?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* EJEMPLO */}
        <div className="mb-8 w-full overflow-hidden">
          <img
            src={data.recursos?.alcanciasEjemplo}
            className="w-full max-h-[300px] object-contain rounded-2xl"
          />
        </div>

        {/* SUBIDA */}
        <div className="mb-8 border-dashed border-4 border-gray-300 rounded-[2rem] p-4 text-center bg-white min-h-[200px] flex flex-col items-center justify-center">

          {subiendo && (
            <p className="text-blue-600 font-bold">Subiendo imagen...</p>
          )}

          {previewUrl ? (
            <div className="relative w-full flex justify-center">

              <img
                src={previewUrl}
                alt="Tu alcancía"
                className="max-h-[250px] rounded-2xl border-4 border-alianza-azul"
              />

              <button
                onClick={eliminarImagen}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-10 h-10 rounded-full font-bold shadow-lg"
              >
                X
              </button>

            </div>
          ) : (
            <label className="bg-alianza-azul text-white px-6 py-4 rounded-full font-black text-lg cursor-pointer w-full max-w-[300px]">

              Subir Foto de Alcancía

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

        {/* BOTÓN */}
        <button
          onClick={onComplete}
          disabled={!previewUrl}
          className={`w-full py-4 rounded-full font-black text-2xl transition ${
            previewUrl
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {previewUrl ? '¡Reto Cumplido!' : 'Sube tu foto para avanzar'}
        </button>

      </motion.div>
    </LayoutActividad>
  );
};

export default Act04;