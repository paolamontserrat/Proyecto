import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

// Semanas que se usan para proyectar el ahorro (igual que en Act07)
const SEMANAS_POR_MES = 4;
const SEMANAS_9_MESES = SEMANAS_POR_MES * 9; // 36 semanas

const calcularPlan = (semanaStr) => {
  const semana = parseFloat(semanaStr) || 0;
  const mes = semana * SEMANAS_POR_MES;
  const nueveMeses = semana * SEMANAS_9_MESES;

  return {
    ahorroSemana: semanaStr,
    ahorroMes: semanaStr.trim() !== "" ? String(mes) : "",
    ahorro9Meses: semanaStr.trim() !== "" ? String(nueveMeses) : "",
  };
};

const Act05 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";

  // =========================
  // STATE (CORRECTO)
  // =========================
  const [plan, setPlan] = useState({
    ahorroSemana: "",
    ahorroMes: "",
    ahorro9Meses: ""
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
  // LOAD (igual Act02)
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
          // Re-calcula mes/9meses aunque vengan guardados, por si en algún
          // momento se ajustan las constantes de arriba (igual que Act07).
          setPlan(calcularPlan(info.plan.ahorroSemana || ""));
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
  // SAVE (igual Act02)
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
            dibujo: dibujoFinal
          },
          completada
        },
        { onConflict: "usuario_id,actividad_id" }
      );

      setSyncStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setSyncStatus("idle"), 1200);
    },
    [userId, data.id]
  );

  const scheduleSave = useCallback((planData, dibujo) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveToSupabase(planData, dibujo);
    }, 600);
  }, [saveToSupabase]);

  // =========================
  // INPUT (solo "por semana" es editable; mes y 9 meses se calculan solos)
  // =========================
  const handleChangeSemana = (value) => {
    const nuevoPlan = calcularPlan(value);
    setPlan(nuevoPlan);
    scheduleSave(nuevoPlan, dibujoData);
  };

  // =========================
  // DIBUJO (igual Act02)
  // =========================
  const handleDibujoChange = useCallback(
    ({ tieneDibujo: td, dataDibujo }) => {
      const limpio = isValidDibujo(dataDibujo) ? dataDibujo : [];

      setTieneDibujo(td);
      setDibujoData(limpio);

      if (td) setHasData(true);

      scheduleSave(plan, limpio);
    },
    [plan, scheduleSave]
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
        <div className="p-10 text-center font-bold animate-pulse">
          Cargando...
        </div>
      </LayoutActividad>
    );
  }

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold">
          ← Regresar
        </button>

        <span>
          {syncStatus === "saving" && "⏳ Guardando…"}
          {syncStatus === "saved" && "✅ Guardado"}
          {syncStatus === "error" && "❌ Error"}
        </span>

        <button onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold">
          🏠 Inicio
        </button>

      </div>

      <div className="bg-white p-6 rounded-3xl border-4 border-alianza-amarillo">
        {/* TIP FINANCIERO */}
        <div className="relative mb-8">
          <div className="bg-alianza-azul text-white font-black p-4 rounded-t-2xl w-[85%]">
            TIP FINANCIERO
          </div>
          <div className="bg-blue-300 text-alianza-azul font-bold p-4 rounded-b-2xl w-[85%] space-y-2">
            <p>Del cochinito a la Caja</p>
            <div className="flex gap-2 mt-2">
              <img src={data.recursos.img1} alt="" className="w-12" />
              <img src={data.recursos.img2} alt="" className="w-12" />
            </div>
            <div className="mt-3 space-y-1">
              <p>La alcancía te ayuda a empezar.</p>
              <p>La Caja te ayuda a crecer.</p>
              <p>Cuando llevas tu ahorro a la Caja:</p>
            </div>
          </div>
          <img
            src={data.recursos.imagenTip}
            alt=""
            className="absolute right-[20px] md:right-[30px] top-4 w-24 md:w-40 lg:w-52 drop-shadow-lg"
          />
        </div>

        {/* BENEFICIOS */}
        <div className="flex items-start gap-4 mb-8">
          <img src={data.recursos.imgCaja} alt="" className="w-5 md:w-6" />
          <div className="text-left font-bold text-gray-800 leading-relaxed whitespace-pre-line">
            <p>Está más seguro</p>
            <p>Puede generar más dinero.</p>
            <p>Aprendes a planear tu futuro.</p>
            <p>Participas en promociones y otros beneficios.</p>
          </div>
        </div>
        
         {/* PLAN DE AHORRO */}
        <div className="bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-alianza-amarillo rounded-2xl p-5 mb-8">
          <h3 className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-6">
            {data.plan.titulo}
          </h3>

        {/* INPUTS */}
        <div className="space-y-5">
            {/* Si ahorro cada semana — ÚNICO CAMPO EDITABLE */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">Si ahorro cada semana:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <input
                  value={plan.ahorroSemana}
                  onChange={(e) => handleChangeSemana(e.target.value)}
                  inputMode="decimal"
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
             </div>
          </div>

        {/* Al mes tendré — CALCULADO AUTOMÁTICAMENTE */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">Al mes tendré:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <span className="w-32 text-center text-lg font-black text-green-700">
                  {plan.ahorroMes || 0}
                </span>
              </div>
            </div>
        {/* En 9 meses — CALCULADO AUTOMÁTICAMENTE */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">En 9 meses:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <span className="w-32 text-center text-lg font-black text-green-700">
                  {plan.ahorro9Meses || 0}
                </span>
              </div>
            </div>
        </div>
        <div className="mt-6 bg-alianza-amarillo/20 border-l-4 border-alianza-amarillo rounded-xl p-4">
            <p className="font-black text-alianza-azul text-lg mb-2">⭐ Tarea de ahorro</p>
            <p className="font-bold text-gray-700 leading-relaxed">{data.plan.tarea}</p>
          </div>

        {/* BOTÓN PASAPORTE */}
        <button
          onClick={() => navigate(`/pasaporte/${rango}`)}
          className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black text-lg hover:scale-110 transition mb-6 w-full"
        >
          Ir a mi pasaporte
        </button>
        </div>

        <TipoDibujar
          userId={userId}
          actividadId={data.id}
          onChange={handleDibujoChange}
        />

        <button onClick={finalizar} disabled={!isValid} 
        className={`w-full py-4 rounded-full font-black ${
            isValid ? 'bg-alianza-amarillo' : 'bg-gray-300'
          }`}>
          {isValid ? "¡Terminé!" : "Completa todo"}
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act05;