import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// Animaciones propias, más suaves que las de Tailwind por defecto
// (animate-bounce / animate-pulse originales se sentían muy fuertes
// y distraían de la lectura). Se inyectan una sola vez.
const estilosAnimacion = `
@keyframes floatSoft {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes glowSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.88; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-float-soft {
  animation: floatSoft 4.5s ease-in-out infinite;
}
.animate-glow-soft {
  animation: glowSoft 3.2s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out both;
}
`;

const Act04 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  const storageKey = `act04-${rango}-${userId}`;

  const mezclar = (array) => [...array].sort(() => Math.random() - 0.5);

  const preguntasVacias = { p1: "", p2: "", p3: "" };

  const [situaciones, setSituaciones] = useState([]);
  const [marcadas, setMarcadas] = useState({});
  const [respuestaCarlos, setRespuestaCarlos] = useState("");
  const [porque, setPorque] = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preguntas, setPreguntas] = useState(preguntasVacias);

  // Aplica un objeto "info" (venga de Supabase o de localStorage) a todo el estado
  const aplicarInfo = (info) => {
    setSituaciones(info.situaciones || mezclar(data.situaciones));
    setMarcadas(info.marcadas || {});
    setRespuestaCarlos(info.respuestaCarlos || "");
    setPorque(info.porque || "");
    setResultado(info.resultado ?? null);
    setPreguntas(info.preguntas || preguntasVacias);
  };

  useEffect(() => {
    const cargar = async () => {
      let cargadoDesdeSupabase = false;

      if (userId !== "anon") {
        const { data: db, error } = await supabase
          .from("progreso_actividades")
          .select("datos_actividad")
          .eq("usuario_id", userId)
          .eq("actividad_id", data.id)
          .maybeSingle();

        if (!error && db?.datos_actividad) {
          const info = db.datos_actividad;
          aplicarInfo(info);
          // Supabase manda: siempre se reescribe localStorage con lo que
          // hay guardado en la base de datos para mantenerlos sincronizados.
          localStorage.setItem(storageKey, JSON.stringify(info));
          cargadoDesdeSupabase = true;
        }
      }

      if (!cargadoDesdeSupabase) {
        const local = localStorage.getItem(storageKey);
        if (local) {
          aplicarInfo(JSON.parse(local));
        } else {
          setSituaciones(mezclar(data.situaciones));
        }
      }

      setLoading(false);
    };
    cargar();
  }, []);

  useEffect(() => {
    if (loading) return;

    const payload = {
      situaciones,
      marcadas,
      preguntas,
      respuestaCarlos,
      porque,
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
        { onConflict: "usuario_id,actividad_id" },
      );
    };
    guardar();
  }, [situaciones, marcadas, preguntas, respuestaCarlos, porque, resultado]);

  const validar = () => {
    let correcto = true;
    situaciones.forEach((s) => {
      if (marcadas[s.id] !== s.correcta) correcto = false;
    });

    if (respuestaCarlos !== data.casoCarlos.respuestaCorrecta) correcto = false;
    if (porque.trim().length < 5) correcto = false;
    if (
      preguntas.p1.trim() === "" ||
      preguntas.p2.trim() === "" ||
      preguntas.p3.trim() === ""
    ) {
      correcto = false;
    }
    setResultado(correcto);
  };

  const reiniciar = () => {
    setSituaciones(mezclar(data.situaciones));
    setMarcadas({});
    setRespuestaCarlos("");
    setPorque("");
    setResultado(null);
    setPreguntas(preguntasVacias);
  };

  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos.fondo}>
        <style>{estilosAnimacion}</style>
        <div className="p-10 text-center font-bold text-2xl animate-glow-soft">
          {data.botones.cargando}
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.recursos.fondo}>
      <style>{estilosAnimacion}</style>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow transition-transform duration-300 hover:scale-105"
        >
          {data.botones.regresar}
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow transition-transform duration-300 hover:scale-105"
        >
          {data.botones.inicio}
        </button>
      </div>

      <div className="bg-white/90 rounded-[2rem] border-4 border-alianza-amarillo shadow-2xl p-6 md:p-10">
        {/* TITULO */}
        <h1 className="text-center text-3xl md:text-5xl font-black text-alianza-azul mb-10">
          {data.titulo}
        </h1>

        {/* NECESIDAD */}
        <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
          <div className="flex-1 bg-sky-100 rounded-3xl p-6 shadow">
            <h2 className="text-blue-900 font-black text-2xl mb-3">
              {data.necesidad.titulo}
            </h2>

            <p className="text-lg leading-relaxed">
              {data.necesidad.descripcion}
            </p>

            <p className="mt-4 font-bold">{data.necesidad.ejemplosLabel}</p>

            <p>{data.necesidad.ejemplos}</p>

            <div className="bg-green-200 rounded-xl p-3 mt-5 font-bold">
              {data.necesidad.nota}
            </div>
          </div>

          <img
            src={data.recursos.manoNecesidad}
            className="w-44 md:w-52 animate-float-soft"
            alt={data.necesidad.titulo}
          />
        </div>

        {/* DESEO */}
        <div className="flex flex-col md:flex-row-reverse gap-6 items-center mb-8">
          <div className="flex-1 bg-yellow-100 rounded-3xl p-6 shadow">
            <h2 className="text-purple-900 font-black text-2xl mb-3">
              {data.deseo.titulo}
            </h2>

            <p className="text-lg">{data.deseo.descripcion}</p>

            <p className="font-bold mt-4">{data.deseo.ejemplosLabel}</p>

            <p>{data.deseo.ejemplos}</p>

            <div className="bg-lime-200 rounded-xl mt-5 p-3 font-bold">
              {data.deseo.nota}
            </div>
          </div>

          <img
            src={data.recursos.manoDeseo}
            className="w-44 md:w-52 animate-float-soft"
            alt={data.deseo.titulo}
          />
        </div>

        {/* PREGUNTAS */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <h3 className="font-black text-2xl text-center text-alianza-azul mb-6">
            {data.preguntasTitulo}
          </h3>

          <div className="space-y-5">
            {data.preguntas.map((pregunta, i) => (
              <div key={i} className="mb-6">
                <p className="font-bold text-red-500 mb-2">{pregunta}</p>

                <input
                  type="text"
                  value={preguntas[`p${i + 1}`]}
                  onChange={(e) =>
                    setPreguntas((prev) => ({
                      ...prev,
                      [`p${i + 1}`]: e.target.value,
                    }))
                  }
                  className="w-full border-2 rounded-full p-3"
                  placeholder={data.placeholderRespuesta}
                />
              </div>
            ))}
          </div>
        </div>

        {/* FRASE */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <img
            src={data.recursos.switch}
            className="w-24 animate-float-soft"
            alt=""
          />

          <p className="font-black text-xl md:text-2xl text-center">
            {data.fraseSwitch}
          </p>
        </div>

        {/* PERSONAJES */}
        <div className="flex justify-center items-end gap-6 flex-wrap mb-10">
          <img
            src={data.recursos.nina}
            className="w-52 transition-transform duration-500 hover:scale-105"
            alt=""
          />

          <img
            src={data.recursos.mochila}
            className="w-40 transition-transform duration-500 hover:-rotate-3"
            alt=""
          />
        </div>

        {/* ACTIVIDAD */}
        <hr className="my-10 border-2 border-dashed border-yellow-400" />

        <h2 className="text-3xl font-black text-center text-alianza-azul mb-3">
          {data.actividad.titulo}
        </h2>

        <p className="text-center text-lg font-bold mb-8">
          {data.actividad.instruccionPre}{" "}
          <span className="text-red-500">{data.actividad.instruccionX}</span>{" "}
          {data.actividad.instruccionPost}
          <b> {data.actividad.columnaNecesidad} </b> o{" "}
          <b> {data.actividad.columnaDeseo}</b>.
        </p>

        <div className="overflow-auto mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="border p-3 text-left">
                  {data.actividad.columnaSituacion}
                </th>

                <th className="border p-3 text-center">
                  {data.actividad.columnaNecesidad}
                </th>

                <th className="border p-3 text-center">
                  {data.actividad.columnaDeseo}
                </th>
              </tr>
            </thead>

            <tbody>
              {situaciones.map((item) => (
                <tr key={item.id}>
                  <td className="border p-3">{item.texto}</td>

                  <td className="border text-center">
                    <input
                      type="radio"
                      name={`op-${item.id}`}
                      checked={marcadas[item.id] === "Necesidad"}
                      onChange={() =>
                        setMarcadas((prev) => ({
                          ...prev,
                          [item.id]: "Necesidad",
                        }))
                      }
                    />
                  </td>

                  <td className="border text-center">
                    <input
                      type="radio"
                      name={`op-${item.id}`}
                      checked={marcadas[item.id] === "Deseo"}
                      onChange={() =>
                        setMarcadas((prev) => ({
                          ...prev,
                          [item.id]: "Deseo",
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CASO CARLOS */}
        <div className="bg-blue-50 rounded-3xl p-6 mb-8">
          <p className="font-black text-lg mb-5">{data.casoCarlos.pregunta}</p>

          <p className="font-bold mb-2">{data.casoCarlos.preguntaTipo}</p>

          <div className="flex gap-6 mb-5">
            <label>
              <input
                type="radio"
                name="carlos"
                checked={respuestaCarlos === "Necesidad"}
                onChange={() => setRespuestaCarlos("Necesidad")}
              />
              <span className="ml-2">
                {data.actividad.columnaNecesidad}
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="carlos"
                checked={respuestaCarlos === "Deseo"}
                onChange={() => setRespuestaCarlos("Deseo")}
              />
              <span className="ml-2">{data.actividad.columnaDeseo}</span>
            </label>
          </div>

          <p className="font-bold mb-2">{data.casoCarlos.preguntaPorque}</p>

          <textarea
            rows={4}
            value={porque}
            onChange={(e) => setPorque(e.target.value)}
            className="w-full rounded-2xl border-2 p-4 resize-none"
          />
        </div>

        {/* FRASE FINAL */}
        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="flex-1">
            <h3 className="font-black text-xl mb-4">
              {data.beneficios.titulo}
            </h3>

            <ul className="space-y-3 text-lg">
              {data.beneficios.lista.map((beneficio, i) => (
                <li key={i}>✔ {beneficio}</li>
              ))}
            </ul>
          </div>

          <img
            src={data.recursos.flecha}
            className="w-48 animate-glow-soft"
            alt=""
          />
        </div>

        {/* RESULTADO */}
        {resultado !== null && (
          <div
            className={`mb-6 text-center text-2xl font-black animate-fade-in-up ${
              resultado ? "text-green-600" : "text-red-600"
            }`}
          >
            {resultado ? data.resultado.exito : data.resultado.error}
          </div>
        )}

        {/* BOTONES */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={validar}
            className="flex-1 bg-green-500 text-white py-4 rounded-full font-black transition-transform duration-300 hover:scale-105"
          >
            {data.botones.validar}
          </button>

          <button
            onClick={reiniciar}
            className="flex-1 bg-red-500 text-white py-4 rounded-full font-black transition-transform duration-300 hover:scale-105"
          >
            {data.botones.reiniciar}
          </button>

          <button
            disabled={!resultado}
            onClick={onComplete}
            className={`flex-1 py-4 rounded-full font-black transition-transform duration-300
                ${
                  resultado
                    ? "bg-alianza-amarillo text-alianza-azul hover:scale-105"
                    : "bg-gray-300 text-gray-500"
                }`}
          >
            {data.botones.continuar}
          </button>
        </div>
      </div>
    </LayoutActividad>
  );
};

export default Act04;