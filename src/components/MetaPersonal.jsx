import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ajusta la ruta según tu proyecto
import { hoyMX } from "../utils/fecha";
import ModalMeta from "./ModalMeta";
import ProgresoDias from "./ProgresoDias";

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

// Componente que muestra la meta personal del socio y su avance.
// La meta puede ser de ahorro (se avanza al registrar ahorros) o de hábito (se marca cada día).
const MetaPersonal = ({ usuarioId }) => {
  const [meta, setMeta] = useState(null);           // la meta más reciente del socio (o null si nunca ha creado una)
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [marcando, setMarcando] = useState(false);  // "Hoy lo cumplí" en curso
  const [errorCheckin, setErrorCheckin] = useState("");

  // Trae de la base de datos la meta más reciente del socio, sin importar si ya la completó.
  // silencioso = true refresca sin ocultar el componente mientras carga.
  const cargarMeta = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    const { data } = await supabase
      .from("metas_personales")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("creada_en", { ascending: false }) // la más nueva primero
      .limit(1)
      .maybeSingle();
    setMeta(data || null);
    setCargando(false);
    // Muestra el modal de "¡meta cumplida!"
    if (data?.completada && !data?.notificada) setMostrarModal(true);
  };

  // Carga la meta en cuanto se conoce el id del usuario.
  useEffect(() => {
    if (usuarioId) cargarMeta();
  }, [usuarioId]);

  // Guarda una meta nueva
  const crearMeta = async () => {
    const esHabito = form.tipo === "habito";

    // Validación
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
    // Limpia el formulario y lo oculta, y refresca la meta desde la base de datos.
    setForm(FORM_VACIO);
    setMostrarForm(false);
    setMostrarModal(false);
    cargarMeta();
  };

  // "Hoy lo cumplí" de una meta de hábito
  const marcarHoy = async () => {
    if (marcando || !meta) return;
    setMarcando(true);
    setErrorCheckin("");

    const { data, error } = await supabase.rpc("registrar_checkin_meta", {
      p_usuario_id: usuarioId,
      p_meta_id: meta.id,
    });
    setMarcando(false);

    if (error || !data?.ok) {
      setErrorCheckin(MENSAJES_ERROR[data?.error] || "No se pudo guardar. Inténtalo de nuevo.");
      if (data?.error) cargarMeta(true);
      return;
    }

    // Refresca; si la meta quedó completa, cargarMeta abre el modal de felicitación.
    await cargarMeta(true);
  };

  // Se ejecuta al cerrar el modal de felicitación: marca en la base de datos que ya se
  // le avisó al socio (para que no vuelva a salir el modal) y refresca los datos.
  const cerrarModal = async () => {
    if (meta?.id) {
      await supabase.rpc("marcar_meta_notificada", { p_meta_id: meta.id });
    }
    setMostrarModal(false);
    cargarMeta(true); // refresca para que meta.notificada quede en true localmente
  };

  // Mientras se consulta Supabase no se dibuja nada, para no mostrar un estado a medias.
  if (cargando) return null;

  // El socio puede crear una meta nueva si nunca ha tenido una, o si la última ya se completó
  const puedeCrearNueva = !meta || meta.completada;

  const esHabitoActual = meta?.tipo === "habito";
  const hechoHoy = meta?.ultimo_checkin === hoyMX();

  // Porcentaje de avance de la meta actual
  const porcentaje =
    meta && !meta.completada
      ? esHabitoActual
        ? Math.min(100, Math.round((meta.dias_cumplidos / meta.meta_dias) * 100))
        : Math.min(100, Math.round((meta.monto_actual / meta.monto_meta) * 100))
      : 0;

  const esHabitoForm = form.tipo === "habito";

  return (
    <div>
      {/* Formulario para crear una meta nueva */}
      {mostrarForm && (
        <div className="grid gap-3">
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
            value={form.fecha_prevista}
            onChange={(e) => setForm({ ...form, fecha_prevista: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={crearMeta}
              className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold text-sm"
            >
              Guardar meta
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              className="text-gray-400 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Meta de ahorro en progreso: barra de avance */}
      {!mostrarForm && meta && !meta.completada && !esHabitoActual && (
        <div>
          <p className="text-sm font-bold text-gray-700">{meta.descripcion}</p>
          <div className="w-full bg-gray-100 rounded-full h-3 mt-3 overflow-hidden">
            <div
              className="bg-alianza-amarillo h-3 rounded-full transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ${meta.monto_actual} / ${meta.monto_meta} · {porcentaje}%
            {meta.fecha_prevista ? ` · meta: ${meta.fecha_prevista}` : ""}
          </p>
        </div>
      )}

      {/* Meta de hábito en progreso: días cumplidos y botón "Hoy lo cumplí" */}
      {!mostrarForm && meta && !meta.completada && esHabitoActual && (
        <div>
          <p className="text-sm font-bold text-gray-700">🌱 {meta.descripcion}</p>
          <div className="mt-3">
            <ProgresoDias actual={meta.dias_cumplidos} meta={meta.meta_dias} porcentaje={porcentaje} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {meta.dias_cumplidos} / {meta.meta_dias} días · {porcentaje}%
            {meta.fecha_prevista ? ` · meta: ${meta.fecha_prevista}` : ""}
          </p>

          <div className="mt-4">
            {hechoHoy ? (
              <p className="text-sm text-green-700 bg-green-50 rounded-2xl p-3 text-center font-bold">
                ¡Hoy ya la cumpliste! Vuelve mañana 🌙
              </p>
            ) : (
              <>
                <button
                  onClick={marcarHoy}
                  disabled={marcando}
                  className="w-full bg-alianza-azul text-white py-3 rounded-full font-black shadow disabled:opacity-60 active:scale-95 transition-transform"
                >
                  {marcando ? "Guardando..." : "✅ Hoy lo cumplí"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Márcalo solo si de verdad lo hiciste 😉
                </p>
              </>
            )}
            {errorCheckin && <p className="text-sm text-red-500 text-center mt-2">{errorCheckin}</p>}
          </div>
        </div>
      )}

      {/* Meta ya completada: mensaje de logro */}
      {!mostrarForm && meta && meta.completada && (
        <p className="text-sm text-green-600 font-bold mb-2">
          ✅ Meta cumplida: {meta.descripcion}
        </p>
      )}

      {/* Botón para crear meta nueva */}
      {!mostrarForm && puedeCrearNueva && (
        <button
          onClick={() => setMostrarForm(true)}
          className="text-sm font-bold text-alianza-azul underline"
        >
          + Crear una meta
        </button>
      )}

      {/* Modal de felicitación al completar la meta */}
      {mostrarModal && meta && (
        <ModalMeta
          descripcion={meta.descripcion}
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