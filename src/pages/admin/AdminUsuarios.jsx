import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import ModalUsuario from '../../components/admin/ModalUsuario';
import ModalImportarCSV from '../../components/admin/ModalImportarCSV';
import ModalConfirmar from '../../components/admin/ModalConfirmar';

const POR_PAGINA = 15;

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [cargando, setCargando] = useState(false);
  const [modalUsuario, setModalUsuario] = useState(null); // null | {} nuevo | usuario editar
  const [modalImportar, setModalImportar] = useState(false);
  const [confirmarAccion, setConfirmarAccion] = useState(null); // { tipo: 'reset'|'bloquear', usuario }
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    let query = supabase
      .from('usuarios')
      .select('id, numero_socio, nombre, edad, nivel, activado, bloqueado, rol', { count: 'exact' })
      .neq('rol', 'admin')
      .order('fecha_registro', { ascending: false });

    if (busqueda.trim()) {
      const termino = busqueda.trim();
      query = query.or(`numero_socio.ilike.%${termino}%,nombre.ilike.%${termino}%`);
    }
    if (filtroNivel !== 'todos') query = query.eq('nivel', filtroNivel);
    if (filtroEstado === 'activados') query = query.eq('activado', true);
    if (filtroEstado === 'pendientes') query = query.eq('activado', false);
    if (filtroEstado === 'bloqueados') query = query.eq('bloqueado', true);

    const desde = pagina * POR_PAGINA;
    const { data, count } = await query.range(desde, desde + POR_PAGINA - 1);

    setUsuarios(data || []);
    setTotal(count || 0);
    setCargando(false);
  }, [busqueda, filtroNivel, filtroEstado, pagina]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useEffect(() => { setPagina(0); }, [busqueda, filtroNivel, filtroEstado]);

  const ejecutarAccion = async () => {
  if (!confirmarAccion) return;
  setProcesandoAccion(true);

  const { tipo, usuario } = confirmarAccion;

  if (tipo === 'reset') {
    await supabase.rpc('admin_resetear_password', { p_id: usuario.id });
  }

  if (tipo === 'bloquear') {
    await supabase.rpc('admin_alternar_bloqueo', { p_id: usuario.id });
  }

  setProcesandoAccion(false);
  setConfirmarAccion(null);
  cargarUsuarios();
};

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-alianza-azul">Usuarios</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModalImportar(true)}
            className="bg-white border border-alianza-azul text-alianza-azul px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Importar CSV
          </button>
          <button
            onClick={() => setModalUsuario({})}
            className="bg-alianza-azul text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            + Agregar usuario
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por número de socio o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-[220px] px-4 py-2 border rounded-lg text-sm"
        />
        <select
          value={filtroNivel}
          onChange={(e) => setFiltroNivel(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="todos">Todos los rangos</option>
          <option value="0-5">0-5</option>
          <option value="6-8">6-8</option>
          <option value="9-12">9-12</option>
          <option value="13-15">13-15</option>
          <option value="16-17">16-17</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="activados">Activados</option>
          <option value="pendientes">Pendientes de activar</option>
          <option value="bloqueados">Bloqueados</option>
        </select>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Número de socio</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Edad</th>
              <th className="p-3">Rango</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Cargando...</td></tr>
            )}

            {!cargando && usuarios.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Sin resultados</td></tr>
            )}

            {usuarios.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-mono">{u.numero_socio}</td>
                <td className="p-3">{u.nombre}</td>
                <td className="p-3">{u.edad}</td>
                <td className="p-3">{u.nivel}</td>
                <td className="p-3">
                  {u.bloqueado ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Bloqueado</span>
                  ) : u.activado ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Activado</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold">Pendiente</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setModalUsuario(u)}
                      className="text-alianza-azul text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmarAccion({ tipo: 'reset', usuario: u })}
                      className="text-amber-600 text-xs font-semibold"
                    >
                      Resetear contraseña
                    </button>
                    <button
                      onClick={() => setConfirmarAccion({ tipo: 'bloquear', usuario: u })}
                      className="text-red-600 text-xs font-semibold"
                    >
                      {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-500">{total} usuarios en total</span>
        <div className="flex gap-2">
          <button
            disabled={pagina === 0}
            onClick={() => setPagina((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2">{pagina + 1} / {totalPaginas}</span>
          <button
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODALES */}
      {modalUsuario !== null && (
        <ModalUsuario
          usuario={Object.keys(modalUsuario).length ? modalUsuario : null}
          onClose={() => setModalUsuario(null)}
          onGuardado={() => { setModalUsuario(null); cargarUsuarios(); }}
        />
      )}

      {modalImportar && (
        <ModalImportarCSV
          onClose={() => setModalImportar(false)}
          onImportado={cargarUsuarios}
        />
      )}

      {confirmarAccion && (
        <ModalConfirmar
          titulo={confirmarAccion.tipo === 'reset' ? 'Resetear contraseña' : (confirmarAccion.usuario.bloqueado ? 'Desbloquear usuario' : 'Bloquear usuario')}
          mensaje={
            confirmarAccion.tipo === 'reset'
              ? `${confirmarAccion.usuario.nombre} deberá crear una nueva contraseña la próxima vez que inicie sesión.`
              : confirmarAccion.usuario.bloqueado
                ? `${confirmarAccion.usuario.nombre} podrá volver a iniciar sesión.`
                : `${confirmarAccion.usuario.nombre} no podrá iniciar sesión hasta que lo desbloquees.`
          }
          onConfirmar={ejecutarAccion}
          onCancelar={() => setConfirmarAccion(null)}
          cargando={procesandoAccion}
        />
      )}
    </div>
  );
}

export default AdminUsuarios;