import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
const Home = () => {
  const navigate = useNavigate();

  const rangosEdades = [
    { label: "0 a 5 Años", color: "bg-alianza-rosa", id: "0-5" },
    { label: "6 a 8 Años", color: "bg-alianza-amarillo", id: "6-8" },
    { label: "9 a 12 Años", color: "bg-alianza-azul", id: "9-12" },
    { label: "13 a 15 Años", color: "bg-alianza-azul", id: "13-15" },
    { label: "16 a 17 Años", color: "bg-alianza-azul", id: "16-17" },
  ];

  return (
    <div className="p-6 bg-azul-fondo min-h-screen text-center">
      <h1 className="text-3xl font-black text-alianza-azul mb-2 uppercase">Bienvenido</h1>
      <p className="text-alianza-azul mb-8 font-bold">Selecciona tu pasaporte:</p>
      
      <div className="grid gap-4 max-w-sm mx-auto">
        {rangosEdades.map((rango) => (
          <button 
            key={rango.id}
            // CAMBIO AQUÍ: Ahora redirige al dashboard, no directo al pasaporte
            onClick={() => navigate(`/dashboard/${rango.id}`)}
            className={`${rango.color} p-6 rounded-3xl font-black text-alianza-azul text-xl shadow-lg hover:scale-105 transition-transform border-2 border-alianza-azul`}
          >
            {rango.label}
          </button>
        ))}
      </div>
        <Footer />
    </div>
  );
};

export default Home;