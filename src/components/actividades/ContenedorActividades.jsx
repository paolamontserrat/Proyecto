import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// 🔥 SOLO IMPORTAS EL ARRAY
import actividades05 from '../../features/0-5/actividades/actividades';

import Footer from '../Footer';
import CapturarCoordenadas from './CapturarCoordenadas';

const ContenedorActividades = () => {
  const { rango } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [pasoActual, setPasoActual] = useState(
    () => parseInt(localStorage.getItem(`progreso-${rango}`)) || 1
  );

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario ? usuario.id : null;

  // 🔥 JSON
  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then(res => {
        if (!res.ok) throw new Error("Error cargando JSON");
        return res.json();
      })
      .then(setData)
      .catch(err => console.error(err));
  }, [rango]);

  // 🔝 SCROLL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pasoActual]);

  const avanzar = () => {
    const siguiente = pasoActual + 1;
    setPasoActual(siguiente);
    localStorage.setItem(`progreso-${rango}`, siguiente);
  };

  const retroceder = () => {
    if (pasoActual > 1) {
      const anterior = pasoActual - 1;
      setPasoActual(anterior);
      localStorage.setItem(`progreso-${rango}`, anterior);
    } else {
      navigate('/');
    }
  };

  if (!data || !data.pasos) {
    return <div className="p-20 text-center">Cargando actividades...</div>;
  }

  // 🔥 MAPEO POR RANGO
  const actividadesPorRango = {
    "0-5": actividades05,
    // "6-8": actividades68 (cuando lo hagas)
  };

  const actividades = actividadesPorRango[rango] || [];

  const ActividadActual = actividades[pasoActual - 1];
  const pData = data.pasos[pasoActual - 1];

  const DEBUG_COORDENADAS = false;

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
        ) : pasoActual <= data.pasos.length ? (

          ActividadActual ? (
            <ActividadActual
              data={pData}
              onComplete={avanzar}
              onBack={retroceder}
              userId={userId}
              rango={rango}
            />
          ) : (
            <div className="text-center p-10">
              Actividad no encontrada
            </div>
          )

        ) : (

          <div className="text-center p-8 md:p-16 bg-white/95 rounded-[3rem] shadow-2xl border-[6px] md:border-[8px] border-alianza-amarillo mt-10 md:mt-20 max-w-2xl mx-auto">

            <img
              src={`/images/${rango}/33.png`}
              className="mx-auto mb-6 md:mb-8 w-40 md:w-64 drop-shadow-xl"
            />

            <h2 className="text-3xl md:text-5xl font-black text-alianza-azul mb-6">
              ¡Felicidades terminaste las actividades!
            </h2>

            <button
              onClick={() => navigate('/')}
              className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black mb-4 w-full md:w-auto"
            >
              Volver al inicio
            </button>

            <button
              onClick={() => {
                setPasoActual(1);
                localStorage.setItem(`progreso-${rango}`, 1);
              }}
              className="bg-gray-200 text-alianza-azul px-8 py-4 rounded-full font-black w-full md:w-auto"
            >
              Repasar actividades
            </button>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default ContenedorActividades;