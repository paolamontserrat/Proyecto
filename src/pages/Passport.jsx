import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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


const Passport = () => {
  const navigate = useNavigate();
  const { rango } = useParams();

  // Obtiene los datos del usuario que inició sesión
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id || "anon";


  const nombreMesActual = (() => {
    const meses = [
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

    return meses[new Date().getMonth()];
  })();

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

      const { data: usuarioDb } = await supabase.rpc(
        "obtener_correo_para_notificar",
        {
          p_usuario_id: userId
        }
      );

      if (usuarioDb?.correo_contacto) {
        const { data: envio, error: envioError } =
          await supabase.functions.invoke(
            "enviar-diploma-email",
            {
              body: {
                correo: usuarioDb.correo_contacto,
                nombre: usuarioDb.nombre,
                numeroDiploma: data.numero_diploma,
              },
            }
          );

        if (!envioError && envio?.ok) {
          setCorreoEnviado(true);
        }
      }
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
      <div className="max-w-md mx-auto mb-4 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold"
        >
          ← Volver
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold"
        >
          Inicio
        </button>
      </div>


      {/* Muestra el total ahorrado */}
      <div className="bg-alianza-azul text-white p-4 rounded-3xl mb-6 text-center">
        <p>Total ahorrado</p>

        <p className="text-3xl font-black text-alianza-amarillo">
          ${calcularTotal()}
        </p>
      </div>


      {/* Alcancía con monedas */}
      {userId !== "anon" && (
        <div className="max-w-3xl mx-auto mb-4 px-2 md:px-0">
          <AlcanciaMonedas usuarioId={userId} />
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
          />
        )}
      </div>


      {/* Aviso para registrar únicamente ahorros reales */}
      <div className="max-w-3xl mx-auto bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 shadow-md">

        <img
          src="/images/6/16.png"
          alt="Acude a tu sucursal"
          className="w-24 h-20 object-contain shrink-0"
        />

        <span className="text-4xl shrink-0">
          ⚠️
        </span>

        <p className="text-base md:text-lg text-amber-900 leading-relaxed font-semibold">
          <span className="font-black text-amber-950 text-lg md:text-xl">
            ¡Importante!
          </span>{" "}
          Registra tu ahorro aquí solo cuando realmente lo hayas guardado.{" "}
          <span className="font-black">
            Acude a tu sucursal a depositarlo
          </span>{" "}
          y conserva tu ticket. Con eso tu sello y diploma quedan validados de
          forma oficial y podrás recoger tu recompensa en Caja Popular.
        </p>
      </div>


      {/* Lista de meses y ahorros registrados */}
      <div className="max-w-sm mx-auto space-y-4">

        {[
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
        ].map((mes) => {

          // Calcula el total ahorrado durante cada mes
          const totalMes =
            ahorros[mes]?.reduce(
              (s, a) => s + Number(a.monto),
              0
            ) || 0;

          const tieneEstrella =
            ahorros[mes]?.some((a) => a.estrella);


          return (
            <div
              key={mes}
              className="bg-white rounded-2xl border-2 overflow-hidden"
            >

              {/* Botón para expandir o cerrar el mes */}
              <button
                onClick={() =>
                  setMesExpandido(
                    mesExpandido === mes ? null : mes
                  )
                }
                className={`w-full p-4 flex justify-between font-black ${
                  mes === nombreMesActual
                    ? "bg-alianza-amarillo text-alianza-azul"
                    : ""
                }`}
              >
                {mes} {tieneEstrella && "⭐"}{" "}
                {tieneSelloReal(mes) && "🏅"}

                <span>${totalMes}</span>
              </button>


              {/* Muestra los depósitos del mes seleccionado */}
              {mesExpandido === mes && (
                <div className="p-4">

                  {(ahorros[mes] || []).map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between py-2 border-b"
                    >

                      <div>
                        <p className="text-sm">
                          {a.fecha}
                        </p>

                        <p className="font-black">
                          ${a.monto}
                        </p>
                      </div>


                      {/* Editar y eliminar solo están disponibles
                          para el mes actual */}
                      {mes === nombreMesActual && (
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              iniciarEdicion(a)
                            }
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(a.id)
                            }
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


      {/* Formulario para registrar o editar un ahorro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white p-6 rounded-3xl w-full max-w-sm">

            <input
              type="date"
              value={formData.fecha}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fecha: e.target.value
                })
              }
              className="w-full p-3 border mb-2"
            />

            <input
              type="number"
              value={formData.monto}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monto: e.target.value
                })
              }
              className="w-full p-3 border mb-2"
            />

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
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


      {/* Modal cuando se obtiene un sello */}
      {mostrarSello && sinceSello && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

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

            <p className="text-gray-600 mt-2">
              Ahorraste ${sinceSello.monto} en {sinceSello.mes}
            </p>

            <button
              onClick={() => setMostrarSello(false)}
              className="w-full mt-4 bg-alianza-azul text-white py-2 rounded-lg font-semibold"
            >
              ¡Genial!
            </button>

          </div>
        </div>
      )}


      {/* Modal cuando se obtiene un diploma */}
      {mostrarDiploma && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <Confetti />

          <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center">

            <p className="text-5xl mb-2">🏆</p>

            <h3 className="text-xl font-black text-alianza-azul">
              ¡Diploma ganado!
            </h3>

            <p className="text-gray-600 mt-2">
              Completaste 3 sellos más. Descarga tu diploma en la sección de diplomas.
            </p>

            <button
              onClick={() => setMostrarDiploma(false)}
              className="w-full mt-4 bg-alianza-azul text-white py-2 rounded-lg font-semibold"
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