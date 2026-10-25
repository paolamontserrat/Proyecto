import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import actividades05 from "../../features/0-5/actividades/actividades";
import actividades6 from "../../features/6/actividades/actividades";
import actividades7 from "../../features/7/actividades/actividades";
import actividades8 from "../../features/8/actividades/actividades";
import actividades9 from "../../features/9/actividades/actividades";
import actividades10 from "../../features/10/actividades/actividades";
import actividades11 from "../../features/11/actividades/actividades";
import actividades12 from "../../features/12/actividades/actividades";
import actividades13 from "../../features/13/actividades/actividades";
import actividades14 from "../../features/14/actividades/actividades";
import actividades15 from "../../features/15/actividades/actividades";
import actividades16 from "../../features/16/actividades/actividades";
import actividades17 from "../../features/17/actividades/actividades";

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

  // USER MULTIUSUARIO
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
  const [fechaUltima, setFechaUltima] = useState(null);
  const [cargandoProgreso, setCargandoProgreso] = useState(true);
  const [ahora, setAhora] = useState(Date.now());
  const [mensajeManana, setMensajeManana] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Fecha del calendario en México, no intervalo de 24 horas.
  const diaMexico = (fecha) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(fecha));
  const bloqueadaHoy = Boolean(fechaUltima && diaMexico(fechaUltima) >= diaMexico(ahora));
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const actividadesPorRango = {
    "0-5": actividades05,
    6: actividades6,
    7: actividades7,
    8: actividades8,
    9: actividades9,
    10: actividades10,
    11: actividades11,
    12: actividades12,
    13: actividades13,
    14: actividades14,
    15: actividades15,
    16: actividades16,
    17: actividades17,
  };

  const actividades = actividadesPorRango[rango] || [];

  // CARGAR JSON
  useEffect(() => {
    fetch(`/data/${rango}.json`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [rango]);

  
  // SCROLL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pasoVisible]);

  
  // SINCRONIZAR PROGRESO (SUPABASE + LOCAL)
  useEffect(() => {
    const sync = async () => {
      if (userId === "anon") { setCargandoProgreso(false); return; }

      try {
        const { data: progreso } = await supabase
          .from("progreso_actividades")
          .select("actividad_id, fecha_completado")
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

        const ultima = (progreso || []).find(p =>
          String(p.actividad_id) === String(actividades[frontera - 2]?.id ?? frontera - 1)
        );
        setFechaUltima(ultima?.fecha_completado || null);
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
      } finally {
        setCargandoProgreso(false);
      }
    };

    sync();
  }, [userId, rango]);

  
  // TOTAL PASOS
  const totalPasos = Math.min(
    data?.pasos?.length || 0,
    actividades.length || 0,
  );

  const pasoSeguro = Math.min(pasoVisible, totalPasos || 1);

  
  // GUARDAR PROGRESO
  const guardarProgreso = async (idActividad) => {
    if (userId === "anon") return new Date().toISOString();

    const fecha = new Date().toISOString();
    const { error } = await supabase.from("progreso_actividades").upsert(
      { usuario_id: userId, actividad_id: idActividad, completada: true,
        fecha_completado: fecha },
      { onConflict: "usuario_id,actividad_id" }
    );
    if (error) throw error;
    return fecha;
  };

  // Avanza solo la vista; si estaba en la ultima, ahi si mueve el progreso real
  const avanzarVista = () => {
    const siguiente = pasoVisible + 1;
    setPasoVisible(siguiente);
    if (pasoVisible === pasoActual) {
      setPasoActual(siguiente);
      localStorage.setItem(progresoKey, siguiente);
    }
  };

  
  // TERMINAR PASO
  const terminarPaso = async () => {
    if (guardando || cargandoProgreso || (userId !== 'anon' && bloqueadaHoy && pasoVisible === pasoActual)) return;
    const actividadObj = actividades[pasoSeguro - 1];
    const idReal = actividadObj?.id ?? pasoSeguro;
    const esFrontera = pasoVisible === pasoActual;
    if (!esFrontera) { setPasoVisible(Math.min(pasoVisible + 1, pasoActual)); return; }
    setGuardando(true);
    try {
      // Registrar gamificación antes del progreso: la función RPC decide si es nueva.
      if (userId !== 'anon') {
        const resultado = await registrarActividad(idReal);
        if (!resultado.nuevo) {
          alert('No fue posible registrar una actividad nueva. Actualiza tu progreso.');
          return;
        }
      }
      const fecha = await guardarProgreso(idReal);
      setFechaUltima(fecha);
      avanzarVista();
      if (userId === 'anon') setMensajeManana(true);
      // Si hay celebración, el mensaje aparece al cerrarla.
    } catch (error) {
      console.error('No se pudo guardar el progreso:', error);
      alert('No se pudo guardar tu avance. Inténtalo de nuevo.');
    } finally { setGuardando(false); }
  };

  const continuarDespuesDeCelebracion = () => {
    cerrarCelebracion();
    setMensajeManana(true);
  };

  // RETROCEDER
  const retroceder = () => {
    if (pasoVisible > 1) {
      setPasoVisible(pasoVisible - 1);
    } else {
      navigate(`/dashboard/${rango}`);
    }
  };

  const irANodo = (n) => {
    if (n <= pasoActual && !(n === pasoActual && bloqueadaHoy)) setPasoVisible(n);
  };

  
  // ESTADOS BASE
  if (!data?.pasos || cargandoProgreso) {
    return <div className="p-20 text-center">Cargando actividades...</div>;
  }

  if (actividades.length === 0) {
    return <div className="p-20 text-center">Sin actividades configuradas</div>;
  }
  
  // FINAL
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
              onClick={() => setPasoVisible(1)}
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
              bloqueadaHoy={bloqueadaHoy}
            />
          </div>
        )}

        {mensajeManana && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
              <p className="text-6xl mb-4">📅</p>
              <h2 className="text-2xl font-black text-alianza-azul">¡Próxima actividad mañana!</h2>
              <p className="mt-3 text-gray-600">¡Excelente trabajo! Regresa mañana para continuar tu aventura.</p>
              <button onClick={() => navigate(`/dashboard/${rango}`)} className="mt-6 w-full rounded-xl bg-alianza-azul text-white font-bold py-3">Volver al inicio</button>
            </div>
          </div>
        )}
        {bloqueadaHoy && pasoVisible === pasoActual ? (
          <div className="rounded-3xl p-8 text-center max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-4 justify-center">
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-16 py-3 rounded-full border-2 border-white font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white rounded-3xl p-8 text-center max-w-lg mx-auto shadow-xl">
              <p className="text-5xl mb-4">🔒</p>
              <h2 className="text-2xl font-black text-alianza-azul">¡Próxima actividad mañana!</h2>
              <p className="mt-3">Puedes repasar las actividades anteriores mientras tanto.</p>
            </div>
          </div>
        ) : DEBUG_COORDENADAS ? (
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
