import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import TarjetaVistosa from "./TarjetaVistosa";
import MetaPersonal from "./MetaPersonal";
import CarruselRetos from "./CarruselRetos";
import ModalDetalleReto from "./ModalDetalleReto";
import ModalReto from "./ModalReto";
import ModalReconocimiento from "./ModalReconocimiento";
import { datosProgreso, estadoReto, ETIQUETAS_ESTADO, porMasReciente } from "../utils/retos";

const acortar = (texto, max = 22) =>
  !texto ? "" : texto.length > max ? texto.slice(0, max - 1) + "…" : texto;

// Cuántos retos se muestran en el carrusel
const MAX_CARRUSEL = 5;

const MENSAJES_ERROR = {
  fuera_de_fecha: "Este reto no está disponible hoy.",
  ya_completado: "¡Ya completaste este reto!",
  no_disponible: "Este reto ya no está disponible.",
  no_encontrado: "No encontramos este reto.",
};

const SeccionRetos = ({
  usuarioId,
  onCambio,
  irARetos = false,
  reconocimientoInicialId = null,   // reto cuyo reconocimiento debe abrirse (viene de Passport)
  onReconocimientoAbierto,
}) => {
  const [retos, setRetos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaMeta, setUltimaMeta] = useState(null);

  const [detalleId, setDetalleId] = useState(null);   // reto abierto en el modal de detalle
  const [marcando, setMarcando] = useState(false);    // "Hoy lo cumplí" en curso
  const [errorCheckin, setErrorCheckin] = useState("");
  const [celebracion, setCelebracion] = useState(null); // reto de hábito recién completado
  const [reconocimientoId, setReconocimientoId] = useState(null); // reto cuyo reconocimiento se muestra
  const yaHizoScroll = useRef(false);

  // silencioso = true refresca los datos sin mostrar "Cargando..."
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);

    // Se asegura de que el usuario esté inscrito en todos los retos activos
    await supabase.rpc("asegurar_retos_usuario", { p_usuario_id: usuarioId });

    const [{ data: retosData }, { data: metaData }] = await Promise.all([
      supabase
        .from("retos_usuario")
        .select(
          "id, progreso, completado, completado_en, oculto, ultimo_checkin, reflexion, reto:retos(id, titulo, descripcion, tipo, meta_monto, meta_dias, imagen_url, pide_reflexion, fecha_inicio, fecha_fin, recompensa_monedas, activo, creado_en)"
        )
        .eq("usuario_id", usuarioId)
        .eq("oculto", false),
      supabase
        .from("metas_personales")
        .select("descripcion")
        .eq("usuario_id", usuarioId)
        .order("creada_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // El orden por fecha de creación se hace aquí: el order() de PostgREST sobre una
    // tabla relacionada no reordena los retos del usuario.
    setRetos(
      (retosData || []).filter((r) => r.reto?.activo).sort(porMasReciente)
    );
    setUltimaMeta(metaData?.descripcion || null);
    setCargando(false);
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId) cargar();
  }, [usuarioId, cargar]);

  // Si el niño llegó desde el aviso "¡Nuevo reto disponible!", baja hasta el carrusel.
  useEffect(() => {
    if (!irARetos || cargando || yaHizoScroll.current) return;
    yaHizoScroll.current = true;
    document
      .getElementById("retos-carrusel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [irARetos, cargando]);

  // Passport pide abrir el reconocimiento de un reto de ahorro recién completado.
  useEffect(() => {
    if (!reconocimientoInicialId || cargando) return;
    if (retos.some((r) => r.id === reconocimientoInicialId)) {
      setReconocimientoId(reconocimientoInicialId);
    }
    onReconocimientoAbierto?.();
  }, [reconocimientoInicialId, cargando, retos, onReconocimientoAbierto]);

  const ocultarVencido = async (retoUsuarioId) => {
    await supabase.rpc("ocultar_reto_usuario", { p_retos_usuario_id: retoUsuarioId });
    setRetos((prev) => prev.filter((r) => r.id !== retoUsuarioId));
  };

  const abrirDetalle = (id) => {
    setErrorCheckin("");
    setDetalleId(id);
  };

  // "Hoy lo cumplí": registra el día y, si era el último, completa el reto.
  const marcarHoy = async (ru) => {
    if (marcando) return;
    setMarcando(true);
    setErrorCheckin("");

    const { data, error } = await supabase.rpc("registrar_checkin_reto", {
      p_usuario_id: usuarioId,
      p_retos_usuario_id: ru.id,
    });
    setMarcando(false);

    if (error || !data?.ok) {
      setErrorCheckin(MENSAJES_ERROR[data?.error] || "No se pudo guardar. Inténtalo de nuevo.");
      if (data?.error) cargar(true);
      return;
    }

    await cargar(true);

    if (data.completado) {
      setDetalleId(null);
      setCelebracion({
        retosUsuarioId: data.retos_usuario_id,
        titulo: data.titulo,
        monedas: data.monedas,
        pideReflexion: data.pide_reflexion,
      });
      onCambio?.(); // para que la alcancía se actualice
    }
  };

  const guardarReflexion = async (texto) => {
    await supabase.rpc("guardar_reflexion_reto", {
      p_usuario_id: usuarioId,
      p_retos_usuario_id: celebracion.retosUsuarioId,
      p_texto: texto,
    });
    await cargar(true); // así el reconocimiento ya incluye la reflexión
  };

  const ultimoReto = retos[0]?.reto?.titulo;
  const detalle = retos.find((r) => r.id === detalleId);
  const reconocimiento = retos.find((r) => r.id === reconocimientoId && r.completado);
  const nombreUsuario = JSON.parse(localStorage.getItem("usuario") || "null")?.nombre || "";
  const enCarrusel = retos
    .filter((r) => estadoReto(r.reto) !== "vencido")
    .slice(0, MAX_CARRUSEL);

  return (
    <>
      <CarruselRetos retos={enCarrusel} onAbrir={abrirDetalle} />

      <TarjetaVistosa
        emoji="🎯"
        titulo="Mi meta"
        resumen={cargando ? undefined : ultimaMeta ? acortar(ultimaMeta) : "Sin meta aún"}
        color="morado"
      >
        <MetaPersonal usuarioId={usuarioId} />
      </TarjetaVistosa>

      <TarjetaVistosa
        emoji="🏆"
        titulo="Retos"
        resumen={cargando ? undefined : ultimoReto ? acortar(ultimoReto) : "Sin retos aún"}
        color="naranja"
      >
        {cargando ? (
          <p className="text-gray-400 text-sm">Cargando retos...</p>
        ) : retos.length === 0 ? (
          <p className="text-gray-400 text-sm">Todavía no tienes retos.</p>
        ) : (
          <div className="grid gap-3">
            {retos.map((r) => {
              const estado = estadoReto(r.reto);
              const prog = datosProgreso(r);
              return (
                <div
                  key={r.id}
                  onClick={() => abrirDetalle(r.id)}
                  className="bg-gray-50 rounded-2xl p-4 relative border border-gray-100 cursor-pointer hover:bg-gray-100 transition"
                >
                  {estado === "vencido" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ocultarVencido(r.id);
                      }}
                      className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"
                      title="Ocultar reto vencido"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-alianza-azul">{r.reto.titulo}</h4>
                    {r.completado && <CheckCircle2 size={16} className="text-green-500" />}
                  </div>
                  <p className={`text-xs font-bold mt-0.5 ${ETIQUETAS_ESTADO[estado].color}`}>
                    {ETIQUETAS_ESTADO[estado].texto} · 🪙 {r.reto.recompensa_monedas}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div
                      className="bg-alianza-amarillo h-2.5 rounded-full"
                      style={{ width: `${prog.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {prog.texto} · {prog.porcentaje}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </TarjetaVistosa>

      {detalle && (
        <ModalDetalleReto
          ru={detalle}
          marcando={marcando}
          error={errorCheckin}
          onMarcar={marcarHoy}
          onVerReconocimiento={(ru) => {
            setDetalleId(null);
            setReconocimientoId(ru.id);
          }}
          onClose={() => setDetalleId(null)}
        />
      )}

      {celebracion && (
        <ModalReto
          titulo={celebracion.titulo}
          monedas={celebracion.monedas}
          pideReflexion={celebracion.pideReflexion}
          onGuardarReflexion={guardarReflexion}
          onVerReconocimiento={() => {
            setReconocimientoId(celebracion.retosUsuarioId);
            setCelebracion(null);
          }}
          onClose={() => setCelebracion(null)}
        />
      )}

      {reconocimiento && (
        <ModalReconocimiento
          ru={reconocimiento}
          nombreUsuario={nombreUsuario}
          onClose={() => setReconocimientoId(null)}
        />
      )}
    </>
  );
};

export default SeccionRetos;