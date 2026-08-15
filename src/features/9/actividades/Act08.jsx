import React, { useEffect, useState } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const estilosAnimacion = `
@keyframes floatSoft {
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-8px)}
}
@keyframes fadeIn{
  from{opacity:0;transform:translateY(10px);}
  to{opacity:1;transform:translateY(0);}
}
.animate-float-soft{
  animation:floatSoft 4s ease-in-out infinite;
}
.animate-fade{
  animation:fadeIn .5s ease;
}
`;

const respuestasIniciales = {
  p1: "",
  p2: "",
  p3: "",
  p4: "",
  p5: "",
};

const Act08 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  const storageKey = `act08-${rango}-${userId}`;

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState(null);
  const [respuestas, setRespuestas] = useState(respuestasIniciales);

  const aplicarInfo = (info) => {
    setRespuestas(info.respuestas || respuestasIniciales);
    setResultado(info.resultado ?? null);
  };

  useEffect(() => {
    const cargar = async () => {
      let cargado = false;

      if (userId !== "anon") {
        const { data: db } = await supabase
          .from("progreso_actividades")
          .select("datos_actividad")
          .eq("usuario_id", userId)
          .eq("actividad_id", data.id)
          .maybeSingle();

        if (db?.datos_actividad) {
          aplicarInfo(db.datos_actividad);

          localStorage.setItem(
            storageKey,
            JSON.stringify(db.datos_actividad)
          );

          cargado = true;
        }
      }

      if (!cargado) {
        const local = localStorage.getItem(storageKey);

        if (local) {
          aplicarInfo(JSON.parse(local));
        }
      }

      setLoading(false);
    };

    cargar();
  }, []);

  useEffect(() => {
    if (loading) return;

    const payload = {
      respuestas,
      resultado,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    const guardar = async () => {
      if (userId === "anon") return;

      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: payload,
          completada: resultado === true,
        },
        {
          onConflict: "usuario_id,actividad_id",
        }
      );
    };

    guardar();
  }, [respuestas, resultado]);

  // Verifica que todas las preguntas tengan respuesta
  const isValid = Object.values(respuestas).every(
    (valor) => valor.trim() !== ""
  );

  const guardarYContinuar = async () => {
    if (!isValid) return;

    // Marca la actividad como completada
    setResultado(true);

    // Espera un momento para que el useEffect guarde
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos.fondo}>
        <div className="text-center p-10 text-2xl font-bold">
          {data.botones.cargando}
        </div>
      </LayoutActividad>
    );
  }
    return (
    <LayoutActividad fondo={data.recursos.fondo}>
      <style>{estilosAnimacion}</style>

      <div className="flex justify-between mb-6">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          {data.botones.regresar}
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          {data.botones.inicio}
        </button>
      </div>

      <div className="bg-white/95 rounded-[35px] border-4 border-alianza-amarillo shadow-xl p-8 animate-fade">
        <h1 className="text-center text-4xl font-black text-alianza-azul mb-8">
          {data.titulo}
        </h1>

        <div className="gap-8 items-center mb-10">
          <div>
            <div className="flex justify-center">
              <img
                src={data.recursos.hormigas}
                className="w-80 animate-float-soft"
                alt=""
              />
            </div>

            <h2 className="text-3xl font-black text-alianza-azul mb-5">
              {data.informacion.titulo}
            </h2>

            <p className="mb-4 text-lg leading-relaxed">
              {data.informacion.descripcion1}
            </p>

            <p className="mb-4 text-lg leading-relaxed">
              {data.informacion.descripcion2}
            </p>

            <p className="font-bold text-xl mb-4">
              {data.informacion.descripcion3}
            </p>

            <img
              src={data.recursos.pizarron}
              className="w-full max-w-md mx-auto mb-5 rounded-2xl shadow-lg"
              alt=""
            />

            <div className="bg-yellow-100 border-l-8 border-yellow-500 rounded-xl p-4 font-bold text-xl text-center mb-5">
              {data.informacion.mensaje}
            </div>

            <p className="mb-4">
              {data.informacion.descripcion4}
            </p>

            <div className="bg-green-100 rounded-xl p-4 font-bold text-green-800">
              {data.informacion.descripcion5}
            </div>
          </div>
        </div>

        <div className="bg-sky-50 rounded-3xl p-8 shadow-lg mb-8">
          <h2 className="text-center text-3xl font-black text-alianza-azul mb-2">
            {data.actividad.titulo}
          </h2>

          <h3 className="text-center text-xl font-bold mb-2">
            {data.actividad.subtitulo}
          </h3>

          <p className="text-center mb-8 text-lg">
            {data.actividad.descripcion}
          </p>

          <div className="space-y-6">
            {data.actividad.preguntas.map((pregunta, index) => (
              <div key={index}>
                <label className="block font-bold text-lg mb-2">
                  {pregunta}
                </label>

                <input
                  type="text"
                  value={respuestas[`p${index + 1}`]}
                  onChange={(e) =>
                    setRespuestas((prev) => ({
                      ...prev,
                      [`p${index + 1}`]: e.target.value,
                    }))
                  }
                  placeholder={data.actividad.placeholder}
                  className="w-full rounded-full border-2 border-sky-300 px-5 py-3"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-bold text-lg">
              {data.actividad.fraseFinal}
            </p>

            <h3 className="text-2xl font-black text-red-500 mt-2">
              {data.actividad.tituloHoja}
            </h3>
          </div>
        </div>

        {resultado !== null && (
          <div
            className={`text-center text-2xl font-black mb-6 ${
              resultado ? "text-green-600" : "text-red-600"
            }`}
          >
            {resultado
              ? data.resultado.exito
              : data.resultado.error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={guardarYContinuar}
            disabled={!isValid}
            className={`px-12 py-4 rounded-full font-black text-xl transition-transform duration-300 ${
              isValid
                ? "bg-alianza-amarillo text-alianza-azul hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isValid
              ? data.botones.continuar
              : "Responde todas las preguntas"}
          </button>
        </div>

      </div>
    </LayoutActividad>
  );
};

export default Act08;