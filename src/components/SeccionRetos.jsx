import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "../supabaseClient"; // ajusta la ruta según tu proyecto
import TarjetaVistosa from "./TarjetaVistosa";
import MetaPersonal from "./MetaPersonal";

// Uso: <SeccionRetos usuarioId={usuario.id} /> dentro de Pasaporte.jsx
// Nota: la alcancía ya NO vive aquí, se muestra como banner fijo en Passport.jsx

const acortar = (texto, max = 22) =>
  !texto ? "" : texto.length > max ? texto.slice(0, max - 1) + "…" : texto;

const calcularEstado = (reto) => {
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy < reto.fecha_inicio) return "proximo";
  if (hoy > reto.fecha_fin) return "vencido";
  return "vigente";
};

const ETIQUETAS = {
  vigente: { texto: "🟢 Vigente", color: "text-green-600" },
  proximo: { texto: "🔵 Próximo", color: "text-blue-500" },
  vencido: { texto: "⚪ Vencido", color: "text-gray-400" },
};

const SeccionRetos = ({ usuarioId }) => {
  const [retos, setRetos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaMeta, setUltimaMeta] = useState(null);

  const cargar = async () => {
    setCargando(true);

    // Se asegura de que el usuario esté inscrito en todos los retos activos
    // antes de leerlos (por si el enrolamiento automático no lo alcanzó).
    await supabase.rpc("asegurar_retos_usuario", { p_usuario_id: usuarioId });

    const [{ data: retosData }, { data: metaData }] = await Promise.all([
      supabase
        .from("retos_usuario")
        .select("id, progreso, completado, oculto, reto:retos(id, titulo, descripcion, meta_monto, fecha_inicio, fecha_fin, recompensa_monedas, activo, creado_en)")
        .eq("usuario_id", usuarioId)
        .eq("oculto", false)
        .order("creado_en", { foreignTable: "retos", ascending: false }),
      supabase
        .from("metas_personales")
        .select("descripcion")
        .eq("usuario_id", usuarioId)
        .order("creada_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setRetos((retosData || []).filter((r) => r.reto?.activo));
    setUltimaMeta(metaData?.descripcion || null);
    setCargando(false);
  };

  useEffect(() => {
    if (usuarioId) cargar();
  }, [usuarioId]);

  const ocultarVencido = async (retoUsuarioId) => {
    await supabase.rpc("ocultar_reto_usuario", { p_retos_usuario_id: retoUsuarioId });
    setRetos((prev) => prev.filter((r) => r.id !== retoUsuarioId));
  };

  const ultimoReto = retos[0]?.reto?.titulo;

  return (
    <>
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
              const estado = calcularEstado(r.reto);
              const porcentaje = Math.min(100, Math.round((r.progreso / r.reto.meta_monto) * 100));
              return (
                <div key={r.id} className="bg-gray-50 rounded-2xl p-4 relative border border-gray-100">
                  {estado === "vencido" && (
                    <button
                      onClick={() => ocultarVencido(r.id)}
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
                  <p className={`text-xs font-bold mt-0.5 ${ETIQUETAS[estado].color}`}>
                    {ETIQUETAS[estado].texto} · 🪙 {r.reto.recompensa_monedas}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div
                      className="bg-alianza-amarillo h-2.5 rounded-full"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${r.progreso} / ${r.reto.meta_monto} · {porcentaje}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </TarjetaVistosa>
    </>
  );
};

export default SeccionRetos;