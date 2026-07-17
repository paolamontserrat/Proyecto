import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import ModalRegistrarDeposito from "../../components/admin/ModalRegistrarDeposito";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function AdminAhorros() {
  const [tab, setTab] = useState("buscar"); // 'buscar' | 'sellos' | 'retos'

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-6">
        Ahorros y sellos
      </h1>

      <div className="flex gap-2 mb-6">
        {[
          { id: "buscar", label: "Historial de usuario" },
          { id: "sellos", label: "Sellos otorgados" },
          { id: "retos", label: "Retos y diplomas" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === t.id
                ? "bg-alianza-azul text-white"
                : "bg-white text-alianza-azul border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "buscar" && <TabHistorial />}
      {tab === "sellos" && <TabSellos />}
      {tab === "retos" && <TabRetos />}
    </div>
  );
}

// =====================================================
// TAB 1: Buscar usuario, ver historial, registrar/borrar depósitos
// =====================================================
function TabHistorial() {
  const [usuarios, setUsuarios] = useState([]);
  const [conteoSellos, setConteoSellos] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [ahorros, setAhorros] = useState({});
  const [sellosUsuario, setSellosUsuario] = useState([]);
  const [modalDeposito, setModalDeposito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mesExpandido, setMesExpandido] = useState(null);
  const [avisoEliminar, setAvisoEliminar] = useState(null);

  const anioActual = new Date().getFullYear();

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    let query = supabase
      .from("usuarios")
      .select("id, numero_socio, nombre, nivel")
      .neq("rol", "admin")
      .order("nombre");

    if (busqueda.trim()) {
      query = query.or(
        `numero_socio.ilike.%${busqueda.trim()}%,nombre.ilike.%${busqueda.trim()}%`,
      );
    }

    const { data } = await query.limit(100);
    setUsuarios(data || []);

    if (data && data.length > 0) {
      const ids = data.map((u) => String(u.id));
      const { data: sellosData } = await supabase
        .from("sellos_digitales")
        .select("usuario_id")
        .in("usuario_id", ids)
        .eq("anio", anioActual);

      const conteo = {};
      (sellosData || []).forEach((s) => {
        conteo[s.usuario_id] = (conteo[s.usuario_id] || 0) + 1;
      });
      setConteoSellos(conteo);
    } else {
      setConteoSellos({});
    }

    setCargando(false);
  }, [busqueda, anioActual]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const cargarDetalle = useCallback(
    async (usuario) => {
      setSeleccionado(usuario);
      setMesExpandido(null);
      setAvisoEliminar(null);

      const { data: ahorroData } = await supabase
        .from("ahorros_usuario")
        .select("datos")
        .eq("usuario_id", usuario.id)
        .eq("rango", usuario.nivel)
        .maybeSingle();

      setAhorros(ahorroData?.datos || {});

      const { data: sellosData } = await supabase
        .from("sellos_digitales")
        .select("mes, anio")
        .eq("usuario_id", String(usuario.id))
        .eq("anio", anioActual);

      setSellosUsuario(sellosData || []);
    },
    [anioActual],
  );

  const tieneSello = (mes) => sellosUsuario.some((s) => s.mes === mes);

  const eliminarDeposito = async (depositoId) => {
    if (!seleccionado) return;

    const { data, error: rpcError } = await supabase.rpc(
      "admin_eliminar_deposito",
      {
        p_usuario_id: String(seleccionado.id),
        p_rango: seleccionado.nivel,
        p_deposito_id: String(depositoId),
      },
    );

    if (rpcError || !data?.ok) {
      setAvisoEliminar({
        tipo: "error",
        mensaje: `No se pudo eliminar: ${data?.error || rpcError?.message || "error desconocido"}`,
      });
      return;
    }

    if (data.advertencia) {
      setAvisoEliminar({ tipo: "advertencia", mensaje: data.advertencia });
    } else if (data.diploma_revocado) {
      setAvisoEliminar({
        tipo: "info",
        mensaje:
          "Se eliminó el depósito, el sello y el diploma correspondiente, ya que dejó de cumplir los 3 sellos.",
      });
    } else if (data.sello_eliminado) {
      setAvisoEliminar({
        tipo: "info",
        mensaje:
          "Se eliminó el depósito y su sello, porque el mes ya no llega a $100.",
      });
    } else {
      setAvisoEliminar(null);
    }

    cargarDetalle(seleccionado);
    cargarUsuarios();
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <input
          type="text"
          placeholder="Filtrar por número de socio o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
        />

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3 text-center">🏅</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!cargando && usuarios.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-400">
                    Sin resultados
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => cargarDetalle(u)}
                  className={`border-t cursor-pointer hover:bg-gray-50 ${
                    seleccionado?.id === u.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="p-3">
                    <p className="font-semibold">{u.nombre}</p>
                    <p className="text-gray-500 font-mono text-xs">
                      {u.numero_socio} · {u.nivel}
                    </p>
                  </td>
                  <td className="p-3 text-center font-semibold">
                    {conteoSellos[String(u.id)] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:col-span-2">
        {!seleccionado && (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            Selecciona un usuario de la tabla
          </div>
        )}

        {seleccionado && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <p className="font-bold text-alianza-azul">
                  {seleccionado.nombre}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {seleccionado.numero_socio} · Rango {seleccionado.nivel}
                </p>
              </div>
              <button
                onClick={() => setModalDeposito(true)}
                className="bg-alianza-azul text-white px-3 py-2 rounded-lg text-xs font-semibold"
              >
                + Registrar depósito
              </button>
            </div>

            {avisoEliminar && (
              <div
                className={`p-3 text-sm ${
                  avisoEliminar.tipo === "advertencia"
                    ? "bg-amber-50 text-amber-700"
                    : avisoEliminar.tipo === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50 text-blue-700"
                }`}
              >
                {avisoEliminar.mensaje}
              </div>
            )}

            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Mes</th>
                  <th className="p-3">Total ahorrado</th>
                  <th className="p-3">Sello</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MESES.map((mes) => {
                  const depositos = ahorros[mes] || [];
                  const totalMes = depositos.reduce(
                    (s, a) => s + Number(a.monto),
                    0,
                  );
                  const sello = tieneSello(mes);
                  const expandido = mesExpandido === mes;

                  return (
                    <React.Fragment key={mes}>
                      <tr
                        className="border-t cursor-pointer hover:bg-gray-50"
                        onClick={() => setMesExpandido(expandido ? null : mes)}
                      >
                        <td className="p-3">{mes}</td>
                        <td className="p-3">${totalMes}</td>
                        <td className="p-3">{sello ? "🏅" : "—"}</td>
                        <td className="p-3">
                          {totalMes < 100 && (
                            <span className="text-gray-300 text-xs">
                              Sin alcanzar $100
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandido && (
                        <tr>
                          <td colSpan={4} className="p-3 bg-gray-50">
                            {depositos.length === 0 && (
                              <p className="text-xs text-gray-400">
                                Sin depósitos este mes
                              </p>
                            )}
                            {depositos.map((dep) => (
                              <div
                                key={dep.id}
                                className="flex justify-between items-center py-1 text-xs"
                              >
                                <span>
                                  {dep.fecha} — ${dep.monto}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarDeposito(dep.id);
                                  }}
                                  className="text-red-600 font-semibold"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalDeposito && (
        <ModalRegistrarDeposito
          usuario={seleccionado}
          onClose={() => setModalDeposito(false)}
          onRegistrado={() => {
            cargarDetalle(seleccionado);
            cargarUsuarios();
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// TAB 2: Todos los sellos otorgados
// =====================================================
function TabSellos() {
  const [sellos, setSellos] = useState([]);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);

      let query = supabase
        .from("sellos_digitales")
        .select("usuario_id, mes, anio, monto_acumulado, fecha_sello")
        .order("fecha_sello", { ascending: false })
        .limit(200);

      if (filtroMes !== "todos") query = query.eq("mes", filtroMes);

      const { data } = await query;

      if (!data || data.length === 0) {
        setSellos([]);
        setCargando(false);
        return;
      }

      const ids = [...new Set(data.map((s) => s.usuario_id))];
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("id, nombre, numero_socio")
        .in("id", ids);

      const mapaUsuarios = Object.fromEntries(
        (usuariosData || []).map((u) => [String(u.id), u]),
      );

      setSellos(
        data.map((s) => ({ ...s, usuario: mapaUsuarios[s.usuario_id] })),
      );
      setCargando(false);
    };

    cargar();
  }, [filtroMes]);

  return (
    <div>
      <select
        value={filtroMes}
        onChange={(e) => setFiltroMes(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm bg-white mb-4"
      >
        <option value="todos">Todos los meses</option>
        {MESES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Mes</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Fecha del sello</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && sellos.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  Sin sellos registrados
                </td>
              </tr>
            )}
            {sellos.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  {s.usuario?.nombre || "—"}{" "}
                  <span className="text-gray-400 font-mono text-xs">
                    {s.usuario?.numero_socio}
                  </span>
                </td>
                <td className="p-3">
                  {s.mes} {s.anio}
                </td>
                <td className="p-3">${s.monto_acumulado}</td>
                <td className="p-3 text-gray-500">
                  {new Date(s.fecha_sello).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// TAB 3: Retos (fechas) y diplomas pendientes de entregar
// =====================================================
function TabRetos() {
  const [retos, setRetos] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [fechasEdit, setFechasEdit] = useState({ inicio: "", fin: "" });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);

    const { data: retosData, error: retosError } = await supabase
      .from("retos_ahorro")
      .select("*")
      .order("fecha_inicio");

    if (retosError) console.error("Error cargando retos:", retosError);
    setRetos(retosData || []);

    const { data: progresoData } = await supabase
      .from("reto_progreso")
      .select("usuario_id, reto_id, fecha_diploma")
      .eq("diploma_generado", true)
      .eq("entregado", false);

    if (!progresoData || progresoData.length === 0) {
      setPendientes([]);
      setCargando(false);
      return;
    }

    const ids = [...new Set(progresoData.map((p) => p.usuario_id))];
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id, nombre, numero_socio")
      .in("id", ids);

    const mapaUsuarios = Object.fromEntries(
      (usuariosData || []).map((u) => [String(u.id), u]),
    );
    const mapaRetos = Object.fromEntries(
      (retosData || []).map((r) => [r.id, r]),
    );

    setPendientes(
      progresoData.map((p) => ({
        ...p,
        usuario: mapaUsuarios[p.usuario_id],
        reto: mapaRetos[p.reto_id],
      })),
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const iniciarEdicion = (reto) => {
    setEditando(reto.id);
    setFechasEdit({ inicio: reto.fecha_inicio, fin: reto.fecha_fin });
  };

  const guardarFechas = async (id) => {
    await supabase.rpc("admin_actualizar_reto", {
      p_id: id,
      p_fecha_inicio: fechasEdit.inicio,
      p_fecha_fin: fechasEdit.fin,
    });
    setEditando(null);
    cargar();
  };

  const marcarEntregado = async (usuarioId, retoId) => {
    await supabase.rpc("admin_marcar_diploma_entregado", {
      p_usuario_id: usuarioId,
      p_reto_id: retoId,
    });
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Reto</th>
              <th className="p-3">Meses</th>
              <th className="p-3">Fecha inicio</th>
              <th className="p-3">Fecha fin</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && retos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No hay retos configurados todavía
                </td>
              </tr>
            )}
            {retos.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.nombre}</td>
                <td className="p-3 text-gray-500">
                  {(r.meses || []).join(", ")}
                </td>
                <td className="p-3">
                  {editando === r.id ? (
                    <input
                      type="date"
                      value={fechasEdit.inicio}
                      onChange={(e) =>
                        setFechasEdit({ ...fechasEdit, inicio: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    r.fecha_inicio
                  )}
                </td>
                <td className="p-3">
                  {editando === r.id ? (
                    <input
                      type="date"
                      value={fechasEdit.fin}
                      onChange={(e) =>
                        setFechasEdit({ ...fechasEdit, fin: e.target.value })
                      }
                      className="border rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    r.fecha_fin
                  )}
                </td>
                <td className="p-3">
                  {editando === r.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => guardarFechas(r.id)}
                        className="text-green-600 text-xs font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="text-gray-400 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicion(r)}
                      className="text-alianza-azul text-xs font-semibold"
                    >
                      Editar fechas
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="font-semibold text-alianza-azul mb-3">
          Diplomas pendientes de entregar
        </p>
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3">Reto</th>
                <th className="p-3">Fecha completado</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No hay diplomas pendientes
                  </td>
                </tr>
              )}
              {pendientes.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">
                    {p.usuario?.nombre}{" "}
                    <span className="text-gray-400 font-mono text-xs">
                      {p.usuario?.numero_socio}
                    </span>
                  </td>
                  <td className="p-3">{p.reto?.nombre}</td>
                  <td className="p-3 text-gray-500">
                    {p.fecha_diploma
                      ? new Date(p.fecha_diploma).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => marcarEntregado(p.usuario_id, p.reto_id)}
                      className="text-green-600 text-xs font-semibold"
                    >
                      Marcar entregado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminAhorros;
