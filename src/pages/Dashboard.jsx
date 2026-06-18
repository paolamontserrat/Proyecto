import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Dashboard = () => {
  const { rango } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    // Asegúrate de que el archivo JSON esté en public/data/
    fetch(`/data/${rango}.json`)
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch((err) => console.error("Error al cargar el archivo JSON:", err));
  }, [rango]);

  if (!info) return <div className="flex h-screen items-center justify-center font-black text-alianza-azul">Cargando...</div>;

  const bienvenida = info.paginas[0];

  return (
    <div className="min-h-screen pb-10" style={{ 
  backgroundImage: `url(${info.fondoPasaporte})`,
  backgroundSize: 'cover'
}}>
      
      {/* 1. CABECERA: Imagen de inicio sin cortes */}
      <div className="relative w-full h-auto py-10 bg-white/50 rounded-b-[2rem] shadow-md overflow-hidden flex items-center justify-center">
        <img 
          src={info.portada} 
          alt="Portada"
          className="w-[90%] h-auto object-contain p-2" 
        />
      </div>

      {/* 2. TARJETA DE BIENVENIDA (Diseño Moderno) */}
      <div className="px-6 mt-6">
        <div className="bg-white/95 p-8 rounded-[2.5rem] border-2 border-alianza-azul shadow-2xl backdrop-blur-md">
          
          <h2 className="text-3xl font-black text-alianza-azul mb-6 uppercase tracking-tight text-center">
            {bienvenida.titulo}
          </h2>

          <p className="whitespace-pre-line text-lg text-gray-800 leading-relaxed mb-8 font-medium">
            {bienvenida.intro}
          </p>

          {/* Sección de SECCIONES (Programa y Cuentas) */}
          <div className="grid gap-6 mb-8">
            {bienvenida.secciones.map((sec, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-3xl">{sec.icono}</span>
                <div>
                  <h3 className="text-lg font-black text-alianza-azul uppercase">{sec.subtitulo}</h3>
                  <p className="text-base text-gray-700 leading-snug">{sec.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Beneficios */}
          <div className="bg-alianza-azul p-6 rounded-2xl text-white">
            <h3 className="text-lg font-black text-alianza-amarillo uppercase mb-4">Beneficios:</h3>
            <ul className="space-y-4">
              {bienvenida.beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base font-medium">
                  <span className="text-alianza-amarillo mt-1">•</span> 
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. MENÚ INTERACTIVO */}
      <div className="px-6 mt-8 grid grid-cols-1 gap-4">
        <button 
          onClick={() => navigate(`/pasaporte/${rango}`)} 
          className="h-28 w-full rounded-3xl overflow-hidden shadow-lg border-2 border-alianza-azul relative"
        >
           <img src={info.imgAhorro} alt="Ahorro" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-alianza-azul/60 flex items-center justify-center">
             <span className="text-white text-2xl font-black uppercase">Mi Ahorro</span>
           </div>
        </button>

        <button 
          onClick={() => navigate(`/actividades/${rango}`)} 
          className="h-28 w-full rounded-3xl overflow-hidden shadow-lg border-2 border-alianza-amarillo relative"
        >
           <img src={info.imgJuegos} alt="Juegos" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-alianza-amarillo/60 flex items-center justify-center">
             <span className="text-alianza-azul text-2xl font-black uppercase">¡A Jugar!</span>
           </div>
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;