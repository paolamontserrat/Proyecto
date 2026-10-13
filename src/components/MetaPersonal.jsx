import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { hoyMX } from "../utils/fecha";
import ModalMeta from "./ModalMeta";
import ProgresoDias from "./ProgresoDias";

// Cuántas metas vigentes (sin cumplir) puede tener un socio al mismo tiempo.
const MAX_METAS_ACTIVAS = 5;

const FORM_VACIO = {
  tipo: "ahorro",
  descripcion: "",
  monto_meta: "",
  meta_dias: "",
  fecha_prevista: "",
};

const TIPOS = {
  ahorro: { emoji: "💰", nombre: "Ahorro", placeholder: "¿Qué quieres lograr? Ej. Comprar un juguete" },
  habito: { emoji: "🌱", nombre: "Hábito", placeholder: "¿Qué hábito quieres lograr? Ej. Cerrar la llave al lavarme los dientes" },
};

const MENSAJES_ERROR = {
  ya_completada: "¡Ya completaste esta meta!",
  no_encontrada: "No encontramos esta meta.",
  no_es_habito: "Esta meta no es de hábito.",
};

// Porcentaje de avance de una meta (de ahorro por monto, de hábito por días)
const porcentajeDe = (m) => {
  const actual = Number(m.tipo === "habito" ? m.dias_cumplidos : m.monto_actual) || 0;
  const total = Number(m.tipo === "habito" ? m.meta_dias : m.monto_meta) || 0;
  return total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;
};

// Muestra TODAS las metas vigentes del socio con su avance, y permite crear más.
// Cada meta puede ser de ahorro (avanza al registrar ahorros) o de hábito (se marca cada día).
const MetaPersonal = ({ usuarioId }) => {
  const [metas, setMetas] = useState([]);              // todas las metas del socio (más nuevas primero)
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [metaModal, setMetaModal] = useState(null);    // meta recién cumplida a la que falta felicitar
  const [form, setForm] = useState(FORM_VACIO);
  const [marcandoId, setMarcandoId] = useState(null);  // id de la meta de hábito que se está marcando
  const [errorCheckin, setErrorCheckin] = useState({}); // { [metaId]: mensaje }

  // Trae de la base de datos todas las metas del socio.
  // silencioso = true refresca sin ocultar el componente mientras carga.
  const cargarMetas = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    const { data } = await supabase
      .from("metas_personales")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("creada_en", { ascending: false }); // la más nueva primero
    const lista = data || [];
    setMetas(lista);
    setCargando(false);
    // Si hay metas cumplidas sin felicitar, muestra el modal de la primera (las demás salen una por una)
    setMetaModal(lista.find((m) => m.completada && !m.notificada) || null);
  };

  useEffect(() => {
    if (usuarioId) cargarMetas();
  }, [usuarioId]);

  // Guarda una meta nueva
  const crearMeta = async () => {
    const esHabito = form.tipo === "habito";

    if (!form.descripcion.trim()) {
      alert("Escribe tu meta.");
      return;
    }
    if (esHabito) {
      const dias = Number(form.meta_dias);
      if (!Number.isInteger(dias) || dias < 1) {
        alert("Escribe cuántos días quieres cumplirla.");
        return;
      }
    } else if (!(Number(form.monto_meta) > 0)) {
      alert("Escribe el monto a ahorrar.");
      return;
    }

    const { error } = await supabase.from("metas_personales").insert({
      usuario_id: usuarioId,
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      monto_meta: esHabito ? null : Number(form.monto_meta),
      meta_dias: esHabito ? Number(form.meta_dias) : null,
      fecha_prevista: form.fecha_prevista || null, // la fecha es opcional
    });
    if (error) return alert("No se pudo crear la meta: " + error.message);

    setForm(FORM_VACIO);
    setMostrarForm(false);
    cargarMetas(true);
  };

  // "Hoy lo cumplí" de una meta de hábito
  const marcarHoy = async (meta) => {
    if (marcandoId) return;
    setMarcandoId(meta.id);
    setErrorCheckin((prev) => ({ ...prev, [meta.id]: "" }));

    const { data, error } = await supabase.rpc("registrar_checkin_meta", {
      p_usuario_id: usuarioId,
      p_meta_id: meta.id,
    });
    setMarcandoId(null);

    if (error || !data?.ok) {
      const mensaje = MENSAJES_ERROR[data?.error] || "No se pudo guardar. Inténtalo de nuevo.";
      setErrorCheckin((prev) => ({ ...prev, [meta.id]: mensaje }));
      if (data?.error) cargarMetas(true);
      return;
    }

    // Refresca; si la meta quedó completa, cargarMetas abre el modal de felicitación.
    await cargarMetas(true);
  };

  // Al cerrar el modal de felicitación se marca esa meta como notificada y se refresca
  // (si hay otra meta cumplida pendiente, aparece su modal).
  const cerrarModal = async () => {
    if (metaModal?.id) {
      await supabase.rpc("marcar_meta_notificada", { p_meta_id: metaModal.id });
    }
    setMetaModal(null);
    cargarMetas(true);
  };

  // Mientras se consulta Supabase no se dibuja nada, para no mostrar un estado a medias.
  if (cargando) return null;

  const activas = metas.filter((m) => !m.completada);
  const cumplidas = metas.filter((m) => m.completada).slice(0, 3); // solo las 3 últimas
  const puedeCrear = activas.length < MAX_METAS_ACTIVAS;
  const esHabitoForm = form.tipo === "habito";

  return (
    <div>
      {/* Formulario para crear una meta nueva */}
      {mostrarForm && (
        <div className="grid gap-3 mb-4">
          {/* Tipo de meta */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TIPOS).map(([clave, t]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setForm({ ...form, tipo: clave })}
                className={`rounded-xl border-2 px-3 py-2 font-black text-sm transition ${
                  form.tipo === clave
                    ? "border-alianza-azul bg-alianza-azul/5 text-alianza-azul"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                {t.emoji} {t.nombre}
              </button>
            ))}
          </div>

          <input
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder={TIPOS[form.tipo].placeholder}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />

          {esHabitoForm ? (
            <input
              type="number"
              min="1"
              max="365"
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="¿Cuántos días quieres cumplirla? Ej. 7"
              value={form.meta_dias}
              onChange={(e) => setForm({ ...form, meta_dias: e.target.value })}
            />
          ) : (
            <input
              type="number"
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Monto a ahorrar ($)"
              value={form.monto_meta}
              onChange={(e) => setForm({ ...form, monto_meta: e.target.value })}
            />
          )}

          <input
            type="date"
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder="Fecha prevista de cumplimiento"
            value={form.fecha_prevista}
            onChange={(e) => setForm({ ...form, fecha_prevista: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={crearMeta} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold text-sm">
              Guardar meta
            </button>
            <button onClick={() => setMostrarForm(false)} className="text-gray-400 text-sm font-bold">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Sin metas vigentes */}
      {!mostrarForm && activas.length === 0 && (
        <p className="text-sm text-gray-400 mb-3">Aún no tienes metas vigentes. ¡Crea la primera!</p>
      )}

      {/* Metas vigentes: una tarjeta por meta */}
      {!mostrarForm && activas.length > 0 && (
        <div className="grid gap-3 mb-3">
          {activas.map((meta) => {
            const esHabito = meta.tipo === "habito";
            const porcentaje = porcentajeDe(meta);
            const hechoHoy = meta.ultimo_checkin === hoyMX();

            return (
              <div key={meta.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-700">
                  {TIPOS[meta.tipo]?.emoji || "🎯"} {meta.descripcion}
                </p>

                {esHabito ? (
                  <>
                    <div className="mt-3">
                      <ProgresoDias actual={meta.dias_cumplidos} meta={meta.meta_dias} porcentaje={porcentaje} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {meta.dias_cumplidos} / {meta.meta_dias} días · {porcentaje}%
                      {meta.fecha_prevista ? ` · meta: ${meta.fecha_prevista}` : ""}
                    </p>

                    <div className="mt-3">
                      {hechoHoy ? (
                        <p className="text-sm text-green-700 bg-green-50 rounded-2xl p-3 text-center font-bold">
                          ¡Hoy ya la cumpliste! Vuelve mañana 🌙
                        </p>
                      ) : (
                        <>
                          <button
                            onClick={() => marcarHoy(meta)}
                            disabled={marcandoId === meta.id}
                            className="w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow disabled:opacity-60 active:scale-95 transition-transform"
                          >
                            {marcandoId === meta.id ? "Guardando..." : "✅ Hoy lo cumplí"}
                          </button>
                          <p className="text-xs text-gray-400 text-center mt-2">Márcalo solo si de verdad lo hiciste 😉</p>
                        </>
                      )}
                      {errorCheckin[meta.id] && (
                        <p className="text-sm text-red-500 text-center mt-2">{errorCheckin[meta.id]}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
                      <div
                        className="bg-alianza-amarillo h-3 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${meta.monto_actual} / ${meta.monto_meta} · {porcentaje}%
                      {meta.fecha_prevista ? ` · meta: ${meta.fecha_prevista}` : ""}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Metas cumplidas (las últimas 3) */}
      {!mostrarForm && cumplidas.length > 0 && (
        <div className="mb-3">
          {cumplidas.map((m) => (
            <p key={m.id} className="text-sm text-green-600 font-bold mb-1">
              ✅ Meta cumplida: {m.descripcion}
            </p>
          ))}
        </div>
      )}

      {/* Botón para crear otra meta (puede haber varias vigentes a la vez) */}
      {!mostrarForm && puedeCrear && (
        <button onClick={() => setMostrarForm(true)} className="text-sm font-bold text-alianza-azul underline">
          + Crear una meta
        </button>
      )}
      {!mostrarForm && !puedeCrear && (
        <p className="text-xs text-gray-400">
          Ya tienes {MAX_METAS_ACTIVAS} metas vigentes. Cumple una para crear otra.
        </p>
      )}

      {/* Modal de felicitación al completar una meta */}
      {metaModal && (
        <ModalMeta
          descripcion={metaModal.descripcion}
          onClose={cerrarModal}
          onCrearOtraMeta={() => {
            cerrarModal();
            setMostrarForm(true);
          }}
        />
      )}
    </div>
  );
};

export default MetaPersonal;