import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "../../supabaseClient";

function ModalImportarCSV({ onClose, onImportado }) {
  const [filas, setFilas] = useState([]);
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    Papa.parse(archivo, {
      header: true,
      skipEmptyLines: true,
      complete: (resultadoParse) => {
        const validas = [];
        const erroresLocal = [];

        resultadoParse.data.forEach((fila, i) => {
          const numeroSocio = (fila.numero_socio || "").trim().toUpperCase();
          const nombre = (fila.nombre || "").trim();
          const edad = Number(fila.edad);

          if (!/^[A-Z0-9]{8,10}$/.test(numeroSocio) || !nombre || isNaN(edad)) {
            erroresLocal.push(
              `Fila ${i + 2}: datos inválidos (${JSON.stringify(fila)})`,
            );
            return;
          }

          validas.push({
            numero_socio: numeroSocio,
            nombre,
            edad,
            activado: false,
          });
        });

        setFilas(validas);
        setErrores(erroresLocal);
      },
    });
  };

  const handleImportar = async () => {
    setCargando(true);

    const tamanoLote = 300;
    let insertados = 0;
    let fallidos = 0;

    for (let i = 0; i < filas.length; i += tamanoLote) {
      const lote = filas.slice(i, i + tamanoLote);
      const { data, error } = await supabase.rpc("admin_importar_usuarios", {
        p_usuarios: lote,
      });

      if (error) {
        fallidos += lote.length;
      } else {
        insertados += data.insertados;
        fallidos += data.fallidos;
      }
    }

    setCargando(false);
    setResultado({ insertados, fallidos });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md">
        <h3 className="text-lg font-bold text-alianza-azul mb-4">
          Importar usuarios (CSV)
        </h3>

        <p className="text-xs text-gray-500 mb-3">
          El archivo debe tener las columnas: <b>numero_socio, nombre, edad</b>
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleArchivo}
          className="mb-4 text-sm"
        />

        {filas.length > 0 && !resultado && (
          <p className="text-sm text-green-700 mb-2">
            {filas.length} usuarios listos para importar
          </p>
        )}

        {errores.length > 0 && (
          <div className="max-h-28 overflow-y-auto bg-red-50 rounded p-2 mb-3">
            {errores.map((err, i) => (
              <p key={i} className="text-xs text-red-600">
                {err}
              </p>
            ))}
          </div>
        )}

        {resultado && (
          <p className="text-sm mb-3">
            ✅ {resultado.insertados} importados
            {resultado.fallidos > 0 &&
              ` · ⚠️ ${resultado.fallidos} fallaron (posibles duplicados)`}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold"
          >
            {resultado ? "Cerrar" : "Cancelar"}
          </button>
          {!resultado && (
            <button
              onClick={handleImportar}
              disabled={cargando || filas.length === 0}
              className="flex-1 bg-alianza-azul text-white py-2 rounded-lg font-semibold disabled:opacity-60"
            >
              {cargando ? "Importando..." : `Importar ${filas.length}`}
            </button>
          )}
        </div>

        {resultado && (
          <button
            onClick={() => {
              onImportado();
              onClose();
            }}
            className="w-full mt-2 text-alianza-azul text-sm font-semibold"
          >
            Ver lista actualizada
          </button>
        )}
      </div>
    </div>
  );
}

export default ModalImportarCSV;
