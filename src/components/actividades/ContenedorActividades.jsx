import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import actividades05 from '../../features/0-5/actividades/actividades';
import actividades68 from '../../features/6-8/actividades/actividades';
import actividades912 from '../../features/9-12/actividades/actividades';

import Footer from '../Footer';
import CapturarCoordenadas from './CapturarCoordenadas';
import { supabase } from '../../supabaseClient';

const ContenedorActividades = () => {

  const { rango } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  // =========================
  // USER MULTIUSUARIO
  // =========================
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario?.id || "anon";

  const progresoKey = `progreso-${userId}-${rango}`;

  const [pasoActual, setPasoActual] = useState(() => {
    const guardado = parseInt(localStorage.getItem(progresoKey));
    return isNaN(guardado) ? 1 : guardado;
  });

  const actividadesPorRango = {
    "0-5": actividades05,
    "6-8": actividades68,
    "9-12": actividades912,
  };

  const actividades = actividadesPorRango[rango] || [];

  // =========================
  // CARGAR JSON
  // =========================
  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [rango]);

  // =========================
  // SCROLL
  // =========================
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pasoActual]);

  // =========================
  // SINCRONIZAR PROGRESO (SUPABASE + LOCAL)
  // =========================
  useEffect(() => {

    const sync = async () => {
      if (userId === "anon") return;

      try {
        const { data: progreso } = await supabase
          .from('progreso_actividades')
          .select('actividad_id')
          .eq('usuario_id', userId)
          .eq('completada', true);

        if (!progreso || progreso.length === 0) {
          setPasoActual(1);
          localStorage.setItem(progresoKey, 1);
          return;
        }

        const max = Math.max(...progreso.map(p => p.actividad_id));
        const siguiente = max + 1;

        setPasoActual(siguiente);
        localStorage.setItem(progresoKey, siguiente);

      } catch (err) {
        console.warn("Sync error:", err);
      }
    };

    sync();

  }, [userId, rango]);

  // =========================
  // TOTAL PASOS
  // =========================
  const totalPasos = Math.min(
    data?.pasos?.length || 0,
    actividades.length || 0
  );

  const pasoSeguro = Math.min(pasoActual, totalPasos || 1);

  // =========================
  // GUARDAR PROGRESO
  // =========================
  const guardarProgreso = async (idActividad) => {
    if (userId === "anon") return;

    try {
      await supabase.from('progreso_actividades').upsert({
        usuario_id: userId,
        actividad_id: idActividad,
        completada: true
      }, {
        onConflict: 'usuario_id,actividad_id'
      });
    } catch {}
  };

  // =========================
  // AVANZAR
  // =========================
  const avanzar = () => {
    const actividadActual = actividades[pasoSeguro - 1];
    const idReal = actividadActual?.id || pasoSeguro;

    guardarProgreso(idReal);

    const siguiente = pasoSeguro + 1;

    setPasoActual(siguiente);
    localStorage.setItem(progresoKey, siguiente);
  };

  // =========================
  // RETROCEDER
  // =========================
  const retroceder = () => {
    if (pasoActual > 1) {
      const anterior = pasoActual - 1;
      setPasoActual(anterior);
      localStorage.setItem(progresoKey, anterior);
    } else {
      navigate('/');
    }
  };

  // =========================
  // ESTADOS BASE
  // =========================
  if (!data?.pasos) {
    return <div className="p-20 text-center">Cargando actividades...</div>;
  }

  if (actividades.length === 0) {
    return <div className="p-20 text-center">Sin actividades configuradas</div>;
  }

  // =========================
  // FINAL
  // =========================
  if (pasoActual > totalPasos) {
    return (
      <div
        className="min-h-screen pb-12"
        style={{
          backgroundImage: `url('/images/${rango}/Fondo${rango}.png')`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed'
        }}
      >
        <main className="container mx-auto px-4">

          <div className="text-center p-8 md:p-16 bg-white/95 rounded-[3rem] shadow-2xl border-[8px] border-alianza-amarillo mt-20 max-w-2xl mx-auto">

            <img
              src={`/images/${rango}/33.png`}
              className="mx-auto mb-8 w-40 md:w-64"
            />

            <h2 className="text-3xl md:text-5xl font-black text-alianza-azul mb-6">
              ¡Felicidades terminaste las actividades!
            </h2>

            <button
              onClick={() => navigate(`/dashboard/${rango}`)}
              className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black mb-4 w-full md:w-auto"
            >
              Volver al inicio
            </button>

            <button
              onClick={() => {
                setPasoActual(1);
                localStorage.setItem(progresoKey, 1);
              }}
              className="bg-gray-200 text-alianza-azul px-8 py-4 rounded-full font-black w-full md:w-auto"
            >
              Repasar actividades
            </button>

          </div>

        </main>

        <Footer />
      </div>
    );
  }

  const ActividadActual = actividades[pasoSeguro - 1];
  const pData = data.pasos[pasoSeguro - 1];

  if (!ActividadActual || !pData) {
    return (
      <div className="text-center p-20">
        Error: actividad no encontrada o desincronizada
      </div>
    );
  }

  const DEBUG_COORDENADAS = false; // Cambiar a true para capturar coordenadas

  return (
    <div
      className="min-h-screen pb-12"
      style={{
        backgroundImage: `url('/images/${rango}/Fondo${rango}.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <main className="container mx-auto px-4">

        {DEBUG_COORDENADAS ? (
          <CapturarCoordenadas
            imagen={`/images/${rango}/20.png`}
            total={6}
          />
        ) : (
          <ActividadActual
            data={pData}
            onComplete={avanzar}
            onBack={retroceder}
            userId={userId}
            rango={rango}
          />
        )}

      </main>

      <Footer />
    </div>
  );
};

export default ContenedorActividades;