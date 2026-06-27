import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

const Passport = () => {
  const navigate = useNavigate();
  const { rango } = useParams();

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario?.id || "anon";

  // =========================
  // 🔥 MESES SEGUROS
  // =========================
  const obtenerMesActual = (fecha = new Date()) => {
    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];
    return meses[fecha.getMonth()];
  };

  const nombreMesActual = obtenerMesActual(new Date());

  // =========================
  // 🔥 STORAGE MULTIUSUARIO
  // =========================
  const storageKey = `ahorros_${userId}_${rango}`;

  const [ahorros, setAhorros] = useState(() =>
    JSON.parse(localStorage.getItem(storageKey)) || {}
  );

  const [mesExpandido, setMesExpandido] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fecha: '', monto: '', id: null });
  const [error, setError] = useState('');

  const [fondo, setFondo] = useState('/images/0-5/Fondo0-5.png');

  // =========================
  // 🔥 FONDO POR RANGO
  // =========================
  useEffect(() => {
    const cargarFondo = async () => {
      try {
        const res = await fetch(`/data/${rango}.json`);
        const data = await res.json();

        if (data?.fondoPasaporte) {
          setFondo(data.fondoPasaporte);
        }
      } catch {}
    };

    if (rango) cargarFondo();
  }, [rango]);

  // =========================
  // 🔥 LOAD SUPABASE
  // =========================
  useEffect(() => {
    const load = async () => {
      // Nota: Si el usuario es anon, solo carga de localStorage
      if (userId === "anon") return;

      const { data } = await supabase
        .from('ahorros_usuario')
        .select('datos')
        .eq('usuario_id', userId)
        .eq('rango', rango)
        .maybeSingle();

      if (data?.datos) {
        setAhorros(data.datos);
        localStorage.setItem(storageKey, JSON.stringify(data.datos));
      }
    };

    load();
  }, [userId, rango, storageKey]);

  // =========================
  // 🔥 SYNC SUPABASE + LOCAL
  // =========================
  const sync = async (nuevo) => {
    setAhorros(nuevo);
    localStorage.setItem(storageKey, JSON.stringify(nuevo));

    if (userId === "anon") return;

    await supabase.from('ahorros_usuario').upsert({
      usuario_id: userId,
      rango,
      datos: nuevo
    }, {
      onConflict: 'usuario_id,rango'
    });
  };

  // =========================
  // 🔥 VALIDACIÓN
  // =========================
  const validar = () => {
    if (!formData.fecha) return false;
    if (!formData.monto || Number(formData.monto) <= 0) return false;
    if (mesExpandido !== nombreMesActual) return false;
    return true;
  };

  // =========================
  // 🔥 GUARDAR AHORRO
  // =========================
  const handleSave = () => {
    if (!validar()) {
      setError("Solo puedes ahorrar en el mes actual con datos válidos");
      return;
    }

    const nuevos = { ...ahorros };

    if (!nuevos[mesExpandido]) {
      nuevos[mesExpandido] = [];
    }

    const lista = nuevos[mesExpandido];

    // ⭐ racha semanal
    const esConstante =
      lista.length === 0 ||
      (Date.now() - lista[lista.length - 1]?.id > 604800000);

    const nuevoItem = {
      ...formData,
      id: formData.id || Date.now(),
      estrella: esConstante
    };

    if (formData.id) {
      nuevos[mesExpandido] = lista.map(item =>
        item.id === formData.id ? nuevoItem : item
      );
    } else {
      nuevos[mesExpandido].push(nuevoItem);
    }

    sync(nuevos);

    setShowForm(false);
    setFormData({ fecha: '', monto: '', id: null });
    setError('');
  };

  // =========================
  // 🔥 ELIMINAR
  // =========================
  const handleDelete = (id) => {
    const nuevos = { ...ahorros };

    nuevos[mesExpandido] =
      nuevos[mesExpandido].filter(a => a.id !== id);

    sync(nuevos);
  };

  const iniciarEdicion = (item) => {
    setFormData(item);
    setShowForm(true);
  };

  const calcularTotal = () => {
    let total = 0;
    Object.values(ahorros).forEach(mes => {
      mes.forEach(a => total += Number(a.monto));
    });
    return total;
  };

  const puedeEditar = mesExpandido === nombreMesActual;

  // =========================
  // 🔥 UI (NO TOCAR)
  // =========================
  return (
    <div
      className="p-4 min-h-screen pb-10"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover'
      }}
    >

      {/* HEADER */}
      <div className="max-w-md mx-auto mb-4 flex justify-between">
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
          ← Volver
        </button>

        <button onClick={() => navigate(`/dashboard/${rango}`)} className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold">
          Inicio
        </button>
      </div>

      {/* TOTAL */}
      <div className="bg-alianza-azul text-white p-4 rounded-3xl mb-6 text-center">
        <p>Total ahorrado</p>
        <p className="text-3xl font-black text-alianza-amarillo">
          ${calcularTotal()}
        </p>
      </div>

      {/* MESES */}
      <div className="max-w-sm mx-auto space-y-4">
        {[
          "Enero","Febrero","Marzo","Abril","Mayo","Junio",
          "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
        ].map(mes => {

          const totalMes =
            ahorros[mes]?.reduce((s, a) => s + Number(a.monto), 0) || 0;

          const tieneEstrella =
            ahorros[mes]?.some(a => a.estrella);

          return (
            <div key={mes} className="bg-white rounded-2xl border-2 overflow-hidden">

              <button
                onClick={() => setMesExpandido(mesExpandido === mes ? null : mes)}
                className={`w-full p-4 flex justify-between font-black ${
                  mes === nombreMesActual ? "bg-alianza-amarillo text-alianza-azul" : ""
                }`}
              >
                {mes} {tieneEstrella && "⭐"}
                <span>${totalMes}</span>
              </button>

              {mesExpandido === mes && (
                <div className="p-4">

                  {(ahorros[mes] || []).map(a => (
                    <div key={a.id} className="flex justify-between py-2 border-b">

                      <div>
                        <p className="text-sm">{a.fecha}</p>
                        <p className="font-black">${a.monto}</p>
                      </div>

                      {mes === nombreMesActual && (
                        <div className="flex gap-2">
                          <button onClick={() => iniciarEdicion(a)}>✏️</button>
                          <button onClick={() => handleDelete(a.id)}>🗑️</button>
                        </div>
                      )}

                    </div>
                  ))}

                  {puedeEditar && (
                    <button
                      onClick={() => {
                        setFormData({ fecha: '', monto: '', id: null });
                        setShowForm(true);
                        setError('');
                      }}
                      className="w-full mt-2 bg-alianza-azul text-white py-2 rounded"
                    >
                      + Agregar ahorro
                    </button>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm">

            <input
              type="date"
              value={formData.fecha}
              onChange={(e) =>
                setFormData({ ...formData, fecha: e.target.value })
              }
              className="w-full p-3 border mb-2"
            />

            <input
              type="number"
              value={formData.monto}
              onChange={(e) =>
                setFormData({ ...formData, monto: e.target.value })
              }
              className="w-full p-3 border mb-2"
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 py-2 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Passport;