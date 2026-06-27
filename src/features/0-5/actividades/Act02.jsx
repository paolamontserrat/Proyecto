import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act02 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId  = usuario?.id ?? "anon";

  // ── Estado ────────────────────────────────────────────────────────────────
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [dibujoData,     setDibujoData]     = useState([]);
  const [tieneDibujo,    setTieneDibujo]    = useState(false);
  const [hasData,        setHasData]        = useState(false); // dato confirmado desde Supabase
  const [loading,        setLoading]        = useState(true);
  const [syncStatus,     setSyncStatus]     = useState("idle");

  const saveTimer = useRef(null);

  const isValidDibujo = (d) => Array.isArray(d) && d.length > 0;
  const isValid = (tieneDibujo || hasData) && respuestaTexto.trim().length > 0;

  // ── Carga inicial desde Supabase ──────────────────────────────────────────
  useEffect(() => {
    if (userId === "anon") { setLoading(false); return; }

    const cargar = async () => {
      const { data: db } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", data.id)
        .maybeSingle();

      if (db?.datos_actividad) {
        const { texto, dibujo } = db.datos_actividad;
        if (texto)              setRespuestaTexto(texto);
        if (isValidDibujo(dibujo)) {
          setDibujoData(dibujo);
          setTieneDibujo(true);
          setHasData(true);   // habilita botón aunque el canvas tarde en hidratar
        }
      }
      setLoading(false);
    };

    cargar();
  }, [userId, data.id]);

  // ── Guardar en Supabase (debounced) ───────────────────────────────────────
  const saveToSupabase = useCallback(async (texto, dibujo) => {
    if (userId === "anon") return;
    setSyncStatus("saving");
    const completada = texto.trim().length > 0 && isValidDibujo(dibujo);
    const { error } = await supabase
      .from("progreso_actividades")
      .upsert(
        { usuario_id: userId, actividad_id: data.id,
          datos_actividad: { texto, dibujo: isValidDibujo(dibujo) ? dibujo : [] },
          completada },
        { onConflict: "usuario_id,actividad_id" }
      );
    if (error) { setSyncStatus("error"); }
    else       { setSyncStatus("saved"); setTimeout(() => setSyncStatus("idle"), 1500); }
  }, [userId, data.id]);

  const scheduleSave = useCallback((texto, dibujo) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToSupabase(texto, dibujo), 600);
  }, [saveToSupabase]);

  // ── Cambio de texto ───────────────────────────────────────────────────────
  const handleTextoChange = (e) => {
    const val = e.target.value;
    setRespuestaTexto(val);
    scheduleSave(val, dibujoData);
  };

  // ── Cambio de dibujo (viene de TipoDibujar) ───────────────────────────────
  const handleDibujoChange = useCallback(({ tieneDibujo: td, dataDibujo }) => {
    const normalizado = isValidDibujo(dataDibujo) ? dataDibujo : [];
    setTieneDibujo(td);
    setDibujoData(normalizado);
    if (td) setHasData(true);
    scheduleSave(respuestaTexto, normalizado);
  }, [respuestaTexto, scheduleSave]);

  // ── Finalizar ─────────────────────────────────────────────────────────────
  const guardarYTerminar = () => {
    if (!isValid) return;
    saveToSupabase(respuestaTexto, dibujoData);
    onComplete();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold text-xl animate-pulse">
          Cargando tu progreso…
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.recursos?.fondo || "/images/0-5/Fondo0-5.png"}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow">
          ← Regresar
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && <span className="text-yellow-500">⏳ Guardando…</span>}
          {syncStatus === "saved"  && <span className="text-green-500">✅ Guardado</span>}
          {syncStatus === "error"  && <span className="text-red-500">❌ Error al guardar</span>}
        </span>

        <button onClick={() => navigate(`/dashboard/${rango}`)} className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow">
          🏠 Inicio
        </button>
      </div>

      <div className="bg-white/95 p-5 rounded-3xl border-4 border-alianza-amarillo">

        {/* HISTORIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          {[
            { img: data.recursos.alcanciaVacia,  texto: data.contenido.historia[0] },
            { img: data.recursos.familia,         texto: data.contenido.historia[1] },
            { img: data.recursos.alcanciaLlena,   texto: data.contenido.historia[2] },
          ].map((item, i) => (
            <div key={i}>
              <img src={item.img} className="w-24 mx-auto mb-2" alt="" />
              <p className="font-bold">{item.texto}</p>
            </div>
          ))}
        </div>

        {/* TIPS */}
        <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl border-2 border-alianza-amarillo mb-6">
          <h4 className="font-black text-alianza-azul mb-2">💡 Tips para Papás</h4>
          <ul className="text-sm md:text-lg">
            <li>{data.contenido.tips[0]}</li>
            <li>{data.contenido.tips[1]}</li>
            <ul className="list-disc pl-6 font-bold">
              <li>{data.contenido.tips[2]}</li>
              <li>{data.contenido.tips[3]}</li>
              <li>{data.contenido.tips[4]}</li>
            </ul>
          </ul>
        </div>

        {/* DIBUJO */}
        <TipoDibujar
          userId={userId}
          actividadId={data.id}
          onChange={handleDibujoChange}
        />

        {/* TEXTO */}
        <div className="mt-12 mb-10 text-center bg-white p-6 rounded-[2rem] border-4 border-alianza-azul shadow-inner">
          <h3 className="text-lg md:text-2xl font-black text-pink-500 mb-2 uppercase tracking-wide">
            {data.subtitulo}
          </h3>
          <p className="text-lg md:text-2xl font-black text-alianza-azul mb-6">
            {data.pregunta}
          </p>
          <input
            type="text"
            value={respuestaTexto}
            onChange={handleTextoChange}
            className="w-full p-4 border-4 border-gray-300 rounded-3xl text-center font-bold text-lg focus:border-alianza-amarillo outline-none"
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarYTerminar}
          disabled={!isValid}
          className={`w-full mt-6 py-4 rounded-full font-black text-xl transition ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isValid ? "¡Terminé! 🎉" : "Completa para continuar"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act02;