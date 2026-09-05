import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Coins } from "lucide-react";
import { supabase } from "../../supabaseClient"; // ajusta la ruta según tu proyecto

const VACIO = {
  titulo: "",
  descripcion: "",
  meta_monto: "",
  fecha_inicio: "",
  fecha_fin: "",
  recompensa_monedas: 1,
};

const calcularEstado = (reto) => {
  const hoy = new Date().toISOString().slice(0, 10);
  if (!reto.activo) return { label: "Inactivo", color: "bg-gray-300 text-gray-700" };
  if (hoy < reto.fecha_inicio) return { label: "Próximo", color: "bg-yellow-100 text-yellow-700" };
  if (hoy > reto.fecha_fin) return { label: "Vencido", color: "bg-gray-200 text-gray-600" };
  return { label: "Vigente", color: "bg-green-100 text-green-700" };
};

const AdminRetos = () => {
  const [retos, setRetos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

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
    setEditandoId(null);
    setMostrarForm(true);
  };

  const abrirEditar = (reto) => {
    setForm({
      titulo: reto.titulo,
      descripcion: reto.descripcion || "",
      meta_monto: reto.meta_monto,
      fecha_inicio: reto.fecha_inicio,
      fecha_fin: reto.fecha_fin,
      recompensa_monedas: reto.recompensa_monedas,
    });
    setEditandoId(reto.id);
    setMostrarForm(true);
  };

  const guardar = async () => {
    if (!form.titulo || !form.meta_monto || !form.fecha_inicio || !form.fecha_fin) {
      alert("Completa título, meta, fecha de inicio y fecha de fin.");
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      meta_monto: Number(form.meta_monto),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      recompensa_monedas: Number(form.recompensa_monedas) || 1,
    };

    if (editandoId) {
      const { error } = await supabase.from("retos").update(payload).eq("id", editandoId);
      if (error) return alert("Error al actualizar: " + error.message);
    } else {
      const { error } = await supabase.from("retos").insert(payload);
      if (error) return alert("Error al crear: " + error.message);
    }

    setMostrarForm(false);
    cargarRetos();
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-alianza-azul flex items-center gap-2">
          <Coins className="text-alianza-amarillo" /> Retos de ahorro
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Título</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ahorra $50 esta semana"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Descripción</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Meta ($)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.meta_monto}
                onChange={(e) => setForm({ ...form, meta_monto: e.target.value })}
              />
            </div>
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
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold text-sm"
            >
              Guardar
            </button>
            <button
              onClick={() => setMostrarForm(false)}
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
            return (
              <div
                key={reto.id}
                className="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-alianza-azul">{reto.titulo}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${estado.color}`}>
                      {estado.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Meta ${reto.meta_monto} · {reto.fecha_inicio} → {reto.fecha_fin} · 🪙{" "}
                    {reto.recompensa_monedas}
                  </p>
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
                  >
                    <Pencil size={16} className="text-alianza-azul" />
                  </button>
                  <button
                    onClick={() => eliminar(reto)}
                    className="p-2 rounded-full hover:bg-red-50"
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