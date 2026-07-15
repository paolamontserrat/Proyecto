import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const RANGOS = ["0-5","6-8","9-12","13-15","16-17"];

function TarjetaKPI({ titulo, valor, subtitulo, color = "text-alianza-azul" }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className={`text-2xl font-black ${color}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
    </div>
  );
}

function AdminDashboard() {
  const [cargando, setCargando] = useState(true);

  const [kpis, setKpis] = useState({
    totalUsuarios: 0,
    activados: 0,
    pendientes: 0,
    bloqueados: 0,
    pendientesAntiguos: 0,
    ahorroTotal: 0,
    sellosEsteMes: 0,
    diplomasTotales: 0,
  });

  const [datosPorRango, setDatosPorRango] = useState([]);
  const [datosPorMes, setDatosPorMes] = useState([]);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);

  useEffect(() => {
    const cargarDashboard = async () => {
      setCargando(true);

      const nombreMesActual = MESES[new Date().getMonth()];
      const anioActual = new Date().getFullYear();
      const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        totalUsuariosRes,
        activadosRes,
        pendientesRes,
        bloqueadosRes,
        pendientesAntiguosRes,
        nivelesRes,
        ahorrosRes,
        sellosEsteMesRes,
        sellosTotalesRes,
        diplomasRes,
        ultimosRes,
      ] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).neq('rol', 'admin'),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).neq('rol', 'admin').eq('activado', true),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).neq('rol', 'admin').eq('activado', false),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('bloqueado', true),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }).neq('rol', 'admin').eq('activado', false).lt('fecha_registro', hace7dias),
        supabase.from('usuarios').select('nivel').neq('rol', 'admin'),
        supabase.from('ahorros_usuario').select('datos'),
        supabase.from('sellos_digitales').select('id', { count: 'exact', head: true }).eq('mes', nombreMesActual).eq('anio', anioActual),
        supabase.from('sellos_digitales').select('id', { count: 'exact', head: true }),
        supabase.from('reto_progreso').select('usuario_id', { count: 'exact', head: true }).eq('diploma_generado', true),
        supabase.from('usuarios').select('nombre, numero_socio, nivel, fecha_registro').neq('rol', 'admin').order('fecha_registro', { ascending: false }).limit(5),
      ]);

      // --- usuarios por rango ---
      const conteoRango = Object.fromEntries(RANGOS.map(r => [r, 0]));
      (nivelesRes.data || []).forEach(u => {
        if (u.nivel && conteoRango[u.nivel] !== undefined) conteoRango[u.nivel]++;
      });
      setDatosPorRango(RANGOS.map(r => ({ rango: r, usuarios: conteoRango[r] })));

      // --- ahorro total y por mes (suma de todos los usuarios, agrupado por nombre de mes) ---
      let ahorroTotal = 0;
      const conteoMes = Object.fromEntries(MESES.map(m => [m, 0]));

      (ahorrosRes.data || []).forEach(fila => {
        const datos = fila.datos || {};
        Object.entries(datos).forEach(([mes, lista]) => {
          const sumaMes = (lista || []).reduce((s, a) => s + Number(a.monto || 0), 0);
          ahorroTotal += sumaMes;
          if (conteoMes[mes] !== undefined) conteoMes[mes] += sumaMes;
        });
      });

      setDatosPorMes(MESES.map(m => ({ mes: m.slice(0, 3), ahorro: conteoMes[m] })));

      setKpis({
        totalUsuarios: totalUsuariosRes.count || 0,
        activados: activadosRes.count || 0,
        pendientes: pendientesRes.count || 0,
        bloqueados: bloqueadosRes.count || 0,
        pendientesAntiguos: pendientesAntiguosRes.count || 0,
        ahorroTotal,
        sellosEsteMes: sellosEsteMesRes.count || 0,
        sellosTotales: sellosTotalesRes.count || 0,
        diplomasTotales: diplomasRes.count || 0,
      });

      setUltimosRegistros(ultimosRes.data || []);
      setCargando(false);
    };

    cargarDashboard();
  }, []);

  if (cargando) {
    return <div className="text-gray-400 text-center py-10">Cargando dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <TarjetaKPI titulo="Usuarios totales" valor={kpis.totalUsuarios} />
        <TarjetaKPI
          titulo="Activados / Pendientes"
          valor={`${kpis.activados} / ${kpis.pendientes}`}
          color="text-green-600"
        />
        <TarjetaKPI
          titulo="Ahorro total acumulado"
          valor={`$${kpis.ahorroTotal.toLocaleString()}`}
          color="text-alianza-amarillo"
        />
        <TarjetaKPI
          titulo="Sellos este mes"
          valor={kpis.sellosEsteMes}
          subtitulo={`${kpis.sellosTotales} sellos en total`}
        />
        <TarjetaKPI
          titulo="Diplomas entregados"
          valor={kpis.diplomasTotales}
          color="text-purple-600"
        />
        <TarjetaKPI
          titulo="Cuentas bloqueadas"
          valor={kpis.bloqueados}
          color="text-red-600"
        />
        <TarjetaKPI
          titulo="Pendientes hace +7 días"
          valor={kpis.pendientesAntiguos}
          color="text-amber-600"
          subtitulo="podrían necesitar seguimiento"
        />
      </div>

      {/* GRÁFICAS */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="font-semibold text-alianza-azul mb-3">Usuarios por rango de edad</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datosPorRango}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rango" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="usuarios" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="font-semibold text-alianza-azul mb-3">Ahorro total por mes</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={datosPorMes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `$${v}`} />
              <Line type="monotone" dataKey="ahorro" stroke="#FACC15" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ÚLTIMOS REGISTROS */}
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="font-semibold text-alianza-azul mb-3">Últimos registros</p>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="pb-2">Número de socio</th>
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Rango</th>
              <th className="pb-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ultimosRegistros.map((u, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 font-mono">{u.numero_socio}</td>
                <td className="py-2">{u.nombre}</td>
                <td className="py-2">{u.nivel}</td>
                <td className="py-2 text-gray-500">
                  {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
            {ultimosRegistros.length === 0 && (
              <tr><td colSpan={4} className="py-3 text-center text-gray-400">Sin registros aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;