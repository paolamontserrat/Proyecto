import React, { useState, useEffect, useRef, useCallback } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act03 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  // =========================
  // USER
  // =========================
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const userId = usuario?.id ?? 'anon';

  // =========================
  // ESTADOS
  // =========================
  const [respuesta, setRespuesta] = useState('');
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');

  const saveTimer = useRef(null);

  const isValid = respuesta.trim().length > 0;

  // =========================
  // CARGA INICIAL SUPABASE
  // =========================
  useEffect(() => {
    if (userId === 'anon') {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      const { data: db } = await supabase
        .from('progreso_actividades')
        .select('datos_actividad')
        .eq('usuario_id', userId)
        .eq('actividad_id', data.id)
        .maybeSingle();

      if (db?.datos_actividad?.texto) {
        setRespuesta(db.datos_actividad.texto);
        setHasData(true);
      }

      setLoading(false);
    };

    cargar();
  }, [userId, data.id]);

  // =========================
  // GUARDAR SUPABASE (UPsert)
  // =========================
  const saveToSupabase = useCallback(
    async (texto) => {
      if (userId === 'anon') return;

      setSyncStatus('saving');

      const completada = texto.trim().length > 0;

      const { error } = await supabase.from('progreso_actividades').upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {
            texto: completada ? texto : ''
          },
          completada
        },
        {
          onConflict: 'usuario_id,actividad_id'
        }
      );

      if (error) {
        setSyncStatus('error');
      } else {
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 1200);
      }
    },
    [userId, data.id]
  );

  // =========================
  // DEBOUNCE SAVE
  // =========================
  const scheduleSave = useCallback(
    (texto) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(texto);
      }, 600);
    },
    [saveToSupabase]
  );

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const val = e.target.value;
    setRespuesta(val);
    scheduleSave(val);
  };

  // =========================
  // FINALIZAR
  // =========================
  const guardarYContinuar = () => {
    if (!isValid) return;
    saveToSupabase(respuesta);
    onComplete();
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold text-xl animate-pulse">
          Cargando tu progreso…
        </div>
      </LayoutActividad>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <span className="text-sm font-medium">
          {syncStatus === 'saving' && <span className="text-yellow-500">⏳ Guardando…</span>}
          {syncStatus === 'saved' && <span className="text-green-500">✅ Guardado</span>}
          {syncStatus === 'error' && <span className="text-red-500">❌ Error</span>}
        </span>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow"
        >
          🏠 Inicio
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        <img src={data.recursos.imagen1} className="w-full max-w-md mx-auto mb-4" />
        <img src={data.recursos.imagen2} className="w-full max-w-md mx-auto mb-6" />

        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">
          <div className="flex-1">
            <div className="bg-orange-600 p-4 rounded-t-2xl">
              <h3 className="text-white font-black text-lg">{data.tips.titulo}</h3>
            </div>
            <div className="bg-orange-400 p-4 rounded-b-2xl text-white font-bold text-sm md:text-base space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </div>
          <img src={data.recursos.imagenTips} className="w-32 md:w-40 object-contain" />
        </div>

        <div className="text-center mb-6 space-y-2">
          {data.contenido.historia.map((linea, i) => (
            <p key={i} className="text-lg md:text-xl font-bold text-gray-800">
              {linea}
            </p>
          ))}
        </div>

        <img src={data.recursos.imagen3} className="w-32 md:w-40 mx-auto mb-0" />

        <div className="relative w-full max-w-md mx-auto mb-6">
          <img src={data.recursos.imagen4} className="w-full" />
          <img
            src={data.recursos.logoCentro}
            className="absolute inset-0 m-auto w-20 md:w-28 object-contain"
          />
        </div>

        {/* INPUT */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner text-center mb-6">
          <p className="text-lg md:text-2xl font-black text-alianza-azul mb-4">
            {data.pregunta}
          </p>

          <input
            type="text"
            value={respuesta}
            onChange={handleChange}
            className="w-full p-4 border-4 border-gray-300 rounded-3xl text-center font-bold text-lg focus:border-alianza-amarillo outline-none"
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarYContinuar}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            isValid
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isValid ? '¡Continuar!' : 'Responde para continuar'}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act03;