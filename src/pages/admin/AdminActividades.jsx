import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { RANGOS } from '../../constants/rangos';

// Componente de administración para mostrar el progreso de actividades de los usuarios según su rango de edad.
const enmascarar = (numero) => {
  if (!numero) return "";
  return `${numero.slice(0, 2)}${"•".repeat(Math.max(0, numero.length - 4))}${numero.slice(-2)}`;
};
function AdminActividades() {
  const [rango, setRango] = useState(RANGOS[0]);
  const [totalActividades, setTotalActividades] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Función para cargar los datos de progreso de actividades de los usuarios según el rango seleccionado.
  const cargar = useCallback(async () => {
    setCargando(true);

    let total = null;

    try {
      const res = await fetch(`/data/${rango}.json`);
      const json = await res.json();

      total = Array.isArray(json.pasos)
        ? json.pasos.length
        : null;
    } catch {
      total = null;
    }

    setTotalActividades(total);

    // Consulta a Supabase para obtener los usuarios del rango seleccionado y su progreso en actividades completadas.
    const { data: usuariosData } = await supabase.rpc('admin_usuarios_por_rango', {
      p_rango: rango,
    });

    if (!usuariosData || usuariosData.length === 0) {
      setUsuarios([]);
      setCargando(false);
      return;
    }

    const ids = usuariosData.map((u) => u.id);

    // Consulta a Supabase para obtener el conteo de actividades completadas por cada usuario en el rango seleccionado.
    const { data: progresoData } = await supabase
      .from('progreso_actividades')
      .select('usuario_id, completada')
      .in('usuario_id', ids)
      .eq('completada', true);

    const conteo = {};

    (progresoData || []).forEach((p) => {
      conteo[p.usuario_id] = (conteo[p.usuario_id] || 0) + 1;
    });

    // Combina los datos de usuarios con el conteo de actividades completadas y ordena por número de actividades completadas.
    setUsuarios(
      usuariosData
        .map((u) => ({
          ...u,
          completadas: conteo[u.id] || 0,
        }))
        .sort((a, b) => b.completadas - a.completadas)
    );

    setCargando(false);
  }, [rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Calcula el promedio de avance de actividades completadas por los usuarios en el rango seleccionado.
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
      <h1 className="text-2xl font-bold text-alianza-azul mb-2">
        Avance de actividades
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Progreso de los niños en las actividades educativas según su edad.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        // Botones para seleccionar el rango de edad y actualizar la vista de progreso.
        {RANGOS.map((r) => (
          <button
            key={r}
            onClick={() => setRango(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              rango === r
                ? 'bg-alianza-azul text-white'
                : 'bg-white text-alianza-azul border'
            }`}
          >
            {r === '0-5' ? '0-5 años' : `${r} años`}
          </button>
        ))}
      </div>

      // Muestra un mensaje de error si no se pudo determinar el total de actividades desde el archivo JSON correspondiente al rango seleccionado.
      {totalActividades === null && !cargando && (
        <div className="bg-amber-50 border border-amber-300 text-amber-700 text-sm rounded-xl p-3 mb-4">
          No pude determinar el total de actividades de la edad {rango} desde{' '}
          <code>/data/{rango}.json</code>.
          <br />
          Revisa que el archivo tenga un arreglo llamado{' '}
          <code>pasos</code>, o dime cómo está estructurado para
          ajustar esto.
        </div>
      )}

      {promedio !== null && (
        <div className="bg-white rounded-2xl shadow p-4 mb-4 inline-block">
          <p className="text-xs text-gray-500">
            Avance promedio de {rango === '0-5' ? '0-5 años' : `${rango} años`}
          </p>

          <p className="text-3xl font-black text-alianza-azul">
            {promedio}%
          </p>
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
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-gray-400"
                >
                  Cargando...
                </td>
              </tr>
            )}

            {!cargando && usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-gray-400"
                >
                  Sin usuarios en esta edad
                </td>
              </tr>
            )}

            // Muestra la lista de usuarios con su progreso en actividades completadas y un indicador visual del porcentaje de avance.
            {usuarios.map((u) => {
              const pct = totalActividades
                ? Math.min(
                    100,
                    Math.round(
                      (u.completadas / totalActividades) * 100
                    )
                  )
                : null;

              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    <p className="font-semibold">{u.nombre}</p>

                    <p className="text-gray-400 font-mono text-xs">
                      {enmascarar(u.numero_socio)}
                    </p>
                  </td>

                  <td className="p-3">
                    {u.completadas}
                    {totalActividades
                      ? ` / ${totalActividades}`
                      : ''}
                  </td>

                  <td className="p-3">
                    {pct !== null ? (
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-alianza-azul"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      '—'
                    )}
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