import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

function AdminConfiguracion() {
  const [items, setItems] = useState([]);
  const [editando, setEditando] = useState(null);
  const [valorEdit, setValorEdit] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from('configuracion').select('*').order('clave');
    setItems(data || []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const iniciarEdicion = (item) => {
    setEditando(item.clave);
    setValorEdit(item.valor);
  };

  const guardar = async (clave) => {
    await supabase.rpc('admin_actualizar_configuracion', { p_clave: clave, p_valor: valorEdit });
    setEditando(null);
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-2">Ajustes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Reglas del sistema de ahorro. Cambiar un valor aquí afecta a todos los usuarios de inmediato.
      </p>

      <div className="bg-white rounded-2xl shadow divide-y">
        {cargando && <p className="p-4 text-center text-gray-400">Cargando...</p>}
        {!cargando && items.map((item) => (
          <div key={item.clave} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">{item.clave}</p>
              <p className="text-xs text-gray-500">{item.descripcion}</p>
            </div>
            {editando === item.clave ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={valorEdit}
                  onChange={(e) => setValorEdit(e.target.value)}
                  className="w-24 px-3 py-1 border rounded-lg text-sm"
                />
                <button onClick={() => guardar(item.clave)} className="text-green-600 text-xs font-semibold">Guardar</button>
                <button onClick={() => setEditando(null)} className="text-gray-400 text-xs font-semibold">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => iniciarEdicion(item)} className="flex items-center gap-2">
                <span className="font-mono text-alianza-azul font-bold">{item.valor}</span>
                <span className="text-xs text-gray-400">editar</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminConfiguracion;