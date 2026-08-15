import React, { useState, useEffect, useCallback, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act10 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  // =========================
  // USER
  // =========================
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";
  const actividadId = data.id;

  // =========================
  // STATE
  // =========================
  const [nombre, setNombre] = useState("");
  const [firmaData, setFirmaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  const isValidDibujo = (d) => Array.isArray(d) && d.length > 0;

  const isValid = nombre.trim().length > 0 && isValidDibujo(firmaData);

  // =========================
  // LOAD SUPABASE
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
        setNombre(d.nombre || "");
        setFirmaData(Array.isArray(d.firma) ? d.firma : []);
      }

      setLoading(false);
    };

    cargar();
  }, [userId, actividadId]);

  // =========================
  // SAVE SUPABASE
  // =========================
  const saveToSupabase = useCallback(
    async (n, firma) => {
      if (userId === "anon" || !actividadId) return;

      setSyncStatus("saving");

      const firmaFinal = isValidDibujo(firma) ? firma : [];

      const completada = n.trim().length > 0 && firmaFinal.length > 0;

      const { error } = await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: {
            nombre: n,
            firma: firmaFinal,
          },
          completada,
        },
        {
          onConflict: "usuario_id,actividad_id",
        }
      );

      setSyncStatus(error ? "error" : "saved");

      setTimeout(() => setSyncStatus("idle"), 1200);
    },
    [userId, actividadId]
  );

  // =========================
  // DEBOUNCE SAVE
  // =========================
  const scheduleSave = useCallback(
    (n, firma) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(n, firma);
      }, 500);
    },
    [saveToSupabase]
  );

  // =========================
  // HANDLERS
  // =========================
  const handleNombre = (value) => {
    setNombre(value);
    scheduleSave(value, firmaData);
  };

  const handleFirma = useCallback(
    (payload) => {
      const dataDibujo =
        payload?.dataDibujo ??
        payload?.dibujo ??
        payload ??
        [];

      const limpio = isValidDibujo(dataDibujo) ? dataDibujo : [];

      setFirmaData(limpio);
      scheduleSave(nombre, limpio);
    },
    [nombre, scheduleSave]
  );

  const handleContinuar = async () => {
    if (!isValid) return;
    await saveToSupabase(nombre, firmaData);
    onComplete();
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos?.fondo}>
        <div className="p-10 text-center font-bold">Cargando...</div>
      </LayoutActividad>
    );
  }

  // =========================
  // UI COMPLETA
  // =========================
  return (
    <LayoutActividad fondo={data.recursos?.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold"
        >
          ← Regresar
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && "⏳ Guardando…"}
          {syncStatus === "saved" && "✅ Guardado"}
          {syncStatus === "error" && "❌ Error"}
        </span>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          🏠 Inicio
        </button>

      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="
        bg-white/95
        rounded-[2rem]
        border-4
        border-alianza-amarillo
        shadow-2xl
        p-6 md:p-10
      ">

        <h2 className="text-center text-2xl md:text-4xl font-black text-alianza-azul mb-8">
          {data.titulo}
        </h2>


        {/* CARTA */}
        <div className="max-w-3xl mx-auto bg-gray-100 border-8 border-alianza-azul rounded-xl p-6">

          {/* FRANJA SUPERIOR */}

          <div className="bg-alianza-azul h-8"></div>

          <div className="p-6 md:p-10">

            <h3 className="text-center font-black text-xl mb-8">
              MI COMPROMISO
            </h3>
            {/* NOMBRE */}

            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-3">

              <span className="font-medium text-lg">
                Yo,
              </span>

            <input
              value={nombre}
              onChange={(e) => handleNombre(e.target.value)}
              className="
                flex-1
                border-b-2 border-gray-500
                bg-transparent
                text-center text-lg
                p-2 outline-none
              "
              placeholder="Escribe tu nombre..."
            />
            </div>
          </div>

          <p className="mb-4 text-lg">
              me comprometo a:
            </p>

            <ul className="space-y-3 text-lg mb-10">

              {data.compromisos.map((item, index) => (
                <li key={index}>
                  • {item}
                </li>
              ))}

            </ul>

          {/* FIRMA */}
          <p className="text-center font-bold mb-3">Firma:</p>

          <TipoDibujar
            userId={userId}
            actividadId={actividadId}
            gestionarPropio={false}
            valorInicial={firmaData}
            canalId="firma"
            onChange={handleFirma}
          />

          <div className="flex justify-center items-end gap-4 md:gap-8 mt-8 flex-wrap">
            <img
              src={data.recursos.logoAlianza}
              alt="Alianza"
              className="h-14 md:h-30 object-contain"
            />

            <img
              src={data.recursos.logoClub}
              alt="Club Alianzito"
              className="h-16 md:h-24 object-contain"
            />

            <img
              src={data.recursos.personaje}
              alt="Personaje"
              className="h-20 md:h-32 object-contain"
            />

          </div>

        </div>

        {/* BOTÓN */}
        <button
          onClick={handleContinuar}
          disabled={!isValid}
          className={`w-full mt-8 py-4 rounded-full font-black text-xl ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isValid ? "¡Continuar!" : "Escribe tu nombre y firma"}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act10;