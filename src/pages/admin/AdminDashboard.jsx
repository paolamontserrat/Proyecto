import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { RANGOS } from '../../constants/rangos';

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

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
  const anioActualReal = new Date().getFullYear();
  const AÑOS_DISPONIBLES = [anioActualReal - 2, anioActualReal - 1, anioActualReal, anioActualReal + 1];

  const [cargando, setCargando] = useState(true);
  const [filtroRango, setFiltroRango] = useState("todos");
  const [filtroAnio, setFiltroAnio] = useState(anioActualReal);

  const [kpis, setKpis] = useState({
    totalUsuarios: 0, activados: 0, pendientes: 0, bloqueados: 0,
    pendientesAntiguos: 0, ahorroTotal: 0, sellosAnio: 0, sellosEsteMes: 0,
    diplomasAnio: 0, diplomasPendientes: 0, elegiblesCiclo: 0,
  });

  const [reglas, setReglas] = useState({ monto: "—", sellos: "—" });
  const [datosPorRango, setDatosPorRango] = useState([]);
  const [datosPorMes, setDatosPorMes] = useState([]);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);

  const cargarDashboard = useCallback(async () => {
    setCargando(true);

    const nombreMesActual = MESES[new Date().getMonth()];
    const inicioAnio = `${filtroAnio}-01-01`;
    const finAnio = `${filtroAnio}-12-31T23:59:59`;

    const { data: statsUsuarios } = await supabase.rpc('admin_dashboard_usuarios', {
      p_rango: filtroRango !== 'todos' ? filtroRango : null,
    });

    let idsRango = null;
    if (filtroRango !== 'todos') {
      const { data: idsData } = await supabase.rpc('admin_ids_usuarios_por_rango', {
        p_rango: filtroRango,
      });
      idsRango = (idsData || []).map((r) => String(r.id));
    }
    const sinResultadosPorRango = idsRango !== null && idsRango.length === 0;

    let qAhorros = supabase.from("ahorros_usuario").select("datos, rango");
    if (filtroRango !== "todos") qAhorros = qAhorros.eq("rango", filtroRango);

    const [ahorrosRes, configRes, ciclosRes] = await Promise.all([
      qAhorros,
      supabase.from("configuracion").select("clave, valor"),
      supabase.rpc("usuarios_con_ciclos_completos"),
    ]);

    let sellosAnio = 0, sellosEsteMes = 0, diplomasAnio = 0, diplomasPendientes = 0;

    if (!sinResultadosPorRango) {
      let qSellosAnio = supabase.from("sellos_digitales").select("id", { count: "exact", head: true }).eq("anio", filtroAnio);
      let qSellosMes = supabase.from("sellos_digitales").select("id", { count: "exact", head: true }).eq("mes", nombreMesActual).eq("anio", anioActualReal);
      let qDiplomasAnio = supabase.from("diplomas").select("id", { count: "exact", head: true }).gte("fecha_generado", inicioAnio).lte("fecha_generado", finAnio);
      let qDiplomasPend = supabase.from("diplomas").select("id", { count: "exact", head: true }).eq("entregado", false);

      if (idsRango) {
        qSellosAnio = qSellosAnio.in("usuario_id", idsRango);
        qSellosMes = qSellosMes.in("usuario_id", idsRango);
        qDiplomasAnio = qDiplomasAnio.in("usuario_id", idsRango);
        qDiplomasPend = qDiplomasPend.in("usuario_id", idsRango);
      }

      const [rSellosAnio, rSellosMes, rDiplomasAnio, rDiplomasPend] = await Promise.all([
        qSellosAnio, qSellosMes, qDiplomasAnio, qDiplomasPend,
      ]);

      sellosAnio = rSellosAnio.count || 0;
      sellosEsteMes = rSellosMes.count || 0;
      diplomasAnio = rDiplomasAnio.count || 0;
      diplomasPendientes = rDiplomasPend.count || 0;
    }

    let elegiblesCiclo = ciclosRes.data || [];
    if (idsRango) {
      elegiblesCiclo = elegiblesCiclo.filter((c) => idsRango.includes(c.usuario_id));
    }

    const conteoRango = Object.fromEntries(RANGOS.map((r) => [r, 0]));
    (statsUsuarios?.por_rango || []).forEach((item) => {
      if (item.nivel && conteoRango[item.nivel] !== undefined) conteoRango[item.nivel] = item.total;
    });
    setDatosPorRango(RANGOS.map((r) => ({ rango: r, usuarios: conteoRango[r] })));

    let ahorroTotal = 0;
    const conteoMes = Object.fromEntries(MESES.map((m) => [m, 0]));
    (ahorrosRes.data || []).forEach((fila) => {
      const datos = fila.datos || {};
      Object.entries(datos).forEach(([mes, lista]) => {
        const sumaMes = (lista || []).reduce((s, a) => s + Number(a.monto || 0), 0);
        ahorroTotal += sumaMes;
        if (conteoMes[mes] !== undefined) conteoMes[mes] += sumaMes;
      });
    });
    setDatosPorMes(MESES.map((m) => ({ mes: m.slice(0, 3), ahorro: conteoMes[m] })));

    const mapaConfig = Object.fromEntries((configRes.data || []).map((c) => [c.clave, c.valor]));
    setReglas({
      monto: mapaConfig["monto_minimo_sello"] || "—",
      sellos: mapaConfig["sellos_por_diploma"] || "—",
    });

    setKpis({
      totalUsuarios: statsUsuarios?.total || 0,
      activados: statsUsuarios?.activados || 0,
      pendientes: statsUsuarios?.pendientes || 0,
      bloqueados: statsUsuarios?.bloqueados || 0,
      pendientesAntiguos: statsUsuarios?.pendientes_antiguos || 0,
      ahorroTotal, sellosAnio, sellosEsteMes, diplomasAnio, diplomasPendientes,
      elegiblesCiclo: elegiblesCiclo.length,
    });

    setUltimosRegistros(statsUsuarios?.ultimos || []);
    setCargando(false);
  }, [filtroRango, filtroAnio, anioActualReal]);

  useEffect(() => { cargarDashboard(); }, [cargarDashboard]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-alianza-azul">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Regla actual: ${reglas.monto} al mes = 1 sello · {reglas.sellos} sellos = 1 diploma
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <select value={filtroRango} onChange={(e) => setFiltroRango(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="todos">Todos los rangos</option>
            {RANGOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={filtroAnio} onChange={(e) => setFiltroAnio(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm bg-white">
            {AÑOS_DISPONIBLES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <button onClick={cargarDashboard} disabled={cargando} className="px-3 py-2 border rounded-lg text-sm bg-white text-alianza-azul font-semibold disabled:opacity-50">
            {cargando ? "..." : "↻ Actualizar"}
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-gray-400 text-center py-10">Cargando dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <TarjetaKPI titulo="Usuarios totales" valor={kpis.totalUsuarios} />
            <TarjetaKPI titulo="Activados / Pendientes" valor={`${kpis.activados} / ${kpis.pendientes}`} color="text-green-600" />
            <TarjetaKPI titulo="Ahorro total acumulado" valor={`$${kpis.ahorroTotal.toLocaleString()}`} subtitulo="histórico, todos los años" color="text-alianza-amarillo" />
            <TarjetaKPI titulo="Sellos este mes" valor={kpis.sellosEsteMes} subtitulo={`${kpis.sellosAnio} en ${filtroAnio}`} />
            <TarjetaKPI titulo={`Diplomas en ${filtroAnio}`} valor={kpis.diplomasAnio} color="text-purple-600" />
            <TarjetaKPI titulo="Diplomas sin entregar" valor={kpis.diplomasPendientes} color="text-purple-600" subtitulo="pendientes en sucursal" />
            <TarjetaKPI titulo="Elegibles por 2 ciclos" valor={kpis.elegiblesCiclo} color="text-indigo-600" subtitulo="beca o crédito especial" />
            <TarjetaKPI titulo="Cuentas bloqueadas" valor={kpis.bloqueados} color="text-red-600" />
            <TarjetaKPI titulo="Pendientes hace +7 días" valor={kpis.pendientesAntiguos} color="text-amber-600" subtitulo="podrían necesitar seguimiento" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow p-4">
              <p className="font-semibold text-alianza-azul mb-3">Usuarios por edad</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datosPorRango}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="rango" fontSize={11} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="usuarios" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <p className="font-semibold text-alianza-azul mb-1">
                Ahorro por mes {filtroRango !== "todos" && `— rango ${filtroRango}`}
              </p>
              <p className="text-xs text-gray-400 mb-2">Suma histórica por nombre de mes (no distingue año)</p>
              <ResponsiveContainer width="100%" height={220}>
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

          <div className="bg-white rounded-2xl shadow p-4">
            <p className="font-semibold text-alianza-azul mb-3">
              Últimos registros {filtroRango !== "todos" && `— rango ${filtroRango}`}
            </p>
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
                      {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {ultimosRegistros.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-gray-400">Sin registros aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;