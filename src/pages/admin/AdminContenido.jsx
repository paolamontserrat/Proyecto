import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const RANGOS = ["0-5", "6-8", "9-12", "13-15", "16-17"];

function AdminContenido() {
  const [rango, setRango] = useState("0-5");
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarContenido = async (r) => {
    setRango(r);
    setError("");
    setMensaje("");
    setCargando(true);

    const { data } = await supabase
      .from("contenido_pasaportes")
      .select("contenido")
      .eq("rango", r)
      .maybeSingle();

    if (data?.contenido) {
      setTexto(JSON.stringify(data.contenido, null, 2));
    } else {
      // primera vez: trae el JSON estático actual como punto de partida
      try {
        const res = await fetch(`/data/${r}.json`);
        const json = await res.json();
        setTexto(JSON.stringify(json, null, 2));
      } catch {
        setTexto("{}");
      }
    }

    setCargando(false);
  };

  const guardar = async () => {
    setError("");
    setMensaje("");

    let parseado;
    try {
      parseado = JSON.parse(texto);
    } catch {
      setError("El contenido no es un JSON válido. Revisa comas y llaves.");
      return;
    }

    setCargando(true);
    const { error: rpcError } = await supabase.rpc("admin_guardar_contenido", {
      p_rango: rango,
      p_contenido: parseado,
    });
    setCargando(false);

    if (rpcError) {
      setError("No se pudo guardar");
      return;
    }

    setMensaje("Guardado correctamente");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-alianza-azul mb-2">Contenido de actividades</h1>
      <p className="text-sm text-gray-500 mb-6">
        Edita el JSON de configuración de cada pasaporte. La primera vez que abras un rango, se carga desde el archivo actual del proyecto como punto de partida.
      </p>

      <div className="flex gap-2 mb-4">
        {RANGOS.map((r) => (
          <button
            key={r}
            onClick={() => cargarContenido(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              rango === r ? "bg-alianza-azul text-white" : "bg-white text-alianza-azul border"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={20}
        className="w-full font-mono text-xs p-4 border rounded-2xl bg-white"
        placeholder="Selecciona un rango para cargar su contenido"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {mensaje && <p className="text-green-600 text-sm mt-2">{mensaje}</p>}

      <button
        onClick={guardar}
        disabled={cargando || !texto}
        className="mt-4 bg-alianza-azul text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-60"
      >
        {cargando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

export default AdminContenido;