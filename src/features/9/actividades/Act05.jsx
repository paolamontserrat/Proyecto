import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

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

const Act05 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  const storageKey = `act05-${rango}-${userId}`;

  const mezclar = (array) => [...array].sort(() => Math.random() - 0.5);

  const reflexionVacia = { r1: "", r2: "", r3: "" };

  const [situaciones, setSituaciones] = useState([]);
  const [marcadas, setMarcadas] = useState({});
  const [reflexion, setReflexion] = useState(reflexionVacia);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feedback detallado, solo visible después de dar clic en "Validar".
  const [validado, setValidado] = useState(false);
  const [incorrectos, setIncorrectos] = useState(new Set());
  const [sinResponder, setSinResponder] = useState(new Set());
  const [reflexionCompleta, setReflexionCompleta] = useState(false);

  const aplicarInfo = (info) => {
    setSituaciones(info.situaciones || mezclar(data.situaciones));
    setMarcadas(info.marcadas || {});
    setReflexion(info.reflexion || reflexionVacia);
    setResultado(info.resultado ?? null);
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
      reflexion,
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
  }, [situaciones, marcadas, reflexion, resultado]);

  const seleccionar = (id, valor) => {
    setMarcadas((prev) => ({ ...prev, [id]: valor }));
    setValidado(false); // al cambiar una respuesta, se ocultan las marcas viejas
  };

  const cambiarReflexion = (campo, valor) => {
    setReflexion((prev) => ({ ...prev, [campo]: valor }));
    setValidado(false);
  };

  const validar = () => {
    const incorrectosNuevos = new Set();
    const sinResponderNuevos = new Set();

    situaciones.forEach((s) => {
      if (!marcadas[s.id]) {
        sinResponderNuevos.add(s.id);
      } else if (marcadas[s.id] !== s.correcta) {
        incorrectosNuevos.add(s.id);
      }
    });

    const reflexionOk =
      reflexion.r1.trim().length >= 3 &&
      reflexion.r2.trim().length >= 3 &&
      reflexion.r3.trim().length >= 3;

    const tablaCorrecta =
      incorrectosNuevos.size === 0 && sinResponderNuevos.size === 0;

    setIncorrectos(incorrectosNuevos);
    setSinResponder(sinResponderNuevos);
    setReflexionCompleta(reflexionOk);
    setValidado(true);
    setResultado(tablaCorrecta && reflexionOk);
  };

  const reiniciar = () => {
    setSituaciones(mezclar(data.situaciones));
    setMarcadas({});
    setReflexion(reflexionVacia);
    setResultado(null);
    setValidado(false);
    setIncorrectos(new Set());
    setSinResponder(new Set());
    setReflexionCompleta(false);
  };

  const renderParrafo = (partes, i) => (
    <p key={i} className="text-white text-lg md:text-xl">
      {partes.map((parte, j) => {
        let contenido = parte.texto;
        if (parte.negrita) contenido = <b>{contenido}</b>;
        if (parte.cursiva) contenido = <i>{contenido}</i>;
        return <React.Fragment key={j}>{contenido}</React.Fragment>;
      })}
    </p>
  );

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

  // Cuenta rápida para el mensaje final
  const totalIncorrectas = incorrectos.size + sinResponder.size;

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
        <h1 className="text-center text-3xl md:text-5xl font-black text-alianza-azul mb-8">
          {data.titulo}
        </h1>

        <div className="mb-8">
          <h3 className="font-black text-xl text-alianza-azul mb-2">
            {data.instrucciones.titulo}
          </h3>
          <p className="text-lg">
            <span className="font-black text-blue-500">
              {data.instrucciones.resaltado0}
            </span>{" "}
            {data.instrucciones.texto}{" "}
            <span className="font-black text-red-500">
              {data.instrucciones.resaltado}
            </span>{" "}
            {data.instrucciones.texto2}{" "}
            <span className="font-black text-yellow-600">
              {data.instrucciones.resaltado2}
            </span>{" "}
            {data.instrucciones.texto3}{" "}
            <span className="font-black text-blue-600">
              {data.instrucciones.resaltado3}
            </span>{" "}
            {data.instrucciones.textoFinal}
          </p>
        </div>

        {/* TABLA DE SITUACIONES, con feedback visual por fila */}
        <div className="overflow-auto mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="border p-3 text-left">{data.columnaSituacion}</th>
                <th className="border p-3 text-center text-yellow-600">{data.columnaCasa}</th>
                <th className="border p-3 text-center text-blue-600">{data.columnaCaja}</th>
                {validado && <th className="border p-3 text-center w-14"></th>}
              </tr>
            </thead>

            <tbody>
              {situaciones.map((item) => {
                const esIncorrecta = validado && incorrectos.has(item.id);
                const noRespondida = validado && sinResponder.has(item.id);
                const esCorrecta = validado && !esIncorrecta && !noRespondida;

                const filaClase = esIncorrecta
                  ? "bg-red-50"
                  : noRespondida
                    ? "bg-amber-50"
                    : esCorrecta
                      ? "bg-blue-50"
                      : "";

                return (
                  <tr key={item.id} className={filaClase}>
                    <td className="border p-3">
                      {item.texto}
                      {esIncorrecta && (
                        <p className="text-xs text-red-600 font-bold mt-1">
                          Respuesta correcta: {item.correcta}
                        </p>
                      )}
                      {noRespondida && (
                        <p className="text-xs text-amber-600 font-bold mt-1">
                          Falta responder
                        </p>
                      )}
                    </td>

                    <td className="border text-center">
                      <input
                        type="radio"
                        name={`op-${item.id}`}
                        checked={marcadas[item.id] === "Casa"}
                        onChange={() => seleccionar(item.id, "Casa")}
                      />
                    </td>

                    <td className="border text-center">
                      <input
                        type="radio"
                        name={`op-${item.id}`}
                        checked={marcadas[item.id] === "Caja"}
                        onChange={() => seleccionar(item.id, "Caja")}
                      />
                    </td>

                    {validado && (
                      <td className="border text-center text-xl">
                        {esCorrecta && "✅"}
                        {esIncorrecta && "❌"}
                        {noRespondida && "⚠️"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {validado && totalIncorrectas > 0 && (
          <p className="text-center text-red-600 font-bold mb-8">
            {totalIncorrectas} {totalIncorrectas === 1 ? "fila necesita" : "filas necesitan"} tu atención — revisa las marcadas en rojo o amarillo arriba.
          </p>
        )}

        {/* REFLEXIONA */}
        <div
          className={`rounded-3xl p-6 mb-8 transition-colors ${
            validado && !reflexionCompleta ? "bg-amber-100 border-2 border-amber-400" : "bg-lime-100"
          }`}
        >
          <h3 className="font-black text-2xl text-center text-alianza-azul mb-2">
            {data.reflexiona.titulo}
          </h3>
          {validado && !reflexionCompleta && (
            <p className="text-center text-amber-700 font-bold text-sm mb-4">
              Completa las 3 respuestas (mínimo 3 caracteres cada una) para poder continuar.
            </p>
          )}

          <div className="space-y-5">
            {data.reflexiona.preguntas.map((pregunta, i) => {
              const campo = `r${i + 1}`;
              const faltaEsta = validado && reflexion[campo].trim().length < 3;
              return (
                <div key={i}>
                  <p className="font-bold mb-2">{pregunta}</p>
                  <input
                    type="text"
                    value={reflexion[campo]}
                    onChange={(e) => cambiarReflexion(campo, e.target.value)}
                    className={`w-full border-2 rounded-full p-3 bg-white ${
                      faltaEsta ? "border-amber-500" : ""
                    }`}
                    placeholder={data.reflexiona.placeholder}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <img
            src={data.recursos.flecha}
            className="w-72 md:w-80 animate-float-soft"
            alt=""
          />
        </div>

        <div className="bg-alianza-azul rounded-3xl p-6 md:p-8 mb-8 space-y-3 shadow-xl">
          <h3 className="font-black text-2xl text-alianza-amarillo text-center mb-4">
            {data.conclusion.titulo}
          </h3>
          {data.conclusion.parrafos.map((partes, i) => renderParrafo(partes, i))}
        </div>

        {resultado !== null && (
          <div
            className={`mb-6 text-center text-2xl font-black animate-fade-in-up ${
              resultado ? "text-blue-600" : "text-red-600"
            }`}
          >
            {resultado
              ? data.resultado.exito
              : totalIncorrectas > 0
                ? "❌ Revisa las filas marcadas en la tabla."
                : "❌ Completa las 3 preguntas de reflexión."}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            onClick={validar}
            className="flex-1 bg-blue-500 text-white py-4 rounded-full font-black transition-transform duration-300 hover:scale-105"
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

export default Act05;