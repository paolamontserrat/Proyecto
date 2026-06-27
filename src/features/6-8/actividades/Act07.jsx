import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import PuzzleImagen from '../../../components/actividades/tipos/PuzzleImagen';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from "react-router-dom";

const Act07 = ({ data, onBack, onComplete, rango }) => {

  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || "{}");
  const userId = usuario?.id ?? "anon";

  const storageKey = `act07-${rango}-${data.id}-${userId}`;

  const [puzzleCompletado, setPuzzleCompletado] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================
  //  CARGA LOCAL + SUPABASE
  // =========================
useEffect(() => {
  const load = async () => {

    const local = localStorage.getItem(storageKey);

    if (local) {
      const parsed = JSON.parse(local);
      setPuzzleCompletado(!!parsed.completado);
      setHasData(true);
    }

    if (userId !== "anon") {
      const { data: remote } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", data.id)
        .maybeSingle();

      if (remote?.datos_actividad) {
        const parsed = remote.datos_actividad;

        setPuzzleCompletado(!!parsed.completado);
        setHasData(true);

        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    }

    setLoading(false);
  };

  load();
}, [storageKey, userId, data.id]);

  // =========================
  //  SYNC CENTRAL (tipo Act08)
  // =========================
 const syncAll = async (state) => {
  if (userId === "anon") return;

  localStorage.setItem(storageKey, JSON.stringify(state));

  await supabase.from("progreso_actividades").upsert(
    {
      usuario_id: userId,
      actividad_id: data.id,
      datos_actividad: state,
      completada: state.completado === true
    },
    { onConflict: "usuario_id,actividad_id" }
  );
};
  // =========================
  //  CUANDO SE COMPLETA PUZZLE
  // =========================
const handlePuzzleComplete = () => {
  const state = { completado: true };

  setPuzzleCompletado(true);
  setHasData(true);

  syncAll(state);
};

  // =========================
  // CONTINUAR
  // =========================
  const handleContinuar = () => {

    const finalState = {
      completado: true
    };

    localStorage.removeItem(storageKey);
    syncAll(finalState);

    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      {/* =========================
          CONTENEDOR PRINCIPAL
      ========================= */}
      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        {/* =========================
            ESCENA (UI ORIGINAL)
        ========================= */}
        <div className="relative flex flex-col md:flex-row items-center justify-between mb-10">

          <div className="text-center md:text-left">
            <h3 className="text-red-500 font-black text-xl md:text-2xl mb-2">
              {data.textos.izquierda}
            </h3>

            <img src={data.recursos.dulces} className="w-40 md:w-56 mx-auto" />
          </div>

          <div className="my-6 md:my-0">
            <img src={data.recursos.nina} className="w-44 md:w-60 mx-auto" />
          </div>

          <div className="text-center md:text-right">
            <h3 className="text-blue-500 font-black text-xl md:text-2xl mb-2">
              {data.textos.derecha}
            </h3>

            <img src={data.recursos.dinero} className="w-40 md:w-56 mx-auto" />
          </div>

        </div>

        {/* =========================
            TIPS
        ========================= */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-10">

          <div className="flex-1">

            <div className="bg-alianza-azul p-4 rounded-t-2xl">
              <h3 className="text-alianza-amarillo font-black text-lg">
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

        {/* =========================
            PUZZLE
        ========================= */}
        <div className="text-center mb-10">

          <h3 className="text-xl md:text-2xl font-black text-alianza-azul mb-4">
            {data.actividad}
          </h3>

          <p className="font-bold text-gray-700 mb-4">
            Observa la imagen y arma el rompecabezas
          </p>

          <img
            src={data.recursos.imagenPrincipal}
            className="w-52 md:w-72 mx-auto rounded-2xl shadow-lg mb-6"
          />

          <PuzzleImagen
            imagen={data.recursos.imagenInferior}
            storageKey={`act07-${rango}-${data.id}-${userId}`}
            onCompletePuzzle={handlePuzzleComplete}
          />

          {puzzleCompletado && (
            <p className="text-green-600 font-black text-xl mt-6">
              🎉 ¡EXCELENTE TARBAJO YA LO COMPLETASTE!
            </p>
          )}

        </div>

        {/* =========================
            BOTÓN CONTINUAR
        ========================= */}
        <button
          onClick={handleContinuar}
          disabled={!puzzleCompletado}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            puzzleCompletado
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act07;