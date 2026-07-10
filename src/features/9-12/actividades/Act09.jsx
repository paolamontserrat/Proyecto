import React, { useState, useEffect, useCallback, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const estilosAnimacion = `
@keyframes floatSoft{
  0%,100%{transform:translateY(0px);}
  50%{transform:translateY(-8px);}
}

@keyframes aparecer{
  from{
    opacity:0;
    transform:translateY(15px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}

.animate-float-soft{
  animation:floatSoft 4s ease-in-out infinite;
}

.animate-aparecer{
  animation:aparecer .6s ease;
}
`;

const acuerdosIniciales = {
  a1: "",
  a2: "",
  a3: "",
  a4: "",
  a5: "",
};

const Act09 = ({ data, onBack, onComplete, rango }) => {
  const navigate = useNavigate();

  //=========================
  // USUARIO
  //=========================

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";
  const actividadId = data.id;

  //=========================
  // ESTADOS
  //=========================

  const [loading, setLoading] = useState(true);

  const [acuerdos, setAcuerdos] = useState(acuerdosIniciales);

  const [firmaData, setFirmaData] = useState([]);

  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  //=========================
  // VALIDACIONES
  //=========================

  const isValidFirma = (dibujo) => Array.isArray(dibujo) && dibujo.length > 0;

  const isValid =
    Object.values(acuerdos).every((x) => x.trim() !== "") &&
    isValidFirma(firmaData);

  //=========================
  // CARGAR SUPABASE
  //=========================

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
        .eq("actividad_id", actividadId)
        .maybeSingle();

      const info = db?.datos_actividad;

      if (info) {
        setAcuerdos(info.acuerdos || acuerdosIniciales);
        setFirmaData(Array.isArray(info.firma) ? info.firma : []);
      }

      setLoading(false);
    };

    cargar();
  }, [actividadId, userId]);

  //=========================
  // GUARDAR SUPABASE
  //=========================

  const saveToSupabase = useCallback(
    async (acuerdosGuardar, firmaGuardar) => {
      if (userId === "anon" || !actividadId) return;

      setSyncStatus("saving");

      const firmaFinal = isValidFirma(firmaGuardar) ? firmaGuardar : [];

      const completada =
        Object.values(acuerdosGuardar).every((a) => a.trim() !== "") &&
        firmaFinal.length > 0;

      const { error } = await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: actividadId,
          datos_actividad: {
            acuerdos: acuerdosGuardar,
            firma: firmaFinal,
          },
          completada,
        },
        {
          onConflict: "usuario_id,actividad_id",
        },
      );

      setSyncStatus(error ? "error" : "saved");

      setTimeout(() => {
        setSyncStatus("idle");
      }, 1200);
    },
    [userId, actividadId],
  );

  //=========================
  // DEBOUNCE SAVE
  //=========================

  const scheduleSave = useCallback(
    (acuerdosGuardar, firmaGuardar) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        saveToSupabase(acuerdosGuardar, firmaGuardar);
      }, 500);
    },
    [saveToSupabase],
  );

  //=========================
  // HANDLER ACUERDOS
  //=========================

  const handleAcuerdo = (campo, valor) => {
    const nuevosAcuerdos = {
      ...acuerdos,
      [campo]: valor,
    };

    setAcuerdos(nuevosAcuerdos);

    scheduleSave(nuevosAcuerdos, firmaData);
  };

  //=========================
  // HANDLER FIRMA
  //=========================

  const handleFirma = useCallback(
    (payload) => {
      const dibujo = payload?.dataDibujo ?? payload?.dibujo ?? payload ?? [];

      const limpio = isValidFirma(dibujo) ? dibujo : [];

      setFirmaData(limpio);

      scheduleSave(acuerdos, limpio);
    },
    [acuerdos, scheduleSave],
  );

  //=========================
  // CONTINUAR
  //=========================

  const handleContinuar = async () => {
    if (!isValid) return;

    await saveToSupabase(acuerdos, firmaData);

    onComplete();
  };

  //=========================
  // LOADING
  //=========================

  if (loading) {
    return (
      <LayoutActividad fondo={data.recursos.fondo}>
        <div className="text-center p-10 text-2xl font-bold">
          {data.botones.cargando}
        </div>
      </LayoutActividad>
    );
  }

  //=========================
  // UI
  //=========================

  return (
    <LayoutActividad fondo={data.recursos.fondo}>
      <style>{estilosAnimacion}</style>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold"
        >
          {data.botones.regresar}
        </button>

        <span className="text-sm font-medium">
          {syncStatus === "saving" && "⏳ Guardando..."}
          {syncStatus === "saved" && "✅ Guardado"}
          {syncStatus === "error" && "❌ Error"}
        </span>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold"
        >
          {data.botones.inicio}
        </button>
      </div>

      <div className="bg-white/95 rounded-[2rem] border-4 border-alianza-amarillo shadow-2xl p-6 md:p-10 animate-aparecer">
        <h1 className="text-center text-3xl md:text-5xl font-black text-alianza-azul mb-10">
          {data.titulo}
        </h1>

        {/* INFORMACIÓN */}

        <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-alianza-azul mb-5">
              {data.informacion.titulo}
            </h2>

            <p className="mb-4 text-lg leading-relaxed">
              {data.informacion.descripcion1}
            </p>

            <p className="mb-6 text-lg leading-relaxed">
              {data.informacion.descripcion2}
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={data.recursos.frasco}
              alt=""
              className="w-60 md:w-72 animate-float-soft"
            />
          </div>
        </div>

        {/* EJEMPLOS */}

        <div className="bg-sky-100 rounded-3xl p-6 mb-8">
          <h3 className="text-2xl font-black text-alianza-azul mb-5">
            {data.informacion.tituloEjemplos}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {data.informacion.ejemplos.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 shadow">
                ✅ {item}
              </div>
            ))}
          </div>
        </div>

        {/* META */}

        <div className="bg-green-100 rounded-3xl p-6 mb-8">
          <h3 className="text-2xl font-black text-green-700 mb-4">
            {data.informacion.tituloMeta}
          </h3>

          <p className="text-lg mb-4">{data.informacion.descripcion3}</p>

          <div className="bg-yellow-100 rounded-xl p-4 font-bold">
            <p className="text-xl mb-2">{data.informacion.ejemploTitulo}</p>

            <p>{data.informacion.ejemplo}</p>
          </div>
        </div>

        {/* GUARDIÁN */}

        <div className="bg-orange-100 rounded-3xl p-6 mb-10">
          <h3 className="text-2xl font-black text-orange-700 mb-5">
            {data.informacion.tituloGuardian}
          </h3>

          <ul className="space-y-3 text-lg">
            {data.informacion.funciones.map((item, index) => (
              <li key={index}>⭐ {item}</li>
            ))}
          </ul>

          <div className="mt-6 bg-red-100 rounded-xl p-4 font-bold text-red-700">
            {data.informacion.mensaje}
          </div>
        </div>

        {/* ACTIVIDAD */}

        <div className="bg-sky-50 rounded-3xl p-8 shadow-lg">
          <h2 className="text-center text-3xl font-black text-alianza-azul mb-3">
            {data.actividad.titulo}
          </h2>

          <p className="text-center text-lg mb-2">
            {data.actividad.descripcion}
          </p>

          <p className="text-center font-bold text-red-500 mb-8">
            {data.actividad.instruccion}
          </p>

          <div className="space-y-5">
            {data.actividad.acuerdos.map((titulo, index) => (
              <div key={index}>
                <label className="block font-bold mb-2">{titulo}</label>

                <input
                  type="text"
                  value={acuerdos[`a${index + 1}`]}
                  onChange={(e) =>
                    handleAcuerdo(`a${index + 1}`, e.target.value)
                  }
                  placeholder={data.actividad.placeholder}
                  className="w-full border-2 rounded-full p-3"
                />
              </div>
            ))}
          </div>
        </div>

        {/* FIRMA */}

        <div className="mt-10">
          <h2 className="text-center text-2xl font-black text-alianza-azul mb-2">
            {data.firma.titulo}
          </h2>

          <p className="text-center mb-6">{data.firma.descripcion}</p>

          <TipoDibujar
            userId={userId}
            actividadId={actividadId}
            gestionarPropio={false}
            valorInicial={firmaData}
            canalId="firma"
            onChange={handleFirma}
          />
        </div>

        {/* RESULTADO */}

        {!isValid && (
          <div className="text-center mt-6 text-red-600 font-bold">
            {data.resultado.error}
          </div>
        )}

        {/* BOTÓN */}

        <button
          onClick={handleContinuar}
          disabled={!isValid}
          className={`w-full mt-8 py-4 rounded-full font-black text-xl transition ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isValid
            ? data.botones.continuar
            : "Completa los acuerdos y la firma"}
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act09;
