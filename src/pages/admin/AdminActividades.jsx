import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { RANGOS } from '../../constants/rangos';

function AdminActividades() {
  const [rango, setRango] = useState(RANGOS[0]);
  const [totalActividades, setTotalActividades] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);

    let total = null;
    try {
      const res = await fetch(`/data/${rango}.json`);
      const json = await res.json();
      total = Array.isArray(json.actividades) ? json.actividades.length : null;
    } catch {
      total = null;
    }
    setTotalActividades(total);

    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nombre, numero_socio')
      .eq('nivel', rango)
      .neq('rol', 'admin');

    if (!usuariosData || usuariosData.length === 0) {
      setUsuarios([]);
      setCargando(false);
      return;
    }

    const ids = usuariosData.map((u) => u.id);
    const { data: progresoData } = await supabase
      .from('progreso_actividades')
      .select('usuario_id, completada')
      .in('usuario_id', ids)
      .eq('completada', true);

    const conteo = {};
    (progresoData || []).forEach((p) => {
      conteo[p.usuario_id] = (conteo[p.usuario_id] || 0) + 1;
    });

    setUsuarios(
      usuariosData
        .map((u) => ({ ...u, completadas: conteo[u.id] || 0 }))
        .sort((a, b) => b.completadas - a.completadas)
    );
    setCargando(false);
  }, [rango]);

  useEffect(() => { cargar(); }, [cargar]);

  const promedio =
    usuarios.length > 0 && totalActividades
      ? Math.round(
          (usuarios.reduce((s, u) => s + u.completadas, 0) /
            (usuarios.length * totalActividades)) *
            100
        )
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-2">Avance de actividades</h1>
      <p className="text-sm text-gray-500 mb-6">
        Progreso de los niños en las actividades educativas de cada rango de edad.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {RANGOS.map((r) => (
          <button
            key={r}
            onClick={() => setRango(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              rango === r ? 'bg-alianza-azul text-white' : 'bg-white text-alianza-azul border'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {totalActividades === null && !cargando && (
        <div className="bg-amber-50 border border-amber-300 text-amber-700 text-sm rounded-xl p-3 mb-4">
          No pude determinar el total de actividades del rango {rango} desde <code>/data/{rango}.json</code>.
          Revisa que el archivo tenga un arreglo llamado <code>actividades</code>, o dime cómo está
          estructurado para ajustar esto.
        </div>
      )}

      {promedio !== null && (
        <div className="bg-white rounded-2xl shadow p-4 mb-4 inline-block">
          <p className="text-xs text-gray-500">Avance promedio del rango {rango}</p>
          <p className="text-3xl font-black text-alianza-azul">{promedio}%</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Actividades completadas</th>
              <th className="p-3 w-1/3">Avance</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={3} className="p-4 text-center text-gray-400">Cargando...</td></tr>
            )}
            {!cargando && usuarios.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center text-gray-400">Sin usuarios en este rango</td></tr>
            )}
            {usuarios.map((u) => {
              const pct = totalActividades
                ? Math.min(100, Math.round((u.completadas / totalActividades) * 100))
                : null;
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    <p className="font-semibold">{u.nombre}</p>
                    <p className="text-gray-400 font-mono text-xs">{u.numero_socio}</p>
                  </td>
                  <td className="p-3">
                    {u.completadas}{totalActividades ? ` / ${totalActividades}` : ''}
                  </td>
                  <td className="p-3">
                    {pct !== null ? (
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-alianza-azul" style={{ width: `${pct}%` }} />
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminActividades;