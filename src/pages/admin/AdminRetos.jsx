import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Coins, ImagePlus, X } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { hoyMX, diasEntre } from "../../utils/fecha";
import { comprimirImagen } from "../../utils/imagen";

const BUCKET = "retos-imagenes";

const VACIO = {
  tipo: "ahorro",
  titulo: "",
  descripcion: "",
  meta_monto: "",
  meta_dias: "",
  pide_reflexion: false,
  fecha_inicio: "",
  fecha_fin: "",
  recompensa_monedas: 1,
  imagen_url: "",
};

const TIPOS = {
  ahorro: { emoji: "💰", nombre: "Ahorro", ayuda: "Se completa al ahorrar cierta cantidad." },
  habito: { emoji: "🌱", nombre: "Hábito", ayuda: "El niño marca cada día que lo cumple. Ej. cuidar el agua, apagar luces." },
};

// Calcula el estado de un reto según su fecha de inicio, fecha de fin y si está activo.
const calcularEstado = (reto) => {
  const hoy = hoyMX();
  if (!reto.activo) return { label: "Inactivo", color: "bg-gray-300 text-gray-700" };
  if (hoy < reto.fecha_inicio) return { label: "Próximo", color: "bg-yellow-100 text-yellow-700" };
  if (hoy > reto.fecha_fin) return { label: "Vencido", color: "bg-gray-200 text-gray-600" };
  return { label: "Vigente", color: "bg-green-100 text-green-700" };
};

const resumenMeta = (reto) =>
  reto.tipo === "habito"
    ? `${reto.meta_dias} días`
    : `Meta $${reto.meta_monto}`;

// Componente de administración para mostrar, crear, editar y eliminar retos.
const AdminRetos = () => {
  const [retos, setRetos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Imagen opcional: archivo nuevo elegido (aún sin subir) y su vista previa local.
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewLocal, setPreviewLocal] = useState("");

  // Cambia (o limpia) el archivo elegido y su vista previa local.
  const fijarArchivo = (archivo) => {
    if (previewLocal) URL.revokeObjectURL(previewLocal);
    setArchivoImagen(archivo);
    setPreviewLocal(archivo ? URL.createObjectURL(archivo) : "");
  };

  const cargarRetos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("retos")
      .select("*")
      .order("fecha_inicio", { ascending: false });
    if (!error) setRetos(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarRetos();
  }, []);

  const abrirNuevo = () => {
    setForm(VACIO);
    fijarArchivo(null);
    setEditandoId(null);
    setMostrarForm(true);
  };

  const abrirEditar = (reto) => {
    setForm({
      tipo: reto.tipo || "ahorro",
      titulo: reto.titulo,
      descripcion: reto.descripcion || "",
      meta_monto: reto.meta_monto ?? "",
      meta_dias: reto.meta_dias ?? "",
      pide_reflexion: !!reto.pide_reflexion,
      fecha_inicio: reto.fecha_inicio,
      fecha_fin: reto.fecha_fin,
      recompensa_monedas: reto.recompensa_monedas,
      imagen_url: reto.imagen_url || "",
    });
    fijarArchivo(null);
    setEditandoId(reto.id);
    setMostrarForm(true);
  };

  const elegirImagen = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      alert("El archivo debe ser una imagen.");
      return;
    }
    if (archivo.size > 15 * 1024 * 1024) {
      alert("La imagen es demasiado grande (máximo 15 MB).");
      return;
    }
    fijarArchivo(archivo);
  };

  const quitarImagen = () => {
    fijarArchivo(null);
    setForm((f) => ({ ...f, imagen_url: "" }));
  };

  // Comprime la imagen y la sube al bucket. Devuelve la URL pública.
  const subirImagen = async (archivo) => {
    const blob = await comprimirImagen(archivo);
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const ruta = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  };

  const guardar = async () => {
    const esAhorro = form.tipo === "ahorro";

    if (!form.titulo.trim() || !form.fecha_inicio || !form.fecha_fin) {
      alert("Completa título, fecha de inicio y fecha de fin.");
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    if (esAhorro && !(Number(form.meta_monto) > 0)) {
      alert("Indica la meta de ahorro en pesos.");
      return;
    }
    if (!esAhorro) {
      const dias = Number(form.meta_dias);
      const disponibles = diasEntre(form.fecha_inicio, form.fecha_fin);
      if (!Number.isInteger(dias) || dias < 1) {
        alert("Indica cuántos días debe cumplirlo el niño.");
        return;
      }
      if (dias > disponibles) {
        alert(`El reto dura ${disponibles} día(s); no se pueden pedir ${dias}.`);
        return;
      }
    }

    setGuardando(true);
    try {
      let imagen_url = form.imagen_url || null;
      if (archivoImagen) imagen_url = await subirImagen(archivoImagen);

      const payload = {
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion,
        meta_monto: esAhorro ? Number(form.meta_monto) : null,
        meta_dias: esAhorro ? null : Number(form.meta_dias),
        pide_reflexion: esAhorro ? false : form.pide_reflexion,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        recompensa_monedas: Number(form.recompensa_monedas) || 1,
        imagen_url,
      };

      if (editandoId) {
        const { error } = await supabase.from("retos").update(payload).eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("retos").insert(payload);
        if (error) throw error;
      }

      setMostrarForm(false);
      fijarArchivo(null);
      cargarRetos();
    } catch (err) {
      alert("No se pudo guardar el reto: " + (err.message || err));
    } finally {
      setGuardando(false);
    }
  };

  // Alterna el estado activo/inactivo de un reto.
  const alternarActivo = async (reto) => {
    await supabase.from("retos").update({ activo: !reto.activo }).eq("id", reto.id);
    cargarRetos();
  };

  const eliminar = async (reto) => {
    if (!confirm(`¿Eliminar el reto "${reto.titulo}"? Esto borra también el progreso de los usuarios.`)) return;
    const { error } = await supabase.from("retos").delete().eq("id", reto.id);
    if (error) return alert("Error al eliminar: " + error.message);
    cargarRetos();
  };

  const imagenMostrada = previewLocal || form.imagen_url;
  const esAhorro = form.tipo === "ahorro";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-alianza-azul flex items-center gap-2">
          <Coins className="text-alianza-amarillo" /> Retos
        </h1>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-alianza-azul hover:bg-alianza-azul/90 text-white px-4 py-2 rounded-full font-bold text-sm shadow"
        >
          <Plus size={16} /> Nuevo reto
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="font-black text-alianza-azul mb-4">
            {editandoId ? "Editar reto" : "Nuevo reto"}
          </h2>

          {/* Tipo de reto */}
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500">Tipo de reto</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {Object.entries(TIPOS).map(([clave, t]) => (
                <button
                  key={clave}
                  type="button"
                  disabled={!!editandoId}
                  onClick={() => setForm({ ...form, tipo: clave })}
                  className={`text-left rounded-xl border-2 px-4 py-3 transition disabled:cursor-not-allowed ${
                    form.tipo === clave
                      ? "border-alianza-azul bg-alianza-azul/5"
                      : "border-gray-200 hover:border-gray-300 disabled:hover:border-gray-200"
                  } ${editandoId && form.tipo !== clave ? "opacity-40" : ""}`}
                >
                  <span className="font-black text-alianza-azul">
                    {t.emoji} {t.nombre}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">{t.ayuda}</span>
                </button>
              ))}
            </div>
            {editandoId && (
              <p className="text-xs text-gray-400 mt-1">
                El tipo no se puede cambiar en un reto ya creado porque los niños ya tienen progreso.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Título</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder={esAhorro ? "Ahorra $50 esta semana" : "Cuida el agua al lavarte los dientes"}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Descripción</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                placeholder="Explica el reto y por qué es importante. Es lo que verá el niño."
              />
            </div>

            {/* Imagen opcional */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">
                Imagen <span className="font-normal">(opcional)</span>
              </label>
              {imagenMostrada ? (
                <div className="mt-1 flex items-center gap-3">
                  <img
                    src={imagenMostrada}
                    alt="Vista previa del reto"
                    className="w-32 h-20 object-cover rounded-xl border border-gray-200"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-alianza-azul cursor-pointer hover:underline">
                      Cambiar
                      <input type="file" accept="image/*" className="hidden" onChange={elegirImagen} />
                    </label>
                    <button
                      type="button"
                      onClick={quitarImagen}
                      className="flex items-center gap-1 text-sm font-bold text-red-500 hover:underline text-left"
                    >
                      <X size={14} /> Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mt-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:border-alianza-azul/40 text-gray-500 text-sm">
                  <ImagePlus size={20} />
                  Subir una imagen para que el reto se vea más llamativo
                  <input type="file" accept="image/*" className="hidden" onChange={elegirImagen} />
                </label>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Se ajusta automáticamente de tamaño. Sin imagen, el reto se muestra con un ícono.
              </p>
            </div>

            {esAhorro ? (
              <div>
                <label className="text-xs font-bold text-gray-500">Meta ($)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={form.meta_monto}
                  onChange={(e) => setForm({ ...form, meta_monto: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-gray-500">Días que debe cumplirlo</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={form.meta_dias}
                  onChange={(e) => setForm({ ...form, meta_dias: e.target.value })}
                  placeholder="Ej. 5"
                />
                {form.fecha_inicio && form.fecha_fin && (
                  <p className="text-xs text-gray-400 mt-1">
                    El reto dura {diasEntre(form.fecha_inicio, form.fecha_fin)} día(s) en total.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-500">Recompensa (monedas)</label>
              <input
                type="number"
                min="1"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.recompensa_monedas}
                onChange={(e) => setForm({ ...form, recompensa_monedas: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha inicio</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Fecha fin</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              />
            </div>

            {!esAhorro && (
              <label className="md:col-span-2 flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.pide_reflexion}
                  onChange={(e) => setForm({ ...form, pide_reflexion: e.target.checked })}
                />
                <span>
                  <span className="font-bold text-sm text-alianza-azul">Pedir una reflexión al terminar</span>
                  <span className="block text-xs text-gray-500">
                    Al completar el reto, se le pregunta al niño qué aprendió. Es opcional para él y no requiere revisión.
                  </span>
                </span>
              </label>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              disabled={guardando}
              className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold text-sm disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              disabled={guardando}
              className="bg-gray-100 text-gray-600 px-5 py-2 rounded-full font-bold text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="text-gray-400">Cargando retos...</p>
      ) : retos.length === 0 ? (
        <p className="text-gray-400">Aún no hay retos creados.</p>
      ) : (
        <div className="grid gap-3">
          {retos.map((reto) => {
            const estado = calcularEstado(reto);
            const tipo = TIPOS[reto.tipo] || TIPOS.ahorro;
            return (
              <div
                key={reto.id}
                className="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {reto.imagen_url ? (
                    <img
                      src={reto.imagen_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">
                      {tipo.emoji}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-alianza-azul">{reto.titulo}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${estado.color}`}>
                        {estado.label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-alianza-azul/10 text-alianza-azul">
                        {tipo.emoji} {tipo.nombre}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {resumenMeta(reto)} · {reto.fecha_inicio} → {reto.fecha_fin} · 🪙{" "}
                      {reto.recompensa_monedas}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => alternarActivo(reto)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
                  >
                    {reto.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => abrirEditar(reto)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Editar"
                  >
                    <Pencil size={16} className="text-alianza-azul" />
                  </button>
                  <button
                    onClick={() => eliminar(reto)}
                    className="p-2 rounded-full hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRetos;