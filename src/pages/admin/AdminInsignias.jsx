import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

function AdminInsignias() {
  const [insignias, setInsignias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // {} nueva | insignia editar | null
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from('insignias_config').select('*').order('umbral_estrellas');
    setInsignias(data || []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (form) => {
    setError('');
    const esNueva = !form.id;

    if (esNueva) {
      const { data } = await supabase.rpc('admin_crear_insignia', {
        p_clave: form.clave.trim(),
        p_nombre: form.nombre.trim(),
        p_emoji: form.emoji.trim(),
        p_descripcion: form.descripcion.trim(),
        p_umbral: Number(form.umbral_estrellas),
      });
      if (!data?.ok) {
        setError(data?.error === 'duplicado' ? 'Ya existe una insignia con esa clave' : 'No se pudo crear');
        return;
      }
    } else {
      await supabase.rpc('admin_actualizar_insignia', {
        p_id: form.id,
        p_nombre: form.nombre.trim(),
        p_emoji: form.emoji.trim(),
        p_descripcion: form.descripcion.trim(),
        p_umbral: Number(form.umbral_estrellas),
        p_activa: form.activa,
      });
    }

    setEditando(null);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta insignia? Los niños que ya la ganaron la conservan en su historial, pero deja de otorgarse a partir de ahora.')) return;
    await supabase.rpc('admin_eliminar_insignia', { p_id: id });
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-alianza-azul">Insignias</h1>
        <button
          onClick={() => setEditando({ clave: '', nombre: '', emoji: '🏅', descripcion: '', umbral_estrellas: '', activa: true })}
          className="bg-alianza-azul text-white px-4 py-2 rounded-lg font-semibold text-sm"
        >
          + Agregar insignia
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Se otorgan automáticamente cuando un niño alcanza el número de estrellas configurado.
      </p>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Insignia</th>
              <th className="p-3">Umbral</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Cargando...</td></tr>}
            {!cargando && insignias.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-400">Sin insignias configuradas</td></tr>
            )}
            {insignias.map((ins) => (
              <tr key={ins.id} className="border-t">
                <td className="p-3">
                  <span className="text-xl mr-2">{ins.emoji}</span>
                  <span className="font-semibold">{ins.nombre}</span>
                  <p className="text-xs text-gray-400">{ins.descripcion}</p>
                </td>
                <td className="p-3">{ins.umbral_estrellas} ⭐</td>
                <td className="p-3">
                  {ins.activa ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Activa</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-semibold">Inactiva</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button onClick={() => setEditando(ins)} className="text-alianza-azul text-xs font-semibold">Editar</button>
                    <button onClick={() => eliminar(ins.id)} className="text-red-600 text-xs font-semibold">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-alianza-azul mb-4">
              {editando.id ? 'Editar insignia' : 'Nueva insignia'}
            </h3>

            <div className="space-y-3">
              {!editando.id && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Clave interna (sin espacios)</label>
                  <input
                    type="text"
                    value={editando.clave}
                    onChange={(e) => setEditando({ ...editando, clave: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre visible</label>
                <input
                  type="text"
                  value={editando.nombre}
                  onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Emoji</label>
                <input
                  type="text"
                  value={editando.emoji}
                  onChange={(e) => setEditando({ ...editando, emoji: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editando.descripcion}
                  onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estrellas necesarias</label>
                <input
                  type="number"
                  value={editando.umbral_estrellas}
                  onChange={(e) => setEditando({ ...editando, umbral_estrellas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {editando.id && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editando.activa}
                    onChange={(e) => setEditando({ ...editando, activa: e.target.checked })}
                  />
                  Activa
                </label>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEditando(null); setError(''); }} className="flex-1 bg-gray-100 py-2 rounded-lg font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={() => guardar(editando)} className="flex-1 bg-alianza-azul text-white py-2 rounded-lg font-semibold text-sm">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInsignias;