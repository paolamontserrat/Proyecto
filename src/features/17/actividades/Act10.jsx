import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act11 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para el Reto Checkbox
    const [checksReto, setChecksReto] = useState([]);

    // Estados para la Solicitud Demostrativa
    const [solicitud, setSolicitud] = useState({
        nombre: "",
        edad: "",
        telefono: "",
        domicilio: "",
        necesidad: "",
        otroNecesidad: "",
        montoNecesitas: "",
        montoPagoMensual: "",
        tieneIngreso: "",
        origenIngreso: "",
        otroOrigenIngreso: "",
    });

    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act11-${rango}-${userId}`;

    // Cargar progreso guardado
    useEffect(() => {
        const cargarProgreso = async () => {
            if (!data?.id) {
                setCargandoProgreso(false);
                return;
            }

            try {
                let cargado = false;
                if (userId !== "anon") {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("completada, datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", data.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const d = progreso.datos_actividad;
                        if (d.checksReto) setChecksReto(d.checksReto);
                        if (d.solicitud) setSolicitud(d.solicitud);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.checksReto) setChecksReto(d.checksReto);
                        if (d.solicitud) setSolicitud(d.solicitud);
                    }
                }
            } catch (err) {
                console.warn("Error cargando datos:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Manejar selección de checkboxes del reto
    const handleToggleCheck = (id) => {
        const nuevos = checksReto.includes(id)
            ? checksReto.filter((item) => item !== id)
            : [...checksReto, id];
        setChecksReto(nuevos);

        localStorage.setItem(
            storageKey,
            JSON.stringify({ checksReto: nuevos, solicitud })
        );
    };

    // Manejar cambios en la solicitud demostrativa
    const handleSolicitudChange = (field, value) => {
        const nuevaSolicitud = { ...solicitud, [field]: value };
        setSolicitud(nuevaSolicitud);

        localStorage.setItem(
            storageKey,
            JSON.stringify({ checksReto, solicitud: nuevaSolicitud })
        );
    };

    // Reiniciar datos
    const handleReset = () => {
        setChecksReto([]);
        setSolicitud({
            nombre: "",
            edad: "",
            telefono: "",
            domicilio: "",
            necesidad: "",
            otroNecesidad: "",
            montoNecesitas: "",
            montoPagoMensual: "",
            tieneIngreso: "",
            origenIngreso: "",
            otroOrigenIngreso: "",
        });
        localStorage.removeItem(storageKey);
    };

    // Finalizar y guardar en Supabase
    const handleContinue = async () => {
        const datosAGuardar = {
            checksReto,
            solicitud,
            completada: true,
        };

        if (userId !== "anon" && data?.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: data.id,
                        datos_actividad: datosAGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando en Supabase:", err);
            }
        }

        onComplete();
    };

    const totalOpcionesReto = data?.reto?.opciones?.length || 6;
    const retoCompletado = checksReto.length === totalOpcionesReto;
    const solicitudCompleta = 
        solicitud.nombre.trim() !== "" &&
        solicitud.edad.trim() !== "" &&
        solicitud.telefono.trim() !== "" &&
        solicitud.domicilio.trim() !== "" &&
        solicitud.necesidad !== "" &&
        solicitud.montoNecesitas !== "" &&
        solicitud.montoPagoMensual !== "" &&
        solicitud.tieneIngreso !== "";

    const todoCompletado = checksReto.length === totalOpcionesReto && solicitudCompleta;

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="bg-azul-oscuro text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-azul-oscuro text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-amber-400/95 p-6 md:p-10 rounded-3xl border-4 border-alianza-azul shadow-2xl space-y-10 max-w-3xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN */}
                {data?.titulo && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Impulso"
                                className="max-h-72 object-contain mx-auto animate-float-slow"
                            />
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: REFLEXIÓN SOBRE FINANCIAMIENTO */}
                {data?.reflexion && (
                    <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl space-y-6">
                        <p className="text-base md:text-lg font-medium leading-relaxed whitespace-pre-line text-slate-800">
                            {data.reflexion.texto}
                        </p>

                        {data.reflexion.imagen && (
                            <div className="flex justify-center">
                                <img
                                    src={data.reflexion.imagen}
                                    alt="Reflexión"
                                    className="max-h-56 object-contain animate-bounce-gentle"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN 3: RETO ¿LO PEDIRÍAS? */}
                {data?.reto && (
                    <div className="space-y-6">
                        <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-xl space-y-4 text-center">
                            {data.reto.imagen && (
                                <img
                                    src={data.reto.imagen}
                                    alt="Computadora"
                                    className="max-h-48 object-contain mx-auto mb-2 animate-float-slow"
                                />
                            )}
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-600 uppercase">
                                {data.reto.titulo}
                            </h2>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 font-bold text-sm md:text-base space-y-1 text-blue-950">
                                <p>{data.reto.descripcion}</p>
                                <p className="text-blue-900">Precio: <span className="font-black">${data.reto.precio?.toLocaleString()}</span></p>
                                <p className="text-emerald-700">Tienes ahorrados: <span className="font-black">${data.reto.ahorrado?.toLocaleString()}</span></p>
                                <p className="text-red-600">Te faltan: <span className="font-black">${data.reto.faltante?.toLocaleString()}</span></p>
                            </div>

                            <p className="text-base md:text-lg font-bold text-blue-900">
                                {data.reto.pregunta}
                            </p>

                            {/* Checkboxes de Opciones */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                                {data.reto.opciones?.map((opc) => {
                                    const checked = checksReto.includes(opc.id);
                                    return (
                                        <button
                                            key={opc.id}
                                            type="button"
                                            onClick={() => handleToggleCheck(opc.id)}
                                            className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-3 shadow ${
                                                checked
                                                    ? "bg-yellow-400 text-blue-950 border-yellow-500 scale-102"
                                                    : "bg-blue-950 text-white border-blue-700 hover:border-yellow-400"
                                            }`}
                                        >
                                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black border ${
                                                checked ? "bg-blue-950 text-yellow-300 border-blue-950" : "bg-blue-900 border-blue-600"
                                            }`}>
                                                {checked ? "✓" : ""}
                                            </span>
                                            <span>{opc.texto}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Mensaje al marcar todas las opciones */}
                            {retoCompletado && (
                                <div className="bg-yellow-400 text-blue-950 p-5 rounded-2xl border-2 border-yellow-500 font-bold text-sm md:text-base whitespace-pre-line animate-bounce-gentle mt-4 shadow-md">
                                    {data.reto.conclusion}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 4: SOLICITUD DEMOSTRATIVA */}
                {data?.solicitudDemo && (
                    <div className="bg-white text-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-6">
                        <div className="text-center space-y-2 border-b border-slate-200 pb-4">
                            <h3 className="text-xl md:text-2xl font-black text-blue-900 uppercase">
                                {data.solicitudDemo.titulo}
                            </h3>
                            <p className="text-sm md:text-base font-semibold text-slate-600">
                                {data.solicitudDemo.subtitulo}
                            </p>
                        </div>

                        {/* Formulario */}
                        <div className="space-y-5 text-sm md:text-base font-bold">
                            {/* 1. Datos personales */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <h4 className="text-blue-900 font-black text-lg">1. Datos personales</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500">Nombre:</label>
                                        <input
                                            type="text"
                                            value={solicitud.nombre}
                                            onChange={(e) => handleSolicitudChange("nombre", e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500">Edad:</label>
                                        <input
                                            type="text"
                                            value={solicitud.edad}
                                            onChange={(e) => handleSolicitudChange("edad", e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500">Teléfono:</label>
                                        <input
                                            type="text"
                                            value={solicitud.telefono}
                                            onChange={(e) => handleSolicitudChange("telefono", e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500">Domicilio:</label>
                                        <input
                                            type="text"
                                            value={solicitud.domicilio}
                                            onChange={(e) => handleSolicitudChange("domicilio", e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. ¿Para qué necesitas el crédito? */}
                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <h4 className="text-blue-900 font-black text-lg">2. ¿Para qué necesitas el crédito?</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {data.solicitudDemo.opcionesNecesidad?.map((opc, idx) => (
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer font-semibold">
                                            <input
                                                type="radio"
                                                name="necesidad"
                                                value={opc}
                                                checked={solicitud.necesidad === opc}
                                                onChange={(e) => handleSolicitudChange("necesidad", e.target.value)}
                                                className="accent-yellow-500 w-4 h-4"
                                            />
                                            <span>{opc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 3 y 4. Montos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                                    <h4 className="text-blue-900 font-black text-base">3. ¿Cuánto necesitas?</h4>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={solicitud.montoNecesitas}
                                            onChange={(e) => handleSolicitudChange("montoNecesitas", e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                                    <h4 className="text-blue-900 font-black text-base">4. ¿Cuánto puedes pagar al mes?</h4>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={solicitud.montoPagoMensual}
                                            onChange={(e) => handleSolicitudChange("montoPagoMensual", e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5. ¿Tienes algún ingreso? */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <h4 className="text-blue-900 font-black text-lg">5. ¿Tienes algún ingreso?</h4>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                                        <input
                                            type="radio"
                                            name="tieneIngreso"
                                            value="Sí"
                                            checked={solicitud.tieneIngreso === "Sí"}
                                            onChange={(e) => handleSolicitudChange("tieneIngreso", e.target.value)}
                                            className="accent-yellow-500 w-4 h-4"
                                        />
                                        <span>Sí</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                                        <input
                                            type="radio"
                                            name="tieneIngreso"
                                            value="No"
                                            checked={solicitud.tieneIngreso === "No"}
                                            onChange={(e) => handleSolicitudChange("tieneIngreso", e.target.value)}
                                            className="accent-yellow-500 w-4 h-4"
                                        />
                                        <span>No</span>
                                    </label>
                                </div>

                                {solicitud.tieneIngreso === "Sí" && (
                                    <div className="pt-2 border-t border-slate-200 space-y-2">
                                        <p className="text-xs uppercase text-slate-500">¿De dónde proviene?</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {data.solicitudDemo.opcionesIngreso?.map((opc, idx) => (
                                                <label key={idx} className="flex items-center gap-2 cursor-pointer font-semibold">
                                                    <input
                                                        type="radio"
                                                        name="origenIngreso"
                                                        value={opc}
                                                        checked={solicitud.origenIngreso === opc}
                                                        onChange={(e) => handleSolicitudChange("origenIngreso", e.target.value)}
                                                        className="accent-yellow-500 w-4 h-4"
                                                    />
                                                    <span>{opc}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs font-bold text-center text-slate-400 italic">
                                {data.solicitudDemo.aviso}
                            </p>
                        </div>
                    </div>
                )}

                {/* SECCIÓN 5: TIP FINANCIERO */}
                {todoCompletado && data?.tipFinanciero && (
                    <div className="bg-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {data.tipFinanciero.imagen && (
                            <img
                                src={data.tipFinanciero.imagen}
                                alt="Tip Financiero"
                                className="max-h-44 object-contain animate-gentle-bounce"
                            />
                        )}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-yellow-300 uppercase">
                                {data.tipFinanciero.titulo}
                            </h3>
                            <p className="text-base md:text-lg font-medium text-blue-100 leading-relaxed">
                                {data.tipFinanciero.mensaje}
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y FINALIZAR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!todoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all uppercase ${
                            !todoCompletado
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul border-2 border-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act11;