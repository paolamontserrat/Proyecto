import { useState } from 'react';
import { supabase } from '../../supabaseClient';

function ModalUsuario({ usuario, onClose, onGuardado }) {
  const esNuevo = !usuario;

  const [numeroSocio, setNumeroSocio] = useState(usuario?.numero_socio || '');
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [edad, setEdad] = useState(usuario?.edad ?? '');
  const [correo, setCorreo] = useState(usuario?.correo_contacto || '');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');

    const socioLimpio = numeroSocio.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,10}$/.test(socioLimpio)) {
      setError('El número de socio debe tener entre 8 y 10 caracteres');
      return;
    }
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (edad === '' || Number(edad) < 0 || Number(edad) > 17) {
      setError('La edad debe estar entre 0 y 17');
      return;
    }

    setCargando(true);

    if (esNuevo) {
      const { data, error: rpcError } = await supabase.rpc('admin_insertar_usuario', {
        p_numero_socio: socioLimpio,
        p_nombre: nombre.trim(),
        p_edad: Number(edad),
      });

      setCargando(false);

      if (rpcError || !data?.ok) {
        setError(data?.error === 'duplicado' ? 'Ya existe un usuario con ese número de socio' : 'No se pudo crear el usuario');
        return;
      }
    } else {
      const { error: rpcError } = await supabase.rpc('admin_actualizar_usuario', {
        p_id: usuario.id,
        p_nombre: nombre.trim(),
        p_edad: Number(edad),
        p_correo: correo.trim() || null,
      });

      setCargando(false);

      if (rpcError) {
        setError('No se pudo actualizar el usuario');
        return;
      }
    }

    onGuardado();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-alianza-azul mb-5">
          {esNuevo ? 'Agregar usuario' : 'Editar usuario'}
        </h3>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Número de socio
            </label>
            <input
              type="text"
              value={numeroSocio}
              disabled={!esNuevo}
              onChange={(e) => setNumeroSocio(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Edad
            </label>
            <input
              type="number"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              min={0}
              max={17}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Correo de contacto <span className="text-gray-300 font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 transition py-2 rounded-lg font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 bg-alianza-azul hover:bg-blue-800 transition text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalUsuario;