import React, { useState, useEffect, useCallback, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const estilosAnimacion = `
@keyframes floatSoft{
  0%,100%{transform:translateY(0);}
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
  animation:aparecer .5s ease;
}
`;

const diasIniciales = {
  lunes: { accion: "", ahorro: "" },
  martes: { accion: "", ahorro: "" },
  miercoles: { accion: "", ahorro: "" },
  jueves: { accion: "", ahorro: "" },
  viernes: { accion: "", ahorro: "" },
  sabado: { accion: "", ahorro: "" },
  domingo: { accion: "", ahorro: "" },
};

const Act10 = ({ data, onBack, onComplete, rango }) => {

  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const userId = usuario?.id ?? "anon";
  const actividadId = data.id;

  const [loading, setLoading] = useState(true);

  const [registro, setRegistro] = useState(diasIniciales);

  const [total, setTotal] = useState("");

  const [firmaData, setFirmaData] = useState([]);

  const [syncStatus, setSyncStatus] = useState("idle");

  const saveTimer = useRef(null);

  const isValidFirma = (d) =>
    Array.isArray(d) && d.length > 0;

  const isValid =
    Object.values(registro).every(
      (d) =>
        d.accion.trim() !== "" &&
        d.ahorro.trim() !== ""
    ) &&
    total.trim() !== "" &&
    isValidFirma(firmaData);

  //=========================
  // CARGAR
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

        setRegistro(info.registro || diasIniciales);

        setTotal(info.total || "");

        setFirmaData(
          Array.isArray(info.firma)
            ? info.firma
            : []
        );

      }

      setLoading(false);

    };

    cargar();

  }, [actividadId, userId]);

  //=========================
  // GUARDAR
  //=========================

  const saveToSupabase = useCallback(

    async (registroGuardar, totalGuardar, firmaGuardar) => {

      if (userId === "anon") return;

      setSyncStatus("saving");

      const firmaFinal = isValidFirma(firmaGuardar)
        ? firmaGuardar
        : [];

      const completada =
        Object.values(registroGuardar).every(
          (d) =>
            d.accion.trim() !== "" &&
            d.ahorro.trim() !== ""
        ) &&
        totalGuardar.trim() !== "" &&
        firmaFinal.length > 0;

      const { error } = await supabase
        .from("progreso_actividades")
        .upsert(
          {
            usuario_id: userId,
            actividad_id: actividadId,
            datos_actividad: {
              registro: registroGuardar,
              total: totalGuardar,
              firma: firmaFinal,
            },
            completada,
          },
          {
            onConflict:
              "usuario_id,actividad_id",
          }
        );

      setSyncStatus(
        error ? "error" : "saved"
      );

      setTimeout(() => {
        setSyncStatus("idle");
      }, 1200);

    },

    [userId, actividadId]

  );

  //=========================
  // DEBOUNCE
  //=========================

  const scheduleSave = useCallback(

    (r, t, f) => {

      if (saveTimer.current)
        clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(() => {
        saveToSupabase(r, t, f);
      }, 500);

    },

    [saveToSupabase]

  );

  //=========================
  // HANDLERS
  //=========================

  const handleRegistro = (
    dia,
    campo,
    valor
  ) => {

    const nuevo = {
      ...registro,
      [dia]: {
        ...registro[dia],
        [campo]: valor,
      },
    };

    setRegistro(nuevo);

    scheduleSave(
      nuevo,
      total,
      firmaData
    );

  };

  const handleTotal = (valor) => {

    setTotal(valor);

    scheduleSave(
      registro,
      valor,
      firmaData
    );

  };

  const handleFirma = useCallback(

    (payload) => {

      const dibujo =
        payload?.dataDibujo ??
        payload?.dibujo ??
        payload ??
        [];

      const limpio = isValidFirma(dibujo)
        ? dibujo
        : [];

      setFirmaData(limpio);

      scheduleSave(
        registro,
        total,
        limpio
      );

    },

    [registro, total, scheduleSave]

  );

  const handleContinuar = async () => {

    if (!isValid) return;

    await saveToSupabase(
      registro,
      total,
      firmaData
    );

    onComplete();

  };

  if (loading) {

    return (
      <LayoutActividad fondo={data.recursos.fondo}>
        <div className="text-center p-10 text-2xl font-bold">
          {data.botones.cargando}
        </div>
      </LayoutActividad>
    );

  }
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

        <h1 className="text-center text-3xl md:text-5xl font-black text-alianza-azul mb-6">
          {data.titulo}
        </h1>

        {/* INFORMACIÓN */}

        <div className="bg-sky-100 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-black text-alianza-azul mb-4">
            {data.informacion.titulo}
          </h2>

          <p className="text-lg mb-4 leading-relaxed">
            {data.informacion.descripcion1}
          </p>

          <p className="text-lg leading-relaxed">
            {data.informacion.descripcion2}
          </p>

          <div className="bg-yellow-100 rounded-xl p-4 mt-6 text-center font-bold text-lg">
            {data.informacion.mensaje}
          </div>

        </div>

        {/* TABLA */}

        <div className="bg-white rounded-3xl shadow-xl border-2 border-sky-200 overflow-hidden mb-8">

          <div className="bg-alianza-azul text-white grid grid-cols-12 font-black">

            <div className="col-span-2 p-4 text-center">
              {data.registro.columnas.dia}
            </div>

            <div className="col-span-7 p-4 text-center">
              {data.registro.columnas.accion}
            </div>

            <div className="col-span-3 p-4 text-center">
              {data.registro.columnas.ahorro}
            </div>

          </div>

          {[
            ["lunes", "Lunes"],
            ["martes", "Martes"],
            ["miercoles", "Miércoles"],
            ["jueves", "Jueves"],
            ["viernes", "Viernes"],
            ["sabado", "Sábado"],
            ["domingo", "Domingo"],
          ].map(([key, nombre]) => (

            <div
              key={key}
              className="grid grid-cols-12 gap-3 border-b p-3 items-center"
            >

              <div className="col-span-2">

                <div className="bg-indigo-500 text-white rounded-full text-center py-2 font-bold">

                  {nombre}

                </div>

              </div>

              <div className="col-span-7">

                <input
                  type="text"
                  value={registro[key].accion}
                  onChange={(e) =>
                    handleRegistro(
                      key,
                      "accion",
                      e.target.value
                    )
                  }
                  placeholder={data.registro.placeholderAccion}
                  className="w-full rounded-full border-2 border-sky-300 px-4 py-2"
                />

              </div>

              <div className="col-span-3">

                <input
                  type="number"
                  min="0"
                  value={registro[key].ahorro}
                  onChange={(e) =>
                    handleRegistro(
                      key,
                      "ahorro",
                      e.target.value
                    )
                  }
                  placeholder={data.registro.placeholderAhorro}
                  className="w-full rounded-full border-2 border-green-300 px-4 py-2 text-center"
                />

              </div>

            </div>

          ))}

        </div>

        {/* TOTAL */}

        <div className="bg-green-100 rounded-3xl p-6 mb-8">

          <h2 className="text-center text-3xl font-black text-green-700 mb-5">

            {data.total.titulo}

          </h2>

          <div className="max-w-sm mx-auto">

            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) =>
                handleTotal(e.target.value)
              }
              placeholder={data.total.placeholder}
              className="w-full text-center text-3xl rounded-full border-4 border-green-400 py-3 font-black"
            />

          </div>

          <p className="text-center mt-5 text-lg">
            {data.total.mensaje}
          </p>

        </div>
                {/* RECONOCIMIENTO */}

        <div className="bg-orange-100 rounded-3xl p-6 mb-8">

          <div className="flex flex-col md:flex-row items-center gap-8">

            <img
              src={data.recursos.aplausos}
              alt="Aplausos"
              className="w-52 animate-float-soft"
            />

            <div className="flex-1">

              <h2 className="text-3xl font-black text-orange-700 mb-4">
                {data.reconocimiento.titulo}
              </h2>

              <p className="text-lg mb-4">
                {data.reconocimiento.descripcion}
              </p>

              <ul className="space-y-3">

                {data.reconocimiento.lista.map((item, index) => (

                  <li
                    key={index}
                    className="bg-white rounded-xl p-3 shadow"
                  >
                    ⭐ {item}
                  </li>

                ))}

              </ul>

              <div className="mt-6 bg-yellow-200 rounded-xl p-4 text-center">

                <h3 className="text-2xl font-black text-red-500">

                  {data.reconocimiento.mensaje}

                </h3>

              </div>

            </div>

          </div>

        </div>

        {/* FIRMA */}

        <div className="bg-sky-50 rounded-3xl p-8 shadow-lg">

          <h2 className="text-center text-3xl font-black text-alianza-azul mb-3">

            {data.firma.titulo}

          </h2>

          <p className="text-center text-lg mb-6">

            {data.firma.descripcion}

          </p>

          <TipoDibujar
            userId={userId}
            actividadId={actividadId}
            gestionarPropio={false}
            valorInicial={firmaData}
            canalId="firma"
            onChange={handleFirma}
          />

        </div>

        {/* VALIDACIÓN */}

        {!isValid && (

          <div className="mt-6 text-center text-red-600 font-bold text-lg">

            {data.resultado.error}

          </div>

        )}

        {isValid && (

          <div className="mt-6 text-center text-green-600 font-bold text-xl">

            {data.resultado.exito}

          </div>

        )}

        {/* BOTÓN */}

        <button
          onClick={handleContinuar}
          disabled={!isValid}
          className={`w-full mt-8 py-4 rounded-full font-black text-xl transition-all duration-300 ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >

          {isValid
            ? data.botones.continuar
            : "Completa el registro para continuar"}

        </button>

      </div>

    </LayoutActividad>
  );

};

export default Act10;