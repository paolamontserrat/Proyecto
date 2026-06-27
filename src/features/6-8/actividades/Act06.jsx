import React, { useState, useEffect } from 'react';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Act06 = ({ data, onComplete, onBack, rango }) => {

  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || "{}");
  const userId = usuario?.id ?? "anon";

  const storageKey = `act06-${rango}-${userId}`;

  const [opciones, setOpciones] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState({});
  const [resultado, setResultado] = useState(null);

  const mezclar = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // =========================
  // CARGA (SUPABASE PRIORIDAD)
  // =========================
  useEffect(() => {

    const cargar = async () => {

      // 1. SUPABASE
      if (userId !== "anon") {
        const { data: db } = await supabase
          .from("progreso_actividades")
          .select("datos_actividad")
          .eq("usuario_id", userId)
          .eq("actividad_id", data.id)
          .maybeSingle();

        if (db?.datos_actividad) {
          const info = db.datos_actividad;

          if (info.opciones) setOpciones(info.opciones);
          else setOpciones(mezclar(data.opciones));

          setSeleccionadas(info.seleccionadas || {});
          setResultado(info.resultado ?? null);

          return;
        }
      }

      // 2. LOCAL FALLBACK
      const guardado = localStorage.getItem(storageKey);

      if (guardado) {
        const dataGuardada = JSON.parse(guardado);
        setOpciones(dataGuardada.opciones || []);
        setSeleccionadas(dataGuardada.seleccionadas || {});
        setResultado(dataGuardada.resultado ?? null);
      } else {
        setOpciones(mezclar(data.opciones));
      }
    };

    cargar();
  }, [data.id, storageKey, userId]);

  // =========================
  // VALIDAR
  // =========================
  const validar = () => {
    let correctas = true;

    data.opciones.forEach(op => {
      const marcada = !!seleccionadas[op.id];
      if (marcada !== op.correcta) {
        correctas = false;
      }
    });

    setResultado(correctas);
  };

  // =========================
  // REINICIAR
  // =========================
  const reiniciar = () => {
    setOpciones(mezclar(data.opciones));
    setSeleccionadas({});
    setResultado(null);
  };

  const completado = resultado === true;

  // =========================
  // SYNC (LOCAL + SUPABASE)
  // =========================
  useEffect(() => {
    if (opciones.length === 0) return;

    const payload = {
      opciones,
      seleccionadas,
      resultado
    };

    // LOCAL
    localStorage.setItem(storageKey, JSON.stringify(payload));

    // SUPABASE
    const sync = async () => {
      if (userId === "anon") return;

      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: payload,
          completada: resultado === true
        },
        { onConflict: "usuario_id,actividad_id" }
      );
    };

    sync();

  }, [opciones, seleccionadas, resultado]);

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold">
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          🏠 Inicio
        </button>

      </div>

      <div className="bg-white/90 p-6 md:p-10 rounded-3xl border-4 border-alianza-amarillo">

        <h2 className="text-2xl font-black text-center text-alianza-azul mb-6">
          Encuentra las decisiones inteligentes
        </h2>

        <p className="text-center font-bold mb-6">
          Marca con X las buenas decisiones:
        </p>

        {/* OPCIONES */}
        <div className="space-y-3 mb-6">
          {opciones.map((op) => (
            <div
              key={op.id}
              onClick={() =>
                setSeleccionadas(prev => ({
                  ...prev,
                  [op.id]: !prev[op.id]
                }))
              }
              className={`p-3 rounded-xl border-2 cursor-pointer flex justify-between items-center transition
                ${seleccionadas[op.id] ? 'bg-yellow-100 border-yellow-500' : 'bg-white'}
              `}
            >
              <span>{op.texto}</span>
              {seleccionadas[op.id] && <span className="font-black">X</span>}
            </div>
          ))}
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 mb-6">

          <button
            onClick={validar}
            className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold"
          >
            Validar
          </button>

          <button
            onClick={reiniciar}
            className="flex-1 bg-red-400 text-white py-2 rounded-full font-bold"
          >
            Reiniciar
          </button>

        </div>

        {/* RESULTADO */}
        {resultado !== null && (
          <div className={`text-center font-black mb-6 text-lg ${
            resultado ? 'text-green-600' : 'text-red-600'
          }`}>
            {resultado
              ? '¡Muy bien! 👏'
              : 'Revisa tus respuestas ❌'}
          </div>
        )}

        {/* IMAGEN */}
        <img
          src={data.recursos?.imagenDecorativa}
          className="w-48 mx-auto mb-6"
        />

        {/* BOTÓN FINAL */}
        <button
          onClick={onComplete}
          disabled={!completado}
          className={`w-full py-4 rounded-full font-black text-xl ${
            completado
              ? 'bg-alianza-amarillo text-alianza-azul'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          {completado ? '¡Continuar!' : 'Completa correctamente'}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act06;