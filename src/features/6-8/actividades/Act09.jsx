import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";

const Act09 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  // =========================
  // USER
  // =========================
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";
  const actividadId = data?.id;

  // =========================
  // STATE
  // =========================
  const [seleccion, setSeleccion] = useState("");
  const [otro, setOtro] = useState("");

  const [respuestas, setRespuestas] = useState({
    r1: "",
    r2: "",
    r3: "",
  });

  const [dibujos, setDibujos] = useState({
    d1: [],
    d2: [],
    d3: [],
    d4: [],
  });

  const [loading, setLoading] = useState(true);

  // =========================
  // DEBOUNCE SAVE (CLAVE)
  // =========================
  const saveTimeout = useRef(null);
  const isSaving = useRef(false);

  const limpiar = (state) => ({
    seleccion: state.seleccion || "",
    otro: state.otro || "",
    respuestas: {
      r1: state.respuestas?.r1 || "",
      r2: state.respuestas?.r2 || "",
      r3: state.respuestas?.r3 || "",
    },
    dibujos: {
      d1: Array.isArray(state.dibujos?.d1) ? state.dibujos.d1 : [],
      d2: Array.isArray(state.dibujos?.d2) ? state.dibujos.d2 : [],
      d3: Array.isArray(state.dibujos?.d3) ? state.dibujos.d3 : [],
      d4: Array.isArray(state.dibujos?.d4) ? state.dibujos.d4 : [],
    },
  });

  // =========================
  // LOAD
  // =========================
  useEffect(() => {
    if (userId === "anon" || !actividadId) {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      const { data: db } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", actividadId)
        .maybeSingle();

      const d = db?.datos_actividad;

      if (d) {
        setSeleccion(d.seleccion || "");
        setOtro(d.otro || "");
        setRespuestas(d.respuestas || { r1: "", r2: "", r3: "" });
        setDibujos(limpiar({ dibujos: d.dibujos || {} }).dibujos);
      }

      setLoading(false);
    };

    cargar();
  }, [userId, actividadId]);

  // =========================
  // SAVE CENTRALIZADO (IMPORTANTE)
  // =========================
  const guardar = useCallback((state) => {
    if (userId === "anon" || !actividadId) return;

    const limpio = limpiar(state);

    const completada =
      (limpio.seleccion !== "" || limpio.otro.trim() !== "") &&
      limpio.dibujos.d1.length > 0 &&
      limpio.dibujos.d2.length > 0 &&
      limpio.dibujos.d3.length > 0 &&
      limpio.dibujos.d4.length > 0 &&
      limpio.respuestas.r1.trim() &&
      limpio.respuestas.r2.trim() &&
      limpio.respuestas.r3.trim();

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      if (isSaving.current) return;
      isSaving.current = true;

      try {
        await supabase.from("progreso_actividades").upsert(
          {
            usuario_id: userId,
            actividad_id: actividadId,
            datos_actividad: limpio,
            completada,
          },
          {
            onConflict: "usuario_id,actividad_id",
          }
        );
      } catch (err) {
        console.warn(err);
      } finally {
        isSaving.current = false;
      }
    }, 300);
  }, [userId, actividadId]);

  // =========================
  // HANDLERS
  // =========================
  const handleSeleccion = (op) => {
    const state = {
      seleccion: op,
      otro: "",
      respuestas,
      dibujos,
    };

    setSeleccion(op);
    setOtro("");
    guardar(state);
  };

  const handleOtro = (value) => {
    const state = {
      seleccion: "",
      otro: value,
      respuestas,
      dibujos,
    };

    setOtro(value);
    setSeleccion("");
    guardar(state);
  };

  const handleRespuesta = (key, value) => {
    const nuevas = { ...respuestas, [key]: value };
    setRespuestas(nuevas);

    guardar({
      seleccion,
      otro,
      respuestas: nuevas,
      dibujos,
    });
  };

  const handleDibujo = (key, dataDibujo) => {
    const limpio = Array.isArray(dataDibujo) ? dataDibujo : [];

    const nuevos = {
      ...dibujos,
      [key]: limpio,
    };

    setDibujos(nuevos);

    guardar({
      seleccion,
      otro,
      respuestas,
      dibujos: nuevos,
    });
  };

  // =========================
  // VALIDACIÓN
  // =========================
  const isValid =
    (seleccion !== "" || otro.trim() !== "") &&
    dibujos.d1.length > 0 &&
    dibujos.d2.length > 0 &&
    dibujos.d3.length > 0 &&
    dibujos.d4.length > 0 &&
    respuestas.r1.trim() &&
    respuestas.r2.trim() &&
    respuestas.r3.trim();

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <LayoutActividad fondo={data?.recursos?.fondo}>
        <div className="p-10 text-center font-bold">Cargando...</div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data?.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold">
          ← Regresar
        </button>

        <button onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold">
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] border-4 border-alianza-amarillo">

        {/* TÍTULO */}
        <h2 className="text-2xl md:text-4xl font-black text-alianza-azul text-center mb-2">
          {data.titulo}
        </h2>

        <p className="text-center font-bold text-lg md:text-xl mb-6">
          {data.subtitulo}
        </p>

        {/* OPCIONES */}
        <div className="text-center mb-6">
          <p className="font-bold mb-4">
            Si mi familia ahorra para un paseo, yo elegiría:
          </p>
          {data.opciones.map((op, i) => (
            <button
              key={i}
              onClick={() => handleSeleccion(op)}
              className={`px-4 py-2 rounded-full font-bold m-1 ${
                seleccion === op ? "bg-alianza-azul text-white" : "bg-gray-200"
              }`}
            >
              {op}
            </button>
          ))}

          <input
            value={otro}
            onChange={(e) => handleOtro(e.target.value)}
            className="p-3 border-2 rounded-xl w-full max-w-md text-center"
            placeholder="Otro..."
          />
        </div>

        {/* DIBUJO PRINCIPAL */}
        <p className="text-center font-black text-lg mb-4">
          Dibuja el paseo elegido
        </p>
        <TipoDibujar
          userId={userId}
          actividadId={actividadId}
          gestionarPropio={false}          
          valorInicial={dibujos.d1}        
          canalId="d1"                     
          value={dibujos.d1}
          onChange={({ dataDibujo }) => handleDibujo("d1", dataDibujo)}
        />

         {/* TIPS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 mt-10">

          <div className="flex-1">
            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black">
                {data.tips.titulo}
              </h3>
            </div>

            <div className="bg-blue-400 p-4 rounded-b-2xl text-white font-bold space-y-1">
              {data.tips.contenido.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </div>

          <img
            src={data.recursos.imagenDerecha}
            className="w-32 md:w-40 object-contain"
          />

        </div>

        {data?.frases?.map((f, i) => (
          <div key={i} className="text-center mt-8">

            <p className="font-black mb-2">{f}</p>

            <input
              value={respuestas[`r${i + 1}`]}
              onChange={(e) => handleRespuesta(`r${i + 1}`, e.target.value)}
              className="p-3 border rounded-xl w-full max-w-md text-center"
            />

            <TipoDibujar
              userId={userId}
              actividadId={actividadId}
              gestionarPropio={false}                    // ← añadir
              valorInicial={dibujos[`d${i + 2}`]}        // ← añadir
              canalId={`d${i + 2}`}                      // ← añadir
              value={dibujos[`d${i + 2}`]}
              onChange={({ dataDibujo }) =>
                handleDibujo(`d${i + 2}`, dataDibujo)
              }
            />
          </div>
        ))}

        {/* BOTÓN */}
        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full mt-8 py-4 rounded-full font-black text-xl ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isValid ? "¡Continuar!" : "Completa la actividad"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act09;