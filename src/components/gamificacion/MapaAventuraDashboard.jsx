import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import MapaActividades from './MapaActividades';
import { BookOpen } from 'lucide-react'; // Puedes reemplazar por el ícono de Lucide que prefieras

function MapaAventuraDashboard({ rango, info }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const userId = usuario?.id;

  const [pasoActual, setPasoActual] = useState(1);
  const [total, setTotal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarMapa, setMostrarMapa] = useState(false);

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
    <div className="space-y-4">
      {/* Botón interactivo con el mismo estilo que Mi Ahorro / ¡A Jugar! */}
      <button
        type="button"
        onClick={() => setMostrarMapa(!mostrarMapa)}
        className="h-28 w-full rounded-3xl overflow-hidden shadow-lg relative group transition hover:scale-[1.01]"
      >
        <img
          src={info?.imgMapa || '/images/mapa-aventura.png'}
          className="w-full h-full object-cover object-top transition group-hover:scale-105"
          alt="Mapa de aventura"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-alianza-azul/80 via-alianza-azul/60 to-alianza-azul/30 flex items-center justify-center gap-3 px-6">
          <BookOpen className="text-white shrink-0" size={32} />
          <div className="flex flex-col items-start justify-center">
            <span className="text-white text-xl md:text-2xl font-black uppercase leading-tight">
              Mapa de aventura
            </span>
          </div>
        </div>
      </button>

      {/* Renderizado condicional del Mapa */}
      {mostrarMapa && (
        <div 
          className="w-full rounded-3xl overflow-hidden shadow-lg relative transition-all duration-300"
          style={{
            backgroundImage: "url('/images/mapa-aventura.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-white/35 backdrop-blur-[0.5px]" />
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
      )}
    </div>
  );
}

export default MapaAventuraDashboard;