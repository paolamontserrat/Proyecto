import React, { useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act01 = ({ data, onBack, onComplete, rango }) => {

  const navigate = useNavigate();
  

  const contenido = data?.contenido || {};

  // =========================
  // USER SEGURO
  // =========================
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };

  const userId = getUser()?.id || "anon";

  // =========================
  // KEY MULTIUSUARIO
  // =========================
  const storageKey = `act01-${rango}-${userId}`;

  // =========================
  // GUARDAR PROGRESO
  // =========================
  const guardar = async () => {

    // LOCAL
    localStorage.setItem(storageKey, JSON.stringify({}));

    // SUPABASE
    if (userId !== "anon") {
      try {
        await supabase
          .from("progreso_actividades")
          .upsert(
            {
              usuario_id: userId,
              actividad_id: data.id,
              datos_actividad: {},
              completada: true,
            },
            {
              onConflict: "usuario_id,actividad_id",
            }
          );
      } catch (err) {
        console.warn("Offline, se sincroniza después");
      }
    }
  };

  // =========================
  // GUARDAR AL ENTRAR
  // =========================
  useEffect(() => {
    guardar();
  }, [userId]);

  // =========================
  // REINTENTO CUANDO HAY INTERNET
  // =========================
  useEffect(() => {
    const handleOnline = () => guardar();

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [userId]);

  // =========================
  // CONTINUAR
  // =========================
  const handleContinue = async () => {
    await guardar();
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(`/dashboard/${rango}`)} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow">
          🏠 Inicio
        </button>
      </div>

    <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">


        {/* Título */}
        <h1
          className="text-center font-extrabold text-blue-900 mb-8"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)"
          }}
        >
          {data?.titulo}
        </h1>

        {/* Información */}
        <div className="w-full bg-white/90 rounded-3xl shadow-lg p-8 mb-6">

          <h2 className="text-3xl font-bold text-blue-900 mb-3">
            {contenido.tituloSecundario}
          </h2>

          <p className="text-xl text-gray-800 leading-relaxed">
            {contenido.descripcion}
          </p>

        </div>

        {/* Cuadro azul */}
        <div className="w-full bg-sky-600 rounded-3xl text-white p-8 mb-8 shadow-lg">

          <h3 className="text-2xl font-bold italic mb-6">
            {contenido.subtitulo}
          </h3>

          <div className="space-y-5">

            {contenido.puntos?.map((texto, index) => (
              <div
                key={index}
                className="flex items-start"
              >
                <span className="text-yellow-300 text-3xl mr-4">
                  ✔
                </span>

                <p className="text-xl leading-relaxed">
                  {texto}
                </p>
              </div>
            ))}

          </div>

        </div>

        {/* Imagen */}
        {data?.imagen && (
          <img
            src={data.imagen}
            alt="Ilustración"
            className="w-72 md:w-96 object-contain center mx-auto mb-8 rounded-2xl shadow-lg"
          />
        )}

        {/* BOTÓN */}
        <button
          onClick={handleContinue}
          className="w-full mt-8 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul hover:scale-[1.02] transition"
        >
          Continuar
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act01;