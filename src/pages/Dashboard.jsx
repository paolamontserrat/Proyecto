import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PiggyBank, Gamepad2, LogOut } from "lucide-react";
import Footer from "../components/Footer";
import AvisoDiplomas from "../components/AvisoDiplomas";
import AvisoRetos from "../components/AvisoRetos";
import ProgresoAventura from "../components/gamificacion/ProgresoAventura";
import MapaAventuraDashboard from "../components/gamificacion/MapaAventuraDashboard";

const Dashboard = () => {
  const { rango } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch((err) => console.error("Error al cargar el archivo JSON:", err));
  }, [rango]);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  if (!info)
    return (
      <div className="flex h-screen items-center justify-center font-black text-alianza-azul">
        Cargando...
      </div>
    );

  const bienvenida = info.paginas[0];
  const inicial = (usuario?.nombre || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className="min-h-screen pb-10"
      style={{
        backgroundImage: `url(${info.fondoPasaporte})`,
        backgroundSize: "cover",
      }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-alianza-azul text-white flex items-center justify-center font-black text-lg shadow">
            {inicial}
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none">Hola,</p>
            <h1 className="text-lg font-black text-alianza-azul leading-tight">
              {usuario?.nombre || "Invitado"} 👋
            </h1>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded-full font-bold text-sm shadow"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>

      {/* PORTADA */}
      <div className="px-6 mt-2">
        <div className="w-full py-8 bg-white/60 rounded-[2rem] shadow-lg overflow-hidden flex items-center justify-center">
          <img
            src={info.portada}
            alt="Portada"
            className="w-[85%] h-auto object-contain drop-shadow-md"
          />
        </div>
      </div>
      {/* AVISO DE DIPLOMAS PENDIENTES */}
      <div className="px-6 mt-4">
        <AvisoDiplomas />
      </div>
      <div className="px-6 mt-4">
        <AvisoRetos />
      </div>

      {/* 🚀 PROGRESO DE AVENTURA */}
      {/* <div className="px-6">
        <ProgresoAventura rango={rango} />
      </div> */}

      {/* BIENVENIDA */}
      <div className="px-6 mt-6">
        <div className="bg-white/95 p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-black text-alianza-azul mb-1 uppercase tracking-tight text-center">
            {bienvenida.titulo}
          </h2>
          <div className="w-16 h-1.5 bg-alianza-amarillo rounded-full mx-auto mb-6" />

          <p className="whitespace-pre-line text-base md:text-lg text-gray-700 leading-relaxed mb-8">
            {bienvenida.intro}
          </p>

          <div className="grid gap-4 mb-8">
            {bienvenida.secciones.map((sec, i) => (
              <div
                key={i}
                className="flex gap-4 items-start bg-gray-50 rounded-2xl p-4 border border-gray-100"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-alianza-azul/10 flex items-center justify-center text-2xl">
                  {sec.icono}
                </div>
                <div>
                  <h3 className="text-base font-black text-alianza-azul uppercase">
                    {sec.subtitulo}
                  </h3>
                  <p className="text-sm text-gray-600 leading-snug mt-0.5">
                    {sec.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-alianza-azul p-6 rounded-2xl text-white">
            <h3 className="text-lg font-black text-alianza-amarillo uppercase mb-4">
              Beneficios
            </h3>
            <ul className="space-y-3">
              {bienvenida.beneficios.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm md:text-base font-medium"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-alianza-amarillo text-alianza-azul flex items-center justify-center text-xs font-black mt-0.5">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MENÚ */}
      <div className="px-6 mt-8 grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate(`/pasaporte/${rango}`)}
          className="h-28 w-full rounded-3xl overflow-hidden shadow-lg relative group transition hover:scale-[1.01]"
        >
          <img
            src={info.imgAhorro}
            className="w-full h-full object-cover transition group-hover:scale-105"
            alt="Mi ahorro"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-alianza-azul/80 via-alianza-azul/60 to-alianza-azul/30 flex items-center justify-center gap-3 px-6">
            <PiggyBank className="text-white shrink-0" size={32} />
            <span className="text-white text-xl md:text-2xl font-black uppercase">
              Mi Ahorro
            </span>
          </div>
        </button>
        <button
          onClick={() => navigate(`/actividades/${rango}`)}
          className="h-28 w-full rounded-3xl overflow-hidden shadow-lg relative group transition hover:scale-[1.01]"
        >
          <img
            src={info.imgJuegos}
            className="w-full h-full object-cover transition group-hover:scale-105"
            alt="A jugar"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-alianza-amarillo/85 via-alianza-amarillo/65 to-alianza-amarillo/30 flex items-center justify-center gap-3 px-6">
            <Gamepad2 className="text-alianza-azul shrink-0" size={32} />
            <span className="text-alianza-azul text-2xl md:text-2xl font-black uppercase">
              ¡A Jugar!
            </span>
          </div>
        </button>
      </div>

     {/* MENÚ Y MAPA */}
      <div className="px-6 mt-8">
        <MapaAventuraDashboard rango={rango} info={info} />
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
