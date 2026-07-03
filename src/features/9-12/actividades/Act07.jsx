import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// Animaciones propias en CSS (evita depender de framer-motion, que el
// componente original importaba como "motion" sin declararlo).
const estilosAnimacion = `
@keyframes floatCoin {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-14px); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes popIn {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-float-coin {
  animation: floatCoin 2.6s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out both;
}
.animate-pop-in {
  animation: popIn 0.3s ease-out both;
}
`;

const Act07 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  // =========================
  // STATE
  // =========================
  const [plan, setPlan] = useState({
    ahorroSemana: "",
    ahorroMes: "",
    ahorro9Meses: "",
  });

  const [dibujoData, setDibujoData] = useState([]);
  const [tieneDibujo, setTieneDibujo] = useState(false);
  const [hasData, setHasData] = useState(false);

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  const isValidDibujo = (d) => Array.isArray(d) && d.length > 0;

  const isValid =
    plan.ahorroSemana.trim() !== "" &&
    plan.ahorroMes.trim() !== "" &&
    plan.ahorro9Meses.trim() !== "" &&
    (tieneDibujo || hasData);

  // =========================
  // LOAD
  // =========================
  useEffect(() => {
    if (userId === "anon") {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      const { data: db } = await supabase
        .from("progreso_actividades")
        .select("datos_actividad")
        .eq("usuario_id", userId)
        .eq("actividad_id", data.id)
        .maybeSingle();

      if (db?.datos_actividad) {
        const info = db.datos_actividad;

        if (info.plan) {
          setPlan(info.plan);
        }

        if (isValidDibujo(info.dibujo)) {
          setDibujoData(info.dibujo);
          setTieneDibujo(true);
          setHasData(true);
        }
      }

      setLoading(false);
    };

    cargar();
  }, [userId, data.id]);

  // =========================
  // SAVE
  // =========================
  const saveToSupabase = useCallback(
    async (planData, dibujo) => {
      if (userId === "anon") return;

      setSyncStatus("saving");

      const dibujoFinal = isValidDibujo(dibujo) ? dibujo : [];

      const completada =
        planData.ahorroSemana.trim() !== "" &&
        planData.ahorroMes.trim() !== "" &&
        planData.ahorro9Meses.trim() !== "" &&
        dibujoFinal.length > 0;

      const { error } = await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: data.id,
          datos_actividad: {
            plan: planData,
            dibujo: dibujoFinal,
          },
          completada,
        },
        { onConflict: "usuario_id,actividad_id" },
      );

      setSyncStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setSyncStatus("idle"), 1200);
    },
    [userId, data.id],
  );

  const scheduleSave = useCallback(
    (planData, dibujo) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(planData, dibujo);
      }, 600);
    },
    [saveToSupabase],
  );

  // =========================
  // INPUTS
  // =========================
  const handleChange = (field, value) => {
    const newPlan = { ...plan, [field]: value };

    setPlan(newPlan);
    scheduleSave(newPlan, dibujoData);
  };

  // =========================
  // DIBUJO
  // =========================
  const handleDibujoChange = useCallback(
    ({ tieneDibujo: td, dataDibujo }) => {
      const limpio = isValidDibujo(dataDibujo) ? dataDibujo : [];

      setTieneDibujo(td);
      setDibujoData(limpio);

      if (td) setHasData(true);

      scheduleSave(plan, limpio);
    },
    [plan, scheduleSave],
  );

  // =========================
  // FINALIZAR
  // =========================
  const finalizar = () => {
    if (!isValid) return;
    saveToSupabase(plan, dibujoData);
    onComplete();
  };

  // =========================
  // UI
  // =========================
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <style>{estilosAnimacion}</style>
        <div className="p-10 text-center font-bold animate-pulse">
          {data.botones.cargando}
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
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

      <div className="bg-white p-6 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl">
        {/* TITULO */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {data.recursos?.imgCaja && (
            <img
              src={data.recursos.imgCaja}
              alt=""
              className="w-12 md:w-16"
            />
          )}
          <h1 className="text-center text-2xl md:text-4xl font-black text-alianza-azul">
            {data.titulo}
          </h1>
        </div>

        {/* PLAN DE AHORRO */}
        <div className="bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-alianza-amarillo rounded-2xl p-5 md:p-7 mb-8">
          <h3 className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-6">
            {data.plan.titulo}
          </h3>

          <div className="flex justify-center mb-6">
            <img
              src={data.plan.imagen}
              alt=""
              className="w-28 md:w-32 animate-float-coin"
            />
          </div>

          {/* INPUTS */}
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/70 rounded-xl p-3">
              <span className="font-bold text-gray-800 md:min-w-[220px]">
                {data.plan.etiquetas.semana}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">
                  $
                </span>
                <input
                  value={plan.ahorroSemana}
                  onChange={(e) => handleChange("ahorroSemana", e.target.value)}
                  inputMode="decimal"
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/70 rounded-xl p-3">
              <span className="font-bold text-gray-800 md:min-w-[220px]">
                {data.plan.etiquetas.mes}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">
                  $
                </span>
                <input
                  value={plan.ahorroMes}
                  onChange={(e) => handleChange("ahorroMes", e.target.value)}
                  inputMode="decimal"
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white/70 rounded-xl p-3">
              <span className="font-bold text-gray-800 md:min-w-[220px]">
                {data.plan.etiquetas.meses9}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">
                  $
                </span>
                <input
                  value={plan.ahorro9Meses}
                  onChange={(e) =>
                    handleChange("ahorro9Meses", e.target.value)
                  }
                  inputMode="decimal"
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-alianza-amarillo/20 border-l-4 border-alianza-amarillo rounded-xl p-4">
            <p className="font-black text-alianza-azul text-lg mb-2">
              ⭐ Tarea de ahorro
            </p>
            <p className="font-bold text-gray-700 leading-relaxed">
              {data.plan.tarea}
            </p>
          </div>
        </div>

        {/* ACTIVIDAD DE DIBUJO */}
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 md:p-7 mb-8">
          <h3 className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-2">
            {data.actividadFinal.titulo}
          </h3>
          <p className="text-center text-gray-700 font-bold mb-5">
            {data.actividadFinal.texto}
          </p>

          <TipoDibujar
            userId={userId}
            actividadId={data.id}
            onChange={handleDibujoChange}
          />
        </div>

        {/* BOTÓN PASAPORTE */}
        <button
          onClick={() => navigate(`/pasaporte/${rango}`)}
          className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black text-lg transition-transform duration-300 hover:scale-105 mb-6 w-full"
        >
          {data.actividadFinal.boton}
        </button>

        {/* INDICADOR DE GUARDADO */}
        <div className="h-6 text-center mb-2">
          {syncStatus === "saving" && (
            <span className="text-sm font-bold text-gray-500 animate-fade-in-up">
              {data.sync.guardando}
            </span>
          )}
          {syncStatus === "saved" && (
            <span className="text-sm font-bold text-green-600 animate-pop-in">
              {data.sync.guardado}
            </span>
          )}
          {syncStatus === "error" && (
            <span className="text-sm font-bold text-red-500 animate-fade-in-up">
              {data.sync.error}
            </span>
          )}
        </div>

        {/* FINALIZAR */}
        <button
          onClick={finalizar}
          disabled={!isValid}
          className={`w-full py-4 rounded-full font-black text-lg transition-transform duration-300 ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isValid ? data.botones.terminar : data.botones.completaTodo}
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act07;