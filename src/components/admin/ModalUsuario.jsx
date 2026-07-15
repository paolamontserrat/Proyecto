import { useState } from "react";
import { supabase } from "../../supabaseClient";

function ModalUsuario({ usuario, onClose, onGuardado }) {
  const esNuevo = !usuario;

  const [numeroSocio, setNumeroSocio] = useState(usuario?.numero_socio || "");
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [edad, setEdad] = useState(usuario?.edad ?? "");
  const [correo, setCorreo] = useState(usuario?.correo_contacto || "");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    const socioLimpio = numeroSocio.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,10}$/.test(socioLimpio)) {
      setError("El número de socio debe tener entre 8 y 10 caracteres");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (edad === "" || Number(edad) < 0 || Number(edad) > 17) {
      setError("La edad debe estar entre 0 y 17");
      return;
    }

    setCargando(true);

    if (esNuevo) {
      const { data, error: rpcError } = await supabase.rpc(
        "admin_insertar_usuario",
        {
          p_numero_socio: socioLimpio,
          p_nombre: nombre.trim(),
          p_edad: Number(edad),
        },
      );

      setCargando(false);

      if (rpcError || !data?.ok) {
        setError(
          data?.error === "duplicado"
            ? "Ya existe un usuario con ese número de socio"
            : "No se pudo crear el usuario",
        );
        return;
      }
    } else {
      const { error: rpcError } = await supabase.rpc(
        "admin_actualizar_usuario",
        {
          p_id: usuario.id,
          p_nombre: nombre.trim(),
          p_edad: Number(edad),
          p_correo: correo.trim() || null,
        },
      );

      setCargando(false);

      if (rpcError) {
        setError("No se pudo actualizar el usuario");
        return;
      }
    }

    onGuardado();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
        <h3 className="text-lg font-bold text-alianza-azul mb-4">
          {esNuevo ? "Agregar usuario" : "Editar usuario"}
        </h3>

        <form onSubmit={handleGuardar} className="space-y-3">
          <input
            type="text"
            placeholder="Número de socio"
            value={numeroSocio}
            disabled={!esNuevo}
            onChange={(e) =>
              setNumeroSocio(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
            }
            maxLength={10}
            className="w-full px-4 py-2 border rounded-lg text-sm disabled:bg-gray-100"
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Edad"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            min={0}
            max={17}
            className="w-full px-4 py-2 border rounded-lg text-sm"
          />
          <input
            type="email"
            placeholder="Correo de contacto (opcional)"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 bg-alianza-azul text-white py-2 rounded-lg font-semibold disabled:opacity-60"
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalUsuario;
