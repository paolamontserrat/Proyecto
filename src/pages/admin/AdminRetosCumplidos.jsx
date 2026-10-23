import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { RANGOS } from "../../constants/rangos";
import {
  resumirRetosCumplidos,
  enmascararSocio,
  fechaCorta,
  descargarExcelRetos,
} from "../../utils/RetosCumplidos";

const etiquetaRango = (r) => (r === "0-5" ? "0-5 años" : `${r} años`);

// Tabla de los retos que cada niño lleva cumplidos.
// Se puede filtrar por edad y descargar todo en Excel.
function AdminRetoscumplidos() {
  const [rango, setRango] = useState(RANGOS[0]);
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState(false);

  // Carga a todos los niños (todas las edades) con sus retos cumplidos.
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError("");

      const [{ data: retos, error: errRetos }, ...respuestas] = await Promise.all([
        supabase.from("retos").select("id, titulo, tipo, recompensa_monedas"),
        ...RANGOS.map((r) => supabase.rpc("admin_usuarios_por_rango", { p_rango: r })),
      ]);

      if (cancelado) return;
      if (errRetos) {
        setError("No se pudieron cargar los retos.");
        setCargando(false);
        return;
      }

      // Une los niños de cada edad, guardando a qué edad pertenece cada uno
      const usuarios = respuestas.flatMap((res, i) =>
        (res.data || []).map((u) => ({ ...u, rango: RANGOS[i] }))
      );

      let completados = [];
      if (usuarios.length > 0) {
        const { data } = await supabase
          .from("retos_usuario")
          .select("usuario_id, reto_id, completado_en")
          .in("usuario_id", usuarios.map((u) => u.id))
          .eq("completado", true);
        completados = data || [];
      }

      if (cancelado) return;
      setFilas(resumirRetosCumplidos(usuarios, retos || [], completados));
      setCargando(false);
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  const filasRango = useMemo(() => filas.filter((f) => f.rango === rango), [filas, rango]);

  const totalRetos = filas[0]?.total ?? 0;
  const promedio =
    filasRango.length > 0 && totalRetos
      ? Math.round(
          (filasRango.reduce((s, f) => s + f.cumplidos.length, 0) / (filasRango.length * totalRetos)) * 100
        )
      : null;

  const descargar = async () => {
    setDescargando(true);
    try {
      await descargarExcelRetos(filas); // todas las edades
    } catch {
      alert("No se pudo generar el Excel. Inténtalo de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start gap-4 flex-wrap mb-2">
        <div>
          <h1 className="text-2xl font-bold text-alianza-azul mb-2">Retos cumplidos por niño</h1>
          <p className="text-sm text-gray-500">
            Cuántos retos lleva cumplidos cada niño según su edad.
          </p>
        </div>
        <button
          onClick={descargar}
          disabled={cargando || descargando || filas.length === 0}
          className="flex items-center gap-2 bg-alianza-azul hover:bg-alianza-azul/90 text-white px-4 py-2 rounded-full font-bold text-sm shadow disabled:opacity-60"
        >
          <Download size={16} />
          {descargando ? "Generando..." : "Descargar Excel"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-6">El Excel incluye a todos los niños de todas las edades.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {RANGOS.map((r) => (
          <button
            key={r}
            onClick={() => setRango(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              rango === r ? "bg-alianza-azul text-white" : "bg-white text-alianza-azul border"
            }`}
          >
            {etiquetaRango(r)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
      )}

      {promedio !== null && (
        <div className="bg-white rounded-2xl shadow p-4 mb-4 inline-block">
          <p className="text-xs text-gray-500">Avance promedio de {etiquetaRango(rango)}</p>
          <p className="text-3xl font-black text-alianza-azul">{promedio}%</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Retos cumplidos</th>
              <th className="p-3 w-1/4">Avance</th>
              <th className="p-3">Retos</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">Cargando...</td>
              </tr>
            )}

            {!cargando && filasRango.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">Sin usuarios en esta edad</td>
              </tr>
            )}

            {filasRango.map((f) => (
              <tr key={f.id} className="border-t align-top">
                <td className="p-3">
                  <p className="font-semibold">{f.nombre}</p>
                  <p className="text-gray-400 font-mono text-xs">{enmascararSocio(f.numero_socio)}</p>
                </td>
                <td className="p-3">
                  {f.cumplidos.length} / {f.total}
                </td>
                <td className="p-3">
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-alianza-azul" style={{ width: `${f.porcentaje}%` }} />
                  </div>
                </td>
                <td className="p-3">
                  {f.cumplidos.length === 0 ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {f.cumplidos.map((r) => (
                        <span
                          key={r.id}
                          title={`Cumplido el ${fechaCorta(r.completado_en)}`}
                          className="text-xs font-semibold bg-alianza-azul/10 text-alianza-azul px-2 py-1 rounded-full"
                        >
                          {r.tipo === "habito" ? "🌱" : "💰"} {r.titulo}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminRetoscumplidos;