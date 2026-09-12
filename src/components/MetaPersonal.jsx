import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ajusta la ruta según tu proyecto
import ModalMeta from "./ModalMeta";

// Componente que muestra la meta de ahorro personal del socio y su barra de progreso.
const MetaPersonal = ({ usuarioId }) => {
  const [meta, setMeta] = useState(null);           // la meta más reciente del socio (o null si nunca ha creado una)
  const [cargando, setCargando] = useState(true);    
  const [mostrarForm, setMostrarForm] = useState(false);   
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ descripcion: "", monto_meta: "", fecha_prevista: "" });

  // Trae de la base de datos la meta más reciente del socio, sin importar si ya la completó.
  const cargarMeta = async () => {
    setCargando(true);
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
    // Validación
    if (!form.descripcion || !form.monto_meta) {
      alert("Escribe tu meta y el monto a ahorrar.");
      return;
    }
    const { error } = await supabase.from("metas_personales").insert({
      usuario_id: usuarioId,
      descripcion: form.descripcion,
      monto_meta: Number(form.monto_meta),
      fecha_prevista: form.fecha_prevista || null, // la fecha es opcional
    });
    if (error) return alert("No se pudo crear la meta: " + error.message);
    // Limpia el formulario y lo oculta, y refresca la meta desde la base de datos.
    setForm({ descripcion: "", monto_meta: "", fecha_prevista: "" });
    setMostrarForm(false);
    setMostrarModal(false);
    cargarMeta();
  };

  // Se ejecuta al cerrar el modal de felicitación: marca en la base de datos que ya se
  // le avisó al socio (para que no vuelva a salir el modal) y refresca los datos.
  const cerrarModal = async () => {
    if (meta?.id) {
      await supabase.rpc("marcar_meta_notificada", { p_meta_id: meta.id });
    }
    setMostrarModal(false);
    cargarMeta(); // refresca para que meta.notificada quede en true localmente
  };

  // Mientras se consulta Supabase no se dibuja nada, para no mostrar un estado a medias.
  if (cargando) return null;

  // El socio puede crear una meta nueva si nunca ha tenido una, o si la última ya se completó
  const puedeCrearNueva = !meta || meta.completada;

  // Porcentaje de avance de la meta actual 
  const porcentaje = meta && !meta.completada
    ? Math.min(100, Math.round((meta.monto_actual / meta.monto_meta) * 100))
    : 0;

  return (
    <div>
      {/* Formulario para crear una meta nueva */}
      {mostrarForm && (
        <div className="grid gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="¿Qué quieres lograr? Ej. Comprar un juguete"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <input
            type="number"
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Monto a ahorrar ($)"
            value={form.monto_meta}
            onChange={(e) => setForm({ ...form, monto_meta: e.target.value })}
          />
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
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

      {/* Meta activa en progreso: barra de avance */}
      {!mostrarForm && meta && !meta.completada && (
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
          + Crear una meta de ahorro
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