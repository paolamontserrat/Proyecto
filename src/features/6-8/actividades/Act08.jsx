import React, { useState, useEffect, useRef } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";

const Act08 = ({ data, onBack, onComplete, rango }) => {

  const [jugadores, setJugadores] = useState(0);
  const [dado, setDado] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [datosCargados, setDatosCargados] = useState(false);

  const tableroRef = useRef(null);
  const [piezaActiva, setPiezaActiva] = useState(null);

  // =========================
  //  USER SEGURO
  // =========================
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id;

  // =========================
  //  KEY MULTIUSUARIO REAL
  // =========================
  const storageKey = `act08-${rango}-${data.id}-${userId || "anon"}`;

  const colores = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500"
  ];

  // =========================
  //  CARGA LOCAL + SUPABASE
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        // LOCAL
        const local = localStorage.getItem(storageKey);

        if (local) {
          const parsed = JSON.parse(local);
          setJugadores(parsed.jugadores || 0);
          setDado(parsed.dado || null);
          setPiezas(parsed.piezas || []);
        }

        // SUPABASE
        if (userId) {
          const { data: remote } = await supabase
            .from("progreso_actividades")
            .select("datos_actividad")
            .eq("usuario_id", userId)
            .eq("actividad_id", data.id)
            .maybeSingle();

          if (remote?.datos_actividad) {
            const parsed = remote.datos_actividad;

            setJugadores(parsed.jugadores || 0);
            setDado(parsed.dado || null);
            setPiezas(parsed.piezas || []);

            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        }

      } catch (err) {
        console.warn(err);
      } finally {
        setDatosCargados(true);
      }
    };

    load();
  }, [storageKey, userId, data.id]);

  // =========================
  //  SYNC
  // =========================
  const syncAll = async (newState) => {

    if (!datosCargados) return;

    localStorage.setItem(storageKey, JSON.stringify(newState));

    if (!userId) return;

    try {
      await supabase.from("progreso_actividades").upsert({
        usuario_id: userId,
        actividad_id: data.id,
        datos_actividad: newState,
        completada: false
      }, {
        onConflict: "usuario_id,actividad_id"
      });
    } catch (err) {
      console.warn("sync offline:", err);
    }
  };

  // =========================
  //  AUTO SYNC CONTROLADO
  // =========================
  useEffect(() => {
    if (!datosCargados) return;

    syncAll({ jugadores, dado, piezas });
  }, [jugadores, dado, piezas]);

  // =========================
  // CREAR JUGADORES
  // =========================
  const crearJugadores = (cantidad) => {
    const nuevas = [];

    for (let i = 0; i < cantidad; i++) {
      nuevas.push({
        id: i,
        x: 10 + i * 40,
        y: 10
      });
    }

    setJugadores(cantidad);
    setPiezas(nuevas);
  };

  // =========================
  // DADO
  // =========================
  const lanzarDado = () => {
    const numero = Math.floor(Math.random() * 6) + 1;
    setDado(numero);
  };

  // =========================
  // MOVER PIEZA
  // =========================
  const moverPieza = (id, clientX, clientY) => {
    if (!tableroRef.current) return;

    const tablero = tableroRef.current.getBoundingClientRect();
    const size = window.innerWidth < 768 ? 32 : 48;

    const x = Math.max(0, Math.min(clientX - tablero.left - size / 2, tablero.width - size));
    const y = Math.max(0, Math.min(clientY - tablero.top - size / 2, tablero.height - size));

    setPiezas(prev =>
      prev.map(p => (p.id === id ? { ...p, x, y } : p))
    );
  };

  // =========================
  // REINICIAR
  // =========================
  const reiniciar = async () => {
    const reset = { jugadores: 0, dado: null, piezas: [] };

    setJugadores(0);
    setDado(null);
    setPiezas([]);

    localStorage.setItem(storageKey, JSON.stringify(reset));

    if (userId) {
      await supabase.from("progreso_actividades").upsert({
        usuario_id: userId,
        actividad_id: data.id,
        datos_actividad: reset,
        completada: false
      }, {
        onConflict: "usuario_id,actividad_id"
      });
    }
  };

  return (
    <LayoutActividad fondo={data.recursos.fondo}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold">
          🏠 Inicio
        </button>

      </div>

      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo">

        <h2 className="text-2xl md:text-4xl font-black text-center text-alianza-azul mb-6">
          {data.titulo}
        </h2>

        {/* JUGADORES */}
        <div className="mb-8 text-center">
          <h3 className="font-black mb-3">¿Cuántos jugadores?</h3>

          {[1,2,3,4,5,6].map(num => (
            <button
              key={num}
              onClick={() => crearJugadores(num)}
              className={`px-4 py-2 m-1 rounded-full font-black ${
                jugadores === num ? "bg-alianza-azul text-white" : "bg-gray-200"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* DADO */}
        <div className="text-center mb-8">
          <button
            onClick={lanzarDado}
            className="bg-alianza-amarillo text-alianza-azul px-8 py-4 rounded-full font-black"
          >
            🎲 Lanzar dado
          </button>

          {dado && (
            <div className="text-6xl font-black mt-3">{dado}</div>
          )}
        </div>

        {/* TABLERO */}
        <div ref={tableroRef} className="relative w-full max-w-[800px] mx-auto">
          <img src={data.recursos.tablero} className="w-full rounded-2xl" />

          {piezas.map((pieza, index) => (
            <div
              key={pieza.id}
              className="absolute"
              style={{ left: pieza.x, top: pieza.y, width: 40, height: 40 }}
              draggable
              onDragEnd={(e) => moverPieza(pieza.id, e.clientX, e.clientY)}
              onTouchStart={() => setPiezaActiva(pieza.id)}
              onTouchMove={(e) => {
                if (piezaActiva !== pieza.id) return;
                const t = e.touches[0];
                moverPieza(pieza.id, t.clientX, t.clientY);
              }}
              onTouchEnd={() => setPiezaActiva(null)}
            >
              <img src={data.recursos.pieza} className="w-full h-full" />
              <div className={`absolute -top-1 -right-1 w-5 h-5 ${colores[index]} rounded-full`} />
            </div>
          ))}
        </div>

        {/* REINICIAR */}
        <div className="text-center mt-6">
          <button
            onClick={reiniciar}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-black"
          >
            Reiniciar
          </button>
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-6 py-4 rounded-full font-black text-xl bg-alianza-amarillo text-alianza-azul"
        >
          ¡Continuar!
        </button>

      </div>
    </LayoutActividad>
  );
};

export default Act08;