import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import MapaActividades from './MapaActividades';

function MapaAventuraDashboard({ rango }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const userId = usuario?.id;

  const [pasoActual, setPasoActual] = useState(1);
  const [total, setTotal] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!userId) { setCargando(false); return; }
      setCargando(true);

      const [{ data: progreso }, jsonRes] = await Promise.all([
        supabase.from('progreso_actividades').select('actividad_id').eq('usuario_id', userId).eq('completada', true),
        fetch(`/data/${rango}.json`).then((r) => r.json()).catch(() => null),
      ]);

      const max = progreso && progreso.length > 0 ? Math.max(...progreso.map((p) => p.actividad_id)) : 0;
      setPasoActual(max + 1);
      setTotal(Array.isArray(jsonRes?.pasos) ? jsonRes.pasos.length : null);
      setCargando(false);
    };
    cargar();
  }, [userId, rango]);

  if (cargando || !userId || !total) return null;

  return (
    <div className="mb-6">
      {/* Título AHORA DENTRO, centrado y llamativo */}
        <div className="relative z-20 pt-6 pb-2 px-4 flex justify-center">
          <div className="bg-white/95 px-6 py-2.5 rounded-2xl shadow-md border border-white/80">
            <h2 className="font-black text-alianza-azul text-xl md:text-2xl text-center tracking-tight">
              🗺️ Mapa de tu aventura
            </h2>
          </div>
        </div>
      
      {/* Contenedor del mapa con la imagen de fondo */}
      <div 
        className="w-full rounded-3xl overflow-hidden shadow-lg relative"
        style={{
          backgroundImage: "url('/images/mapa-aventura.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Capa translúcida blanca para dar contraste y que resalten las piezas */}
        <div className="absolute inset-0 bg-white/35 backdrop-blur-[0.5px]" />

        {/* Contenido de los pasos (por encima de la capa) */}
        <div className="relative z-10 p-4">
          <MapaActividades
            totalPasos={total}
            pasoActual={pasoActual}
            pasoVisible={pasoActual}
            variante="vertical"
            onSeleccionar={(n) => navigate(`/actividades/${rango}?paso=${n}`)}
          />
        </div>
      </div>
    </div>
  );
}

export default MapaAventuraDashboard;