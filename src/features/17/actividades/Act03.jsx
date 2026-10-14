import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act03 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const MONTO_TOTAL = data?.montoInicial || 3500;
    const TIEMPO_POR_EVENTO = 20; // 20 segundos por evento
    const distribucion = data?.distribucionInicial;
    const eventos = data?.eventos || [];

    // Estados de control
    const [paso, setPaso] = useState(1); // 1: Presupuesto inicial, 2: Eventos uno a uno, 3: Resultados
    const [eventoActualIndex, setEventoActualIndex] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_POR_EVENTO);

    // Estado del Presupuesto Inicial
    const [presupuesto, setPresupuesto] = useState({
        ahorro: "",
        diversion: "",
        gastos: "",
        emergencias: "",
    });

    // Estado financiero acumulado durante la simulación
    const [estadoFinanciero, setEstadoFinanciero] = useState({
        ahorro: 0,
        diversion: 0,
        gastos: 0,
        emergencias: 0,
        gastadoTotal: 0,
    });

    const [respuestasEventos, setRespuestasEventos] = useState({});
    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act03-${rango}-${userId}`;

    // Cargar progreso previo
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
                        if (d.presupuesto) setPresupuesto(d.presupuesto);
                        if (d.estadoFinanciero) setEstadoFinanciero(d.estadoFinanciero);
                        if (d.respuestasEventos) setRespuestasEventos(d.respuestasEventos);
                        if (d.paso) setPaso(d.paso);
                        if (d.eventoActualIndex !== undefined) setEventoActualIndex(d.eventoActualIndex);
                        cargado = true;
                        setPaso(3);
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.presupuesto) setPresupuesto(d.presupuesto);
                        if (d.estadoFinanciero) setEstadoFinanciero(d.estadoFinanciero);
                        if (d.respuestasEventos) setRespuestasEventos(d.respuestasEventos);
                        if (d.paso) setPaso(d.paso);
                        if (d.eventoActualIndex !== undefined) setEventoActualIndex(d.eventoActualIndex);
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

    // Persistencia local
    useEffect(() => {
        if (cargandoProgreso) return;
        const datos = {
            presupuesto,
            estadoFinanciero,
            respuestasEventos,
            paso,
            eventoActualIndex,
        };
        localStorage.setItem(storageKey, JSON.stringify(datos));
    }, [presupuesto, estadoFinanciero, respuestasEventos, paso, eventoActualIndex, cargandoProgreso, storageKey]);

    // Lógica del Temporizador de 20s por evento
    useEffect(() => {
        if (paso !== 2 || eventoActualIndex >= eventos.length) return;

        setTiempoRestante(TIEMPO_POR_EVENTO);

        const interval = setInterval(() => {
            setTiempoRestante((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Si el tiempo se agota, seleccionar automáticamente la opción por defecto ("SÍ" / opción 0)
                    const eventoActual = eventos[eventoActualIndex];
                    if (eventoActual && eventoActual.opciones.length > 0) {
                        procesarOpcion(eventoActual, eventoActual.opciones[0]);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [paso, eventoActualIndex]);

    // Cálculos de presupuesto inicial
    const sumaPresupuesto =
        (Number(presupuesto.ahorro) || 0) +
        (Number(presupuesto.diversion) || 0) +
        (Number(presupuesto.gastos) || 0) +
        (Number(presupuesto.emergencias) || 0);

    const restantePresupuesto = MONTO_TOTAL - sumaPresupuesto;

    // Confirmar presupuesto inicial e iniciar simulación
    const handleIniciarSimulacion = () => {
        if (restantePresupuesto !== 0) return;
        setEstadoFinanciero({
            ahorro: Number(presupuesto.ahorro) || 0,
            diversion: Number(presupuesto.diversion) || 0,
            gastos: Number(presupuesto.gastos) || 0,
            emergencias: Number(presupuesto.emergencias) || 0,
            gastadoTotal: 0,
        });
        setEventoActualIndex(0);
        setPaso(2);
    };

    // Procesar respuesta del evento y avanzar al siguiente
    const procesarOpcion = (evento, opcion) => {
        setEstadoFinanciero((prev) => {
            let nuevoEstado = { ...prev };
            if (opcion.tipo === "gasto") {
                nuevoEstado[opcion.categoria] -= opcion.monto;
                nuevoEstado.gastadoTotal += opcion.monto;
            } else if (opcion.tipo === "ingreso") {
                nuevoEstado[opcion.destino] += opcion.monto;
            } else if (opcion.tipo === "gasto_emergencia") {
                nuevoEstado.emergencias -= opcion.monto;
                nuevoEstado.gastadoTotal += opcion.monto;
            }
            return nuevoEstado;
        });

        setRespuestasEventos((prev) => ({ ...prev, [evento.id]: opcion }));

        if (eventoActualIndex + 1 < eventos.length) {
            setEventoActualIndex((prev) => prev + 1);
        } else {
            setPaso(3); // Finalizar cuando se respondan todos
        }
    };

    const handleReset = () => {
        setPaso(1);
        setEventoActualIndex(0);
        setTiempoRestante(TIEMPO_POR_EVENTO);
        setPresupuesto({ ahorro: "", diversion: "", gastos: "", emergencias: "" });
        setEstadoFinanciero({ ahorro: 0, diversion: 0, gastos: 0, emergencias: 0, gastadoTotal: 0 });
        setRespuestasEventos({});
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        const datosAGuardar = {
            presupuesto,
            estadoFinanciero,
            respuestasEventos,
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

    const categoriasMapeo = distribucion?.categorias || [
        { id: "ahorro", label: "Ahorro" },
        { id: "diversion", label: "Diversión" },
        { id: "gastos", label: "Gastos necesarios" },
        { id: "emergencias", label: "Emergencias" },
    ];

    const eventoActual = eventos[eventoActualIndex];

    return (
        <LayoutActividad fondo={data?.fondo}>
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
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

            {/* Contenedor Principal */}
            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-8 max-w-3xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* Encabezado */}
                <div className="flex flex-col justify-between items-center">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase text-center">
                            {data?.titulo}
                        </h1>
                        <p className="text-medium text-blue-200 text-center">
                            Monto Inicial: ${MONTO_TOTAL}
                        </p>
                    </div>

                    {data?.imagen && (
                        <div className="flex justify-center my-4">
                            <img
                                src={data.imagen}
                                alt="Imagen"
                                className="max-h-48 object-contain animate-float-slow"
                            />
                        </div>
                    )}

                    {paso === 2 && (
                        <div className="bg-blue-950 px-4 py-2 rounded-2xl border-2 border-yellow-400 font-mono font-black text-yellow-300 text-xl shadow flex items-center gap-2 mt-2">
                            ⏱️ <span className={tiempoRestante <= 5 ? "text-red-400 animate-pulse" : ""}>{tiempoRestante}s</span>
                        </div>
                    )}
                </div>

                {/* PASO 1: INTRODUCCIÓN Y DISTRIBUCIÓN DEL DINERO */}
                {paso === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        {distribucion?.subtitulo && (
                            <h2 className="text-xl md:text-2xl font-black text-yellow-300 text-center uppercase">
                                {distribucion.subtitulo}
                            </h2>
                        )}

                        <p className="text-base md:text-lg font-medium text-blue-100 text-center">
                            {distribucion?.instruccion || data?.instruccionInicial}
                        </p>

                        {distribucion?.imagenDinero && (
                            <div className="flex justify-center my-4">
                                <img
                                    src={distribucion.imagenDinero}
                                    alt="Billetes $3,500"
                                    className="max-h-56 object-contain rounded-2xl shadow-md border-2 border-yellow-400/30 animate-float-slow"
                                />
                            </div>
                        )}

                        {distribucion?.pregunta && (
                            <p className="text-base md:text-lg font-bold text-center text-yellow-200">
                                {distribucion.pregunta}
                            </p>
                        )}

                        {distribucion?.indicacion && (
                            <h3 className="text-lg font-black text-center text-yellow-300 uppercase tracking-wide border-t border-blue-700/50 pt-4">
                                {distribucion.indicacion}
                            </h3>
                        )}

                        {/* Campos para repartir dinero */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categoriasMapeo.map((item) => (
                                <div key={item.id} className="bg-blue-950 p-4 rounded-xl border border-blue-700 space-y-2">
                                    <label className="font-bold text-yellow-300 text-sm md:text-base block">
                                        {item.label}:
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={presupuesto[item.id]}
                                            onChange={(e) =>
                                                setPresupuesto({ ...presupuesto, [item.id]: e.target.value })
                                            }
                                            placeholder="0"
                                            className="w-full bg-blue-900 text-white font-bold pl-8 pr-3 py-2 rounded-lg border border-blue-600 focus:outline-none focus:border-yellow-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Indicador de Estado del Presupuesto */}
                        <div className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row justify-between items-center font-bold text-center sm:text-left gap-2 ${
                            restantePresupuesto === 0
                                ? "bg-blue-950 border-green-400 text-green-400"
                                : restantePresupuesto > 0
                                ? "bg-blue-950 border-yellow-400 text-yellow-300"
                                : "bg-red-950/80 border-red-500 text-red-300"
                        }`}>
                            <div>
                                <span className="block text-sm opacity-90">Por asignar:</span>
                                <span className="text-2xl font-black">${restantePresupuesto}</span>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold">
                                {restantePresupuesto === 0 && "¡Excelente! Has distribuido exactamente todo el dinero."}
                                {restantePresupuesto > 0 && `Te falta asignar $${restantePresupuesto} para comenzar.`}
                                {restantePresupuesto < 0 && `Te has excedido por $${Math.abs(restantePresupuesto)}.`}
                            </div>
                        </div>

                        <button
                            onClick={handleIniciarSimulacion}
                            disabled={restantePresupuesto !== 0}
                            className={`w-full py-4 text-2xl font-black rounded-full shadow-xl transition transform uppercase ${
                                restantePresupuesto !== 0
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-60"
                                    : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                            }`}
                        >
                            🚀 Comenzar Simulación
                        </button>
                    </div>
                )}

                {/* PASO 2: EVENTOS (UNO A UNO CON 20 SEGUNDOS CADA UNO) */}
                {paso === 2 && eventoActual && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center text-sm text-yellow-300 font-bold uppercase">
                            <span>Evento {eventoActualIndex + 1} de {eventos.length}</span>
                            <span>Aviso: Si no contestas se elegirá la primera opción</span>
                        </div>

                        {/* Barra de progreso de eventos */}
                        <div className="w-full bg-blue-950 h-3 rounded-full overflow-hidden border border-blue-700">
                            <div
                                className="bg-yellow-400 h-full transition-all duration-300"
                                style={{ width: `${((eventoActualIndex + 1) / eventos.length) * 100}%` }}
                            ></div>
                        </div>

                        {/* Tarjeta del Evento Actual */}
                        <div className="bg-blue-950 p-6 rounded-2xl border-2 border-yellow-400 space-y-6 shadow-xl text-center">
                            {eventoActual.imagen && (
                                <img
                                    src={eventoActual.imagen}
                                    alt={eventoActual.titulo}
                                    className="w-32 h-32 object-contain mx-auto rounded-2xl border-2 border-yellow-400/40 bg-white/10 p-2"
                                />
                            )}
                            <div>
                                <h3 className="font-black text-yellow-300 text-xl md:text-2xl uppercase mb-2">
                                    {eventoActual.titulo}
                                </h3>
                                <p className="text-base text-blue-100">{eventoActual.descripcion}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-blue-800">
                                {eventoActual.opciones.map((opc, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => procesarOpcion(eventoActual, opc)}
                                        className="py-4 px-6 rounded-xl font-black text-base bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 transition active:scale-95 shadow-md uppercase"
                                    >
                                        {opc.texto}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 3: RESUMEN FINAL CON DISTRIBUCIÓN CONSERVADA */}
                {paso === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-yellow-400 text-blue-950 p-6 rounded-2xl border-4 border-yellow-500 space-y-6 shadow-xl">
                            <h3 className="font-black text-2xl uppercase border-b border-blue-950/20 pb-2 text-center">
                                RESULTADO FINAL DEL MES
                            </h3>

                            {/* Resumen de gastos y saldo inicial */}
                            <div className="bg-blue-950/10 p-4 rounded-xl space-y-2 font-bold text-base md:text-lg">
                                <p className="flex justify-between">
                                    <span>💵 Dinero inicial:</span>
                                    <span className="font-black">${MONTO_TOTAL}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span>💸 Gastaste en total:</span>
                                    <span className="font-black text-red-800">${estadoFinanciero.gastadoTotal}</span>
                                </p>
                            </div>

                            {/* Comparativo de Distribución Inicial vs Balance Final */}
                            <div className="space-y-3">
                                <h4 className="font-black text-sm uppercase tracking-wider text-blue-900 border-b border-blue-950/20 pb-1">
                                    📊 Tu Presupuesto Inicial vs Balance Final
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold">
                                    <div className="bg-white/40 p-3 rounded-lg border border-blue-950/10">
                                        <span className="block text-xs uppercase opacity-75">Ahorro</span>
                                        <p>Asignado: <span className="font-black">${presupuesto.ahorro || 0}</span></p>
                                        <p className="text-blue-950 font-black">Restante: ${estadoFinanciero.ahorro}</p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-lg border border-blue-950/10">
                                        <span className="block text-xs uppercase opacity-75">Diversión</span>
                                        <p>Asignado: <span className="font-black">${presupuesto.diversion || 0}</span></p>
                                        <p className="text-blue-950 font-black">Restante: ${estadoFinanciero.diversion}</p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-lg border border-blue-950/10">
                                        <span className="block text-xs uppercase opacity-75">Gastos Necesarios</span>
                                        <p>Asignado: <span className="font-black">${presupuesto.gastos || 0}</span></p>
                                        <p className="text-blue-950 font-black">Restante: ${estadoFinanciero.gastos}</p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-lg border border-blue-950/10">
                                        <span className="block text-xs uppercase opacity-75">Emergencias</span>
                                        <p>Asignado: <span className="font-black">${presupuesto.emergencias || 0}</span></p>
                                        <p className="text-blue-950 font-black">Restante: ${estadoFinanciero.emergencias}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm font-semibold italic border-t border-blue-950/20 pt-3 text-center">
                                "La libertad de manejar tu dinero también implica aprender a administrarlo."
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={handleReset}
                                className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-98 transition-all"
                            >
                                Reiniciar
                            </button>
                            <button
                                onClick={handleContinue}
                                className="py-4 rounded-full font-black text-xl shadow-md transition-all uppercase bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-102 active:scale-98"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </LayoutActividad>
    );
};

export default Act03;