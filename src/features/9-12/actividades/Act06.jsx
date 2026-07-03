import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// Animaciones suaves y consistentes con el resto de las actividades,
// más una animación de "flip" para las tarjetas de descubrimiento.
const estilosAnimacion = `
@keyframes floatSoft {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-float-soft {
  animation: floatSoft 4.5s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out both;
}
.animate-pop-in {
  animation: popIn 0.35s ease-out both;
}
.tarjeta-flip {
  perspective: 1000px;
}
.tarjeta-flip-inner {
  transition: transform 0.5s;
  transform-style: preserve-3d;
  position: relative;
}
.tarjeta-flip-inner.volteada {
  transform: rotateY(180deg);
}
.tarjeta-cara {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.tarjeta-cara-frontal {
  position: relative;
}
.tarjeta-cara-trasera {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
}
`;

const Act06 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };

  const userId = getUser()?.id || "anon";
  const storageKey = `act06-${rango}-${userId}`;

  const [escenaActual, setEscenaActual] = useState(0);
  const [revelados, setRevelados] = useState({});

  const escenas = data.escenas;
  const esUltimaEscena = escenaActual === escenas.length - 1;

  // =========================
  // GUARDAR PROGRESO (misma lógica que Act01: es informativa,
  // se marca como completada al entrar y se reintenta si no hay internet)
  // =========================
  const guardar = async () => {
    localStorage.setItem(storageKey, JSON.stringify({}));

    if (userId !== "anon") {
      try {
        await supabase.from("progreso_actividades").upsert(
          {
            usuario_id: userId,
            actividad_id: data.id,
            datos_actividad: {},
            completada: true,
          },
          { onConflict: "usuario_id,actividad_id" },
        );
      } catch (err) {
        console.warn("Offline, se sincroniza después");
      }
    }
  };

  useEffect(() => {
    guardar();
  }, [userId]);

  useEffect(() => {
    const handleOnline = () => guardar();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [userId]);

  const handleContinue = async () => {
    await guardar();
    onComplete();
  };

  const irSiguiente = () => {
    if (!esUltimaEscena) setEscenaActual((prev) => prev + 1);
  };

  const irAnterior = () => {
    if (escenaActual > 0) setEscenaActual((prev) => prev - 1);
  };

  const revelarItem = (key) => {
    setRevelados((prev) => ({ ...prev, [key]: true }));
  };

  const escena = escenas[escenaActual];

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      <style>{estilosAnimacion}</style>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow transition-transform duration-300 hover:scale-105"
        >
          {data.botones.regresar}
        </button>
        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow transition-transform duration-300 hover:scale-105"
        >
          {data.botones.inicio}
        </button>
      </div>

      <div
        className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl relative overflow-hidden"
        translate="no"
      >
        {/* GLOBO decorativo flotando cerca del título */}
        <img
          src={data.recursos.globo}
          alt=""
          className="hidden md:block w-16 absolute top-6 right-8 animate-float-soft"
        />

        {/* TITULO */}
        <h1
          className="text-center font-extrabold mb-2 bg-alianza-azul rounded-2xl py-4 px-4"
          style={{ fontSize: "clamp(1.7rem, 4vw, 3rem)" }}
        >
          {data.titulo.partes.map((parte, i) => (
            <span key={i} className={parte.color}>
              {parte.texto}
            </span>
          ))}
        </h1>

        {/* INDICADOR DE PÁGINAS */}
        <div className="flex justify-center gap-2 mb-6">
          {escenas.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === escenaActual
                  ? "w-8 bg-alianza-azul"
                  : "w-2.5 bg-alianza-azul/30"
              }`}
            />
          ))}
        </div>

        {/* CONTENIDO DE LA ESCENA (se reanima al cambiar de página) */}
        <div key={escenaActual} className="animate-fade-in-up">
          <div className="w-full bg-white/90 rounded-3xl shadow-lg p-6 md:p-8 mb-6 space-y-4">
            {escena.parrafos.map((p, i) => {
              if (p.tipo === "cita") {
                return (
                  <p
                    key={i}
                    className="text-xl italic text-alianza-azul font-bold border-l-4 border-alianza-amarillo pl-4"
                  >
                    {p.texto}
                  </p>
                );
              }
              if (p.tipo === "destacado") {
                return (
                  <p
                    key={i}
                    className="text-2xl font-black text-alianza-azul text-center"
                  >
                    {p.texto}
                  </p>
                );
              }
              return (
                <p key={i} className="text-xl text-gray-800 leading-relaxed">
                  {p.texto}
                </p>
              );
            })}
          </div>

          {/* LISTA INTERACTIVA (tarjetas para descubrir) */}
          {escena.lista && (
            <div className="w-full bg-sky-600 rounded-3xl text-white p-6 md:p-8 mb-8 shadow-lg">
              <h3 className="text-2xl font-bold italic mb-6">
                {escena.listaTitulo}
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {escena.lista.map((texto, i) => {
                  const key = `${escenaActual}-${i}`;
                  const abierta = !!revelados[key];
                  return (
                    <div key={key} className="tarjeta-flip h-24">
                      <div
                        onClick={() => revelarItem(key)}
                        className={`tarjeta-flip-inner h-full w-full cursor-pointer ${
                          abierta ? "volteada" : ""
                        }`}
                      >
                        {/* Frente: invita a tocar */}
                        <div className="tarjeta-cara tarjeta-cara-frontal h-full w-full bg-white/15 border-2 border-dashed border-white/70 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/25 transition-colors">
                          <span className="text-2xl">🔍</span>
                          <span className="text-sm font-bold">
                            {data.botones.tocaParaDescubrir}
                          </span>
                        </div>

                        {/* Trasera: revela el aprendizaje */}
                        <div className="tarjeta-cara tarjeta-cara-trasera h-full w-full bg-white rounded-2xl flex items-center p-3 shadow-lg">
                          <span className="text-yellow-500 text-2xl mr-3 animate-pop-in">
                            ✔
                          </span>
                          <p className="text-alianza-azul font-bold text-base leading-snug">
                            {texto}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTA FINAL DESTACADA */}
          {escena.notaFinal && (
            <div className="w-full bg-yellow-100 border-2 border-alianza-amarillo rounded-3xl p-6 mb-8">
              <p className="text-lg text-gray-800 leading-relaxed">
                {escena.notaFinal.pre}
                <b className="text-alianza-azul">
                  {escena.notaFinal.resaltado}
                </b>
                {escena.notaFinal.post}
              </p>
            </div>
          )}

          {/* FRASE FINAL DE CIERRE */}
          {escena.fraseFinal && (
            <div className="relative mb-8">
              {/* Caja decorativa detrás */}
              <img
                src={data.recursos.caja}
                alt=""
                className="hidden md:block w-24 absolute -left-2 -top-4 opacity-90"
              />
              <h3
                className="text-center font-black relative"
                style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)" }}
              >
                {escena.fraseFinal.partes.map((parte, i) => (
                  <span key={i} className={parte.color}>
                    {parte.texto}
                  </span>
                ))}
              </h3>
            </div>
          )}

          {/* IMAGEN DE LA ESCENA */}
          {escena.imagen && (
            <img
              src={data.recursos[escena.imagen]}
              alt="Ilustración"
              className="w-72 md:w-96 object-contain mx-auto mb-4 rounded-2xl animate-float-soft"
            />
          )}
        </div>

        {/* NAVEGACIÓN */}
        <div className="flex gap-4 mt-6">
          {escenaActual > 0 && (
            <button
              onClick={irAnterior}
              className="flex-1 py-4 rounded-full font-black text-lg bg-gray-200 text-alianza-azul transition-transform duration-300 hover:scale-[1.02]"
            >
              {data.botones.anterior}
            </button>
          )}

          {!esUltimaEscena ? (
            <button
              onClick={irSiguiente}
              className="flex-1 py-4 rounded-full font-black text-lg bg-alianza-azul text-white transition-transform duration-300 hover:scale-[1.02]"
            >
              {data.botones.siguiente}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="flex-1 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul transition-transform duration-300 hover:scale-[1.02]"
            >
              {data.botones.continuar}
            </button>
          )}
        </div>
      </div>
    </LayoutActividad>
  );
};

export default Act06;