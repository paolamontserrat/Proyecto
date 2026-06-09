import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActividadColorear from './ActividadColorear';
import ActividadFamilia from './ActividadFamilia';
import Footer from '../Footer';

const ContenedorActividades = () => {
  const { rango } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  // Estado para el paso actual basado en localStorage
  const [pasoActual, setPasoActual] = useState(() => 
    parseInt(localStorage.getItem(`progreso-${rango}`)) || 1
  );

  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Error cargando JSON:", err));
  }, [rango]);

  const avanzar = () => {
    const siguiente = pasoActual + 1;
    setPasoActual(siguiente);
    localStorage.setItem(`progreso-${rango}`, siguiente);
  };

  const retroceder = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    } else {
      // Si ya está en el primer paso, regresa a la selección de rangos
      navigate('/'); 
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-alianza-azul">Cargando actividades...</p>
      </div>
    );
  }

  // Mapa de componentes integrando las funciones de navegación
  const componentes = {
    1: (
      <ActividadColorear 
        data={data.pasos[0]} 
        onComplete={avanzar} 
        onBack={retroceder} 
      />
    ),
    2: (
      <ActividadFamilia 
        data={data.pasos[1]} 
        onComplete={avanzar} 
        onBack={retroceder} 
      />
    )
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Encabezado fijo o informativo */}
      <header className="p-6 text-center">
        <h1 className="text-2xl font-black text-alianza-azul">
          {data.pasos[pasoActual - 1] ? `Reto: ${data.pasos[pasoActual - 1].titulo}` : "¡Felicidades!"}
        </h1>
      </header>

      {/* Contenido de la actividad */}
      <main className="px-4">
        {componentes[pasoActual] || (
          <div className="text-center p-10 bg-white rounded-3xl shadow-lg border-2 border-alianza-amarillo">
            <h2 className="text-3xl font-black text-alianza-azul mb-4">¡Excelente trabajo!</h2>
            <p className="text-gray-600 mb-6">Has completado todas las actividades de este rango.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-alianza-azul text-white px-8 py-3 rounded-full font-bold"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ContenedorActividades;