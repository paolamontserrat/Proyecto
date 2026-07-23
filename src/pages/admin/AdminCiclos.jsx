import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

function AdminCiclos() {
  const [ciclos, setCiclos] = useState([]);
  const [beneficios, setBeneficios] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);

    const { data: ciclosData } = await supabase.rpc('usuarios_con_ciclos_completos');

    if (!ciclosData || ciclosData.length === 0) {
      setCiclos([]);
      setCargando(false);
      return;
    }

    const ids = [...new Set(ciclosData.map((c) => c.usuario_id))];
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nombre, numero_socio, correo_contacto')
      .in('id', ids);

    const mapaUsuarios = Object.fromEntries((usuariosData || []).map((u) => [String(u.id), u]));

    const { data: beneficiosData } = await supabase
      .from('beneficios_ciclo')
      .select('usuario_id, anio_inicio, entregado, tipo');

    const mapaBeneficios = {};
    (beneficiosData || []).forEach((b) => {
      mapaBeneficios[`${b.usuario_id}-${b.anio_inicio}`] = b;
    });

    setCiclos(ciclosData.map((c) => ({ ...c, usuario: mapaUsuarios[c.usuario_id] })));
    setBeneficios(mapaBeneficios);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarEntregado = async (usuarioId, anioInicio, tipo) => {
    await supabase.rpc('admin_marcar_beneficio_entregado', {
      p_usuario_id: usuarioId,
      p_anio_inicio: anioInicio,
      p_tipo: tipo,
    });
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-2">Seguimiento de ciclos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Usuarios que completaron 2 años consecutivos de ahorro constante y son elegibles para el estímulo educativo o el crédito especial.
      </p>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Ciclo</th>
              <th className="p-3">Sellos año 1 / año 2</th>
              <th className="p-3">Estímulo educativo</th>
              <th className="p-3">Crédito especial</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Cargando...</td></tr>
            )}
            {!cargando && ciclos.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nadie ha completado 2 ciclos todavía</td></tr>
            )}
            {ciclos.map((c, i) => {
              const beca = beneficios[`${c.usuario_id}-${c.anio_inicio}-beca`];
              const credito = beneficios[`${c.usuario_id}-${c.anio_inicio}`];
              const becaEntregada = credito?.tipo === 'beca' && credito?.entregado;
              const creditoEntregado = credito?.tipo === 'credito' && credito?.entregado;

              return (
                <tr key={i} className="border-t">
                  <td className="p-3">
                    <p className="font-semibold">{c.usuario?.nombre}</p>
                    <p className="text-gray-400 font-mono text-xs">{c.usuario?.numero_socio}</p>
                  </td>
                  <td className="p-3">{c.anio_inicio} - {c.anio_fin}</td>
                  <td className="p-3">{c.sellos_anio1} / {c.sellos_anio2}</td>
                  <td className="p-3">
                    {becaEntregada ? (
                      <span className="text-green-600 text-xs font-semibold">Entregado</span>
                    ) : (
                      <button
                        onClick={() => marcarEntregado(c.usuario_id, c.anio_inicio, 'beca')}
                        className="text-alianza-azul text-xs font-semibold"
                      >
                        Marcar entregado
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    {creditoEntregado ? (
                      <span className="text-green-600 text-xs font-semibold">Entregado</span>
                    ) : (
                      <button
                        onClick={() => marcarEntregado(c.usuario_id, c.anio_inicio, 'credito')}
                        className="text-alianza-azul text-xs font-semibold"
                      >
                        Marcar entregado
                      </button>
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

export default AdminCiclos;