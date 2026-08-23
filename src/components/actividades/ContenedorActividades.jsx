import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import actividades05 from "../../features/0-5/actividades/actividades";
import actividades6 from "../../features/6/actividades/actividades";
import actividades7 from "../../features/7/actividades/actividades";
import actividades8 from "../../features/8/actividades/actividades";
import actividades9 from "../../features/9/actividades/actividades";
import actividades10 from "../../features/10/actividades/actividades";
// import actividades11 from "../../features/11/actividades/actividades";
// import actividades12 from "../../features/12/actividades/actividades";
import actividades13 from "../../features/13/actividades/actividades";
// import actividades14 from "../../features/14/actividades/actividades";
// import actividades15 from "../../features/15/actividades/actividades";
import actividades16 from "../../features/16/actividades/actividades";
// import actividades17 from "../../features/17/actividades/actividades";

import Footer from "../Footer";
import CapturarCoordenadas from "./CapturarCoordenadas";
import ModalActividadCompletada from "../gamificacion/ModalActividadCompletada";
import MapaActividades from "../gamificacion/MapaActividades";
import { useGamificacion } from "../gamificacion/Gamificacion";
import { supabase } from "../../supabaseClient";

const ContenedorActividades = () => {
  const { rango } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState(null);

  // =========================
  // USER MULTIUSUARIO
  // =========================
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id || "anon";

  const { celebracion, registrarActividad, cerrarCelebracion } =
    useGamificacion(userId);

  const progresoKey = `progreso-${userId}-${rango}`;

  const [pasoActual, setPasoActual] = useState(() => {
    const guardado = parseInt(localStorage.getItem(progresoKey));
    return isNaN(guardado) ? 1 : guardado;
  });
  const [pasoVisible, setPasoVisible] = useState(pasoActual);

  const actividadesPorRango = {
    "0-5": actividades05,
    6: actividades6,
    7: actividades7,
    8: actividades8,
    9: actividades9,
    10: actividades10,
    // 11: actividades11,
    // 12: actividades12,
    13: actividades13,
    // 14: actividades14,
    // 15: actividades15,
    16: actividades16,
    // 17: actividades17,
  };

  const actividades = actividadesPorRango[rango] || [];

  // =========================
  // CARGAR JSON
  // =========================
  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [rango]);

  // =========================
  // SCROLL
  // =========================
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pasoVisible]);

  // =========================
  // SINCRONIZAR PROGRESO (SUPABASE + LOCAL)
  // =========================
  useEffect(() => {
    const sync = async () => {
      if (userId === "anon") return;

      try {
        const { data: progreso } = await supabase
          .from("progreso_actividades")
          .select("actividad_id")
          .eq("usuario_id", userId)
          .eq("completada", true);

        const completados = new Set(
          (progreso || []).map((p) => String(p.actividad_id)),
        );

        // Recorre las actividades EN ORDEN y se detiene en la primera
        // que no esté completada, sin importar si hay huecos o ids
        // no consecutivos en la base de datos.
        let frontera = 1;
        for (let i = 0; i < actividades.length; i++) {
          const idPosicion = String(actividades[i]?.id ?? i + 1);
          if (completados.has(idPosicion)) {
            frontera = i + 2;
          } else {
            break;
          }
        }

        setPasoActual(frontera);
        localStorage.setItem(progresoKey, frontera);

        const deseado = parseInt(searchParams.get("paso"));
        if (!isNaN(deseado) && deseado >= 1 && deseado <= frontera) {
          setPasoVisible(deseado);
        } else {
          setPasoVisible(frontera);
        }
      } catch (err) {
        console.warn("Sync error:", err);
      }
    };

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, rango]);

  // =========================
  // TOTAL PASOS
  // =========================
  const totalPasos = Math.min(
    data?.pasos?.length || 0,
    actividades.length || 0,
  );

  const pasoSeguro = Math.min(pasoVisible, totalPasos || 1);

  // =========================
  // GUARDAR PROGRESO
  // =========================
  const guardarProgreso = async (idActividad) => {
    if (userId === "anon") return;

    try {
      await supabase.from("progreso_actividades").upsert(
        {
          usuario_id: userId,
          actividad_id: idActividad,
          completada: true,
        },
        { onConflict: "usuario_id,actividad_id" },
      );
    } catch {}
  };

  // Avanza solo la vista; si estaba en la frontera, ahí sí mueve el progreso real
  const avanzarVista = () => {
    const siguiente = pasoVisible + 1;
    setPasoVisible(siguiente);
    if (pasoVisible === pasoActual) {
      setPasoActual(siguiente);
      localStorage.setItem(progresoKey, siguiente);
    }
  };

  // =========================
  // TERMINAR PASO (pasa por gamificación solo si es frontera y nueva)
  // =========================
  const terminarPaso = async () => {
    const actividadObj = actividades[pasoSeguro - 1];
    const idReal = actividadObj?.id || pasoSeguro;

    await guardarProgreso(idReal);

    if (userId === "anon") {
      avanzarVista();
      return;
    }

    const esFrontera = pasoVisible === pasoActual;
    const resultado = await registrarActividad(idReal);

    if (!resultado.nuevo || !esFrontera) {
      avanzarVista();
    }
    // si es frontera y es nueva, el avance ocurre al cerrar el modal de celebración
  };

  const continuarDespuesDeCelebracion = () => {
    cerrarCelebracion();
    avanzarVista();
  };

  // =========================
  // RETROCEDER
  // =========================
  const retroceder = () => {
    if (pasoVisible > 1) {
      setPasoVisible(pasoVisible - 1);
    } else {
      navigate(`/dashboard/${rango}`);
    }
  };

  const irANodo = (n) => {
    if (n <= pasoActual) setPasoVisible(n);
  };

  // =========================
  // ESTADOS BASE
  // =========================
  if (!data?.pasos) {
    return <div className="p-20 text-center">Cargando actividades...</div>;
  }

  if (actividades.length === 0) {
    return <div className="p-20 text-center">Sin actividades configuradas</div>;
  }

  // =========================
  // FINAL
  // =========================
  if (pasoVisible > totalPasos) {
    return (
      <div
        className="min-h-screen pb-12"
        style={{
          backgroundImage: `url('/images/${rango}/Fondo${rango}.png')`,
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >
        <main className="container mx-auto px-4">
          <div className="text-center p-8 md:p-16 bg-white/95 rounded-[3rem] shadow-2xl border-[8px] border-alianza-amarillo mt-20 max-w-2xl mx-auto">
            <img
              src={`/images/${rango}/33.png`}
              className="mx-auto mb-8 w-40 md:w-64"
            />

            <h2 className="text-3xl md:text-5xl font-black text-alianza-azul mb-6">
              ¡Felicidades terminaste las actividades!
            </h2>

            <button
              onClick={() => navigate(`/dashboard/${rango}`)}
              className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black mb-4 w-full md:w-auto"
            >
              Volver al inicio
            </button>

            <button
              onClick={() => {
                setPasoActual(1);
                setPasoVisible(1);
                localStorage.setItem(progresoKey, 1);
              }}
              className="bg-gray-200 text-alianza-azul px-8 py-4 rounded-full font-black w-full md:w-auto"
            >
              Repasar actividades
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const ActividadActual = actividades[pasoSeguro - 1];
  const pData = data.pasos[pasoSeguro - 1];

  if (!ActividadActual || !pData) {
    return (
      <div className="text-center p-20">
        Error: actividad no encontrada o desincronizada
      </div>
    );
  }

  const DEBUG_COORDENADAS = false; // Cambiar a true para capturar coordenadas

  return (
    <div
      className="min-h-screen pb-12"
      style={{
        backgroundImage: `url('/images/${rango}/Fondo${rango}.png')`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="container mx-auto px-4">
        {userId !== "anon" && (
          <div className="pt-4">
            <MapaActividades
              totalPasos={totalPasos}
              pasoActual={pasoActual}
              pasoVisible={pasoVisible}
              onSeleccionar={irANodo}
              variante="horizontal"
            />
          </div>
        )}

        {DEBUG_COORDENADAS ? (
          <CapturarCoordenadas imagen="/images/10/35.png" total={6} />
        ) : (
          <ActividadActual
            data={pData}
            onComplete={terminarPaso}
            onBack={retroceder}
            userId={userId}
            rango={rango}
          />
        )}
      </main>

      <ModalActividadCompletada
        celebracion={celebracion}
        onContinuar={continuarDespuesDeCelebracion}
      />

      <Footer />
    </div>
  );
};

export default ContenedorActividades;
