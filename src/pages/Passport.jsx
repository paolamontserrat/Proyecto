import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Footer from "../components/Footer";
import Confetti from "../components/Confetti";
import PasaporteSellos from "../components/PasaporteSellos";
import PasaporteDiplomas from "../components/PasaporteDiplomas";
import ModalReto from "../components/ModalReto";
import ModalMeta from "../components/ModalMeta";
import SeccionRetos from "../components/SeccionRetos";
import AlcanciaMonedas from "../components/AlcanciaMonedas";
import { registrarProgreso } from "../registrarProgreso";


const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];


const Passport = () => {
  const navigate = useNavigate();
  const { rango } = useParams();
  const location = useLocation();

  // Obtiene los datos del usuario que inició sesión
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id || "anon";


  const nombreMesActual = MESES[new Date().getMonth()];

  const anioActual = new Date().getFullYear();

  const storageKey = `ahorros_${userId}_${rango}`;


  // Guarda los ahorros del usuario
  const [ahorros, setAhorros] = useState(
    () => JSON.parse(localStorage.getItem(storageKey)) || {},
  );

  const [mesExpandido, setMesExpandido] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fecha: "",
    monto: "",
    id: null
  });
  const [error, setError] = useState("");
  const [fondo, setFondo] = useState("/images/0-5/Fondo0-5.png");


  // Estados de gamificación: sellos, diplomas y retos
  const [mostrarSello, setMostrarSello] = useState(false);
  const [sinceSello, setSelloInfo] = useState(null);
  const [mostrarDiploma, setMostrarDiploma] = useState(false);
  const [misDiplomas, setMisDiplomas] = useState([]);
  const [misSellos, setMisSellos] = useState([]);


  // Controla los retos completados y actualiza la sección de retos
  const [colaRetos, setColaRetos] = useState([]);
  const [refreshRetosKey, setRefreshRetosKey] = useState(0);
  const [refreshAlcanciaKey, setRefreshAlcanciaKey] = useState(0); // actualiza el total de monedas
  const [reconocimientoPendienteId, setReconocimientoPendienteId] = useState(null); // reto de ahorro cuyo reconocimiento se abrirá

  // Guarda la información de una meta recién completada
  const [metaCompletadaInfo, setMetaCompletadaInfo] = useState(null);


  // Consulta los diplomas obtenidos por el usuario
  const cargarDiplomas = useCallback(async () => {
    if (userId === "anon") return;

    const { data } = await supabase
      .from("diplomas")
      .select("numero")
      .eq("usuario_id", String(userId))
      .order("numero");

    setMisDiplomas(data || []);
  }, [userId]);


  // Consulta los sellos obtenidos durante el año actual
  const cargarSellos = useCallback(async () => {
    if (userId === "anon") return;

    const { data } = await supabase
      .from("sellos_digitales")
      .select("mes, anio")
      .eq("usuario_id", String(userId))
      .eq("anio", anioActual);

    setMisSellos(data || []);
  }, [userId, anioActual]);


  // Carga sellos y diplomas al iniciar
  useEffect(() => {
    cargarDiplomas();
  }, [cargarDiplomas]);

  useEffect(() => {
    cargarSellos();
  }, [cargarSellos]);


  // Comprueba si el usuario tiene un sello en determinado mes
  const tieneSelloReal = (mes) =>
    misSellos.some((s) => s.mes === mes);


  // Reproduce sonido al obtener un diploma
  useEffect(() => {
    if (mostrarDiploma) {
      const audio = new Audio("/sounds/diploma.mp3");
      audio.play().catch(() => {});
    }
  }, [mostrarDiploma]);


  // Reproduce sonido al obtener un sello
  useEffect(() => {
    if (mostrarSello) {
      const audio = new Audio("/sounds/sello.mp3");
      audio.play().catch(() => {});
    }
  }, [mostrarSello]);


  // Carga el fondo correspondiente al rango de edad
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


  // Obtiene los ahorros guardados en Supabase
  useEffect(() => {
    const load = async () => {
      if (userId === "anon") return;

      const { data } = await supabase
        .from("ahorros_usuario")
        .select("datos")
        .eq("usuario_id", userId)
        .eq("rango", rango)
        .maybeSingle();

      if (data?.datos) {
        setAhorros(data.datos);

        // Actualiza también la copia local
        localStorage.setItem(
          storageKey,
          JSON.stringify(data.datos)
        );
      }
    };

    load();
  }, [userId, rango, storageKey]);


  // Guarda los ahorros tanto localmente como en Supabase
  const sync = async (nuevo) => {
    setAhorros(nuevo);
    localStorage.setItem(storageKey, JSON.stringify(nuevo));

    if (userId === "anon") return;

    await supabase
      .from("ahorros_usuario")
      .upsert(
        {
          usuario_id: userId,
          rango,
          datos: nuevo
        },
        {
          onConflict: "usuario_id,rango"
        },
      );
  };


  // Verifica si el usuario ganó un sello al ahorrar $100 o más
  const verificarSello = async (mes, anio, totalMes) => {
    if (userId === "anon") return;
    if (totalMes < 100) return;

    const { data, error: rpcError } = await supabase.rpc(
      "registrar_sello",
      {
        p_usuario_id: String(userId),
        p_mes: mes,
        p_anio: anio,
        p_monto: totalMes,
      }
    );

    if (rpcError || !data?.ok) return;

    // Si el sello es nuevo, muestra la recompensa
    if (data.nuevo) {
      setSelloInfo({
        mes,
        monto: totalMes
      });

      setMostrarSello(true);
      cargarSellos();
    }

    // Si se completaron 3 sellos, muestra el diploma
    if (data.diploma_nuevo) {
      setMostrarDiploma(true);
      cargarDiplomas();
    }
  };


  // Actualiza automáticamente el progreso de retos y metas
  const verificarRetosYMeta = async (monto) => {
    if (userId === "anon") return;

    const resultado = await registrarProgreso(userId, monto);

    // Agrega los retos completados a la cola de recompensas
    if (resultado.retosCompletados.length > 0) {
      setColaRetos((prev) => [
        ...prev,
        ...resultado.retosCompletados
      ]);
      setRefreshAlcanciaKey((k) => k + 1);
    }

    // Si una meta se completó con este depósito, muestra el modal
    if (resultado.metaCompletada) {
      setMetaCompletadaInfo(resultado.metaCompletada);
    }

    // Fuerza a actualizar la sección de retos
    setRefreshRetosKey((k) => k + 1);
  };


  // Valida los datos antes de guardar un ahorro
  const validar = () => {
    if (!formData.fecha) return false;
    if (!formData.monto || Number(formData.monto) <= 0) return false;

    // Solo permite registrar ahorros en el mes actual
    if (mesExpandido !== nombreMesActual) return false;

    return true;
  };


  // Guarda o edita un ahorro
  const handleSave = async () => {
    if (!validar()) {
      setError(
        "Solo puedes ahorrar en el mes actual con datos válidos"
      );
      return;
    }

    const nuevos = { ...ahorros };

    if (!nuevos[mesExpandido]) {
      nuevos[mesExpandido] = [];
    }

    const lista = nuevos[mesExpandido];

    // Determina si el ahorro es constante según el tiempo
    // transcurrido desde el depósito anterior
    const esConstante =
      lista.length === 0 ||
      Date.now() - lista[lista.length - 1]?.id > 604800000;

    const esNuevoDeposito = !formData.id;

    const nuevoItem = {
      ...formData,
      id: formData.id || Date.now(),
      estrella: esConstante,
    };


    // Si existe ID, modifica el ahorro.
    if (formData.id) {
      nuevos[mesExpandido] = lista.map((item) =>
        item.id === formData.id ? nuevoItem : item
      );
    } else {
      // Si no existe ID, agrega un nuevo ahorro.
      nuevos[mesExpandido].push(nuevoItem);
    }


    // Guarda la información
    await sync(nuevos);


    // Calcula cuánto se ha ahorrado durante el mes
    const totalMes = nuevos[mesExpandido].reduce(
      (s, a) => s + Number(a.monto),
      0,
    );


    // Verifica si corresponde un sello
    await verificarSello(
      mesExpandido,
      anioActual,
      totalMes
    );


    // Los retos y metas solo avanzan con depósitos nuevos
    if (esNuevoDeposito) {
      await verificarRetosYMeta(
        Number(formData.monto)
      );
    }


    // Limpia el formulario
    setShowForm(false);
    setFormData({
      fecha: "",
      monto: "",
      id: null
    });
    setError("");
  };


  // Elimina un depósito
  const handleDelete = async (id) => {

    // Si no hay usuario, elimina solamente de la copia local
    if (userId === "anon") {
      const nuevos = { ...ahorros };

      nuevos[mesExpandido] =
        nuevos[mesExpandido].filter((a) => a.id !== id);

      sync(nuevos);
      return;
    }


    // Elimina el depósito mediante una función segura de Supabase
    const { data, error: rpcError } = await supabase.rpc(
      "admin_eliminar_deposito",
      {
        p_usuario_id: String(userId),
        p_rango: rango,
        p_deposito_id: String(id),
      },
    );


    if (rpcError || !data?.ok) {
      setError(
        "No se pudo eliminar el ahorro. Intenta de nuevo."
      );
      return;
    }


    // Actualiza la información local después de eliminar
    const nuevos = { ...ahorros };

    nuevos[mesExpandido] =
      nuevos[mesExpandido].filter((a) => a.id !== id);

    setAhorros(nuevos);

    localStorage.setItem(
      storageKey,
      JSON.stringify(nuevos)
    );


    // Actualiza sellos y diplomas si fueron afectados
    if (data.sello_eliminado) {
      cargarSellos();
    }

    if (data.diploma_revocado) {
      cargarDiplomas();
    }
  };


  // Coloca los datos de un ahorro en el formulario para editarlo
  const iniciarEdicion = (item) => {
    setFormData(item);
    setShowForm(true);
  };


  // Calcula el total ahorrado de todos los meses
  const calcularTotal = () => {
    let total = 0;

    Object.values(ahorros).forEach((mes) => {
      mes.forEach((a) => {
        total += Number(a.monto);
      });
    });

    return total;
  };


  // Solo permite editar el mes actual
  const puedeEditar = mesExpandido === nombreMesActual;


  return (
    <div
      className="p-4 min-h-screen pb-10"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover"
      }}
    >

      {/* Botones de navegación */}
      <div className="max-w-3xl mx-auto mb-4 px-2 md:px-0 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-black shadow-lg active:scale-95 transition-transform"
        >
          ← Volver
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-black shadow-lg active:scale-95 transition-transform"
        >
          Inicio
        </button>
      </div>


      {/* Muestra el total ahorrado */}
      <div className="max-w-3xl mx-auto mb-4 px-2 md:px-0">
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-sky-400 to-alianza-azul shadow-xl flex items-center gap-4">
          <span className="text-8xl leading-none drop-shadow-md">💰</span>
          <div>
            <p className="text-xs font-black text-white/90 uppercase tracking-wide drop-shadow-sm">
              Total ahorrado
            </p>
            <p className="text-4xl font-black text-white drop-shadow-sm">
              ${calcularTotal()}
            </p>
          </div>
          <span className="absolute -right-4 -bottom-4 text-8xl opacity-20">💵</span>
        </div>
      </div>


      {/* Alcancía con monedas */}
      {userId !== "anon" && (
        <div className="max-w-3xl mx-auto mb-4 px-2 md:px-0">
          <AlcanciaMonedas key={refreshAlcanciaKey} usuarioId={userId} />
        </div>
      )}


      {/* Tarjetas de sellos, diplomas, metas y retos */}
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mb-6 px-2 md:px-0">

        <PasaporteSellos
          ahorros={ahorros}
          mesActual={nombreMesActual}
          sellosReales={misSellos}
        />

        <PasaporteDiplomas
          diplomas={misDiplomas}
        />

        {userId !== "anon" && (
          <SeccionRetos
            key={refreshRetosKey}
            usuarioId={userId}
            irARetos={!!location.state?.irARetos}
            onCambio={() => setRefreshAlcanciaKey((k) => k + 1)}
            reconocimientoInicialId={reconocimientoPendienteId}
            onReconocimientoAbierto={() => setReconocimientoPendienteId(null)}
          />
        )}
      </div>


      {/* Aviso para registrar únicamente ahorros reales */}
      <div className="max-w-3xl mx-auto mb-6 px-2 md:px-0">
        <div className="rounded-3xl bg-gradient-to-br from-yellow-200 to-amber-300 shadow-lg px-5 py-4 flex items-center gap-4">

          <img
            src="/images/6/16.png"
            alt="Acude a tu sucursal"
            className="w-24 h-20 object-contain shrink-0"
          />

          <p className="text-base md:text-lg text-amber-950 leading-relaxed font-semibold">
            <span className="font-black text-lg md:text-xl">
              ⚠️ ¡Importante!
            </span>{" "}
            Registra tu ahorro aquí solo cuando realmente lo hayas guardado.{" "}
            <span className="font-black">
              Acude a tu sucursal a depositarlo
            </span>{" "}
            y conserva tu ticket. Con eso tu sello y diploma quedan validados de
            forma oficial y podrás recoger tu recompensa en Caja Popular.
          </p>
        </div>
      </div>


      {/* Lista de meses y ahorros registrados */}
      <section className="max-w-3xl mx-auto px-2 md:px-0" aria-label="Mis ahorros por mes">
        <h3 className="inline-block font-black text-alianza-azul text-lg mb-3 bg-white/85 rounded-full px-4 py-1 shadow">
          📅 Mis ahorros
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {MESES.map((mes) => {

            // Calcula el total ahorrado durante cada mes
            const totalMes =
              ahorros[mes]?.reduce(
                (s, a) => s + Number(a.monto),
                0
              ) || 0;

            const tieneEstrella =
              ahorros[mes]?.some((a) => a.estrella);

            const esActual = mes === nombreMesActual;
            const abierto = mesExpandido === mes;
            const depositos = ahorros[mes] || [];

            return (
              <div
                key={mes}
                className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100"
              >

                {/* Botón para expandir o cerrar el mes */}
                <button
                  onClick={() =>
                    setMesExpandido(abierto ? null : mes)
                  }
                  aria-expanded={abierto}
                  className={`w-full px-5 py-3 flex items-center justify-between gap-2 font-black text-alianza-azul text-left ${
                    esActual
                      ? "bg-gradient-to-r from-yellow-300 to-amber-400"
                      : ""
                  }`}
                >
                  <span>
                    {mes} {tieneEstrella && "⭐"}{" "}
                    {tieneSelloReal(mes) && "🏅"}
                  </span>

                  <span
                    className={`text-sm px-3 py-0.5 rounded-full ${
                      esActual ? "bg-white/50" : "bg-alianza-azul/10"
                    }`}
                  >
                    ${totalMes}
                  </span>
                </button>


                {/* Muestra los depósitos del mes seleccionado */}
                {abierto && (
                  <div className="p-4 grid gap-2">

                    {depositos.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Aún no hay ahorros en {mes}.
                      </p>
                    )}

                    {depositos.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-2.5"
                      >

                        <div>
                          <p className="font-black text-alianza-azul">
                            ${a.monto}
                          </p>

                          <p className="text-xs text-gray-500">
                            {a.fecha}
                          </p>
                        </div>


                        {/* Editar y eliminar solo están disponibles
                            para el mes actual */}
                        {esActual && (
                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                iniciarEdicion(a)
                              }
                              aria-label="Editar ahorro"
                              title="Editar"
                              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center active:scale-95 transition-transform"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(a.id)
                              }
                              aria-label="Eliminar ahorro"
                              title="Eliminar"
                              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center active:scale-95 transition-transform"
                            >
                              🗑️
                            </button>

                          </div>
                        )}
                      </div>
                    ))}


                    {/* Botón para agregar un nuevo ahorro */}
                    {puedeEditar && (
                      <button
                        onClick={() => {
                          setFormData({
                            fecha: "",
                            monto: "",
                            id: null
                          });

                          setShowForm(true);
                          setError("");
                        }}
                        className="w-full mt-1 bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
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
      </section>


      {/* Formulario para registrar o editar un ahorro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white p-6 rounded-3xl w-full max-w-sm">

            <div className="text-center mb-4">
              <p className="text-5xl mb-1">🐷</p>
              <h3 className="text-xl font-black text-alianza-azul">
                {formData.id ? "Editar ahorro" : "Nuevo ahorro"}
              </h3>
            </div>

            <label className="text-sm font-bold text-alianza-azul">
              Fecha
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fecha: e.target.value
                })
              }
              className="w-full px-4 py-3 border rounded-xl mt-1 mb-3"
            />

            <label className="text-sm font-bold text-alianza-azul">
              Monto ($)
            </label>
            <input
              type="number"
              value={formData.monto}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monto: e.target.value
                })
              }
              className="w-full px-4 py-3 border rounded-xl mt-1 mb-2"
            />

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-4">

              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-full font-black"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="flex-1 bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
              >
                Guardar
              </button>

            </div>
          </div>
        </div>
      )}


      {/* Modal cuando se obtiene un sello */}
      {mostrarSello && sinceSello && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

          <Confetti />

          <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center">

            <img
              src="/images/0-5/9.png"
              alt="Medalla de buen ahorrador"
              className="w-36 h-36 mx-auto mb-2 object-contain"
            />

            <h3 className="text-xl font-black text-alianza-azul">
              ¡Sello digital ganado!
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Ahorraste ${sinceSello.monto} en {sinceSello.mes}
            </p>

            <button
              onClick={() => setMostrarSello(false)}
              className="w-full mt-4 bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
            >
              ¡Genial!
            </button>

          </div>
        </div>
      )}


      {/* Modal cuando se obtiene un diploma */}
      {mostrarDiploma && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

          <Confetti />

          <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center">

            <p className="text-5xl mb-2">🏆</p>

            <h3 className="text-xl font-black text-alianza-azul">
              ¡Diploma ganado!
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Completaste 3 sellos más. Descarga tu diploma en la sección de diplomas.
            </p>

            <button
              onClick={() => setMostrarDiploma(false)}
              className="w-full mt-4 bg-alianza-azul text-white py-3 rounded-full font-black shadow active:scale-95 transition-transform"
            >
              Cerrar
            </button>

          </div>
        </div>
      )}


      {/* Modal de reto completado */}
      {colaRetos.length > 0 && (
        <ModalReto
          titulo={colaRetos[0].titulo}
          monedas={colaRetos[0].monedas}
          onVerReconocimiento={
            colaRetos[0].retos_usuario_id
              ? () => {
                  setReconocimientoPendienteId(colaRetos[0].retos_usuario_id);
                  setColaRetos((prev) => prev.slice(1));
                }
              : undefined
          }
          onClose={() =>
            setColaRetos((prev) => prev.slice(1))
          }
        />
      )}


      {/* Modal de meta personal completada */}
      {metaCompletadaInfo && (
        <ModalMeta
          descripcion={metaCompletadaInfo.descripcion}

          onClose={async () => {
            await supabase.rpc(
              "marcar_meta_notificada",
              {
                p_meta_id: metaCompletadaInfo.id
              }
            );

            setMetaCompletadaInfo(null);
            setRefreshRetosKey((k) => k + 1);
          }}

          onCrearOtraMeta={async () => {
            await supabase.rpc(
              "marcar_meta_notificada",
              {
                p_meta_id: metaCompletadaInfo.id
              }
            );

            setMetaCompletadaInfo(null);
            setRefreshRetosKey((k) => k + 1);
          }}
        />
      )}


      <Footer />
    </div>
  );
};


export default Passport;