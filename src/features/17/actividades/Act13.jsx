import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act13 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para las selecciones
    const [checksAcompanamiento, setChecksAcompanamiento] = useState([]);
    const [checksLogros, setChecksLogros] = useState([]);
    const [checksPeticiones, setChecksPeticiones] = useState([]);

    const [cargandoProgreso, setCargandoProgreso] = useState(true);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act13-${rango}-${userId}`;

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
                        if (d.checksAcompanamiento) setChecksAcompanamiento(d.checksAcompanamiento);
                        if (d.checksLogros) setChecksLogros(d.checksLogros);
                        if (d.checksPeticiones) setChecksPeticiones(d.checksPeticiones);
                        cargado = true;
                    }
                }

                if (!cargado) {
                    const local = localStorage.getItem(storageKey);
                    if (local) {
                        const d = JSON.parse(local);
                        if (d.checksAcompanamiento) setChecksAcompanamiento(d.checksAcompanamiento);
                        if (d.checksLogros) setChecksLogros(d.checksLogros);
                        if (d.checksPeticiones) setChecksPeticiones(d.checksPeticiones);
                    }
                }
            } catch (err) {
                console.warn("Error cargando progreso:", err);
            } finally {
                setCargandoProgreso(false);
            }
        };

        cargarProgreso();
    }, [data?.id, userId, storageKey]);

    // Manejar selección múltiple genérica
    const handleToggleCheck = (list, setList, id) => {
        const nuevaLista = list.includes(id)
            ? list.filter((item) => item !== id)
            : [...list, id];
        setList(nuevaLista);

        const guardado = {
            checksAcompanamiento: setList === setChecksAcompanamiento ? nuevaLista : checksAcompanamiento,
            checksLogros: setList === setChecksLogros ? nuevaLista : checksLogros,
            checksPeticiones: setList === setChecksPeticiones ? nuevaLista : checksPeticiones,
        };
        localStorage.setItem(storageKey, JSON.stringify(guardado));
    };

    // Reiniciar selecciones
    const handleReset = () => {
        setChecksAcompanamiento([]);
        setChecksLogros([]);
        setChecksPeticiones([]);
        localStorage.removeItem(storageKey);
    };

    // Finalizar todo el módulo
    const handleContinue = async () => {
        const datosAGuardar = {
            checksAcompanamiento,
            checksLogros,
            checksPeticiones,
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

    // Al menos 1 casilla marcada por cada una de las 3 dinámicas
    const todoCompletado =
        checksAcompanamiento.length > 0 &&
        checksLogros.length > 0 &&
        checksPeticiones.length > 0;

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

            {/* Contenedor Principal (Actividad Impar: Contenedor Azul Oscuro) */}
            <div className="bg-blue-900/95 p-6 md:p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl space-y-10 max-w-4xl mx-auto text-white backdrop-blur-md" translate="no">

                {/* SECCIÓN 1: ESTACIÓN */}
                {data?.titulo && (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 bg-blue-950/80 px-6 py-3 rounded-full border border-yellow-400/50 w-fit mx-auto shadow-md">
                            <h1 className="text-xl md:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                                {data.titulo}
                            </h1>
                        </div>

                        {data?.descripcionEstacion && (
                            <p className="text-base md:text-lg font-medium text-blue-100 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
                                {data.descripcionEstacion}
                            </p>
                        )}

                        {data?.imagenEstacion && (
                            <img
                                src={data.imagenEstacion}
                                alt="Futuro y metas"
                                className="max-h-80 object-contain mx-auto animate-float-slow rounded-2xl"
                            />
                        )}
                    </div>
                )}

                {/* SECCIÓN 2: ACOMPAÑAMIENTO DE LA COOPERATIVA */}
                {data?.actividadAcompanamiento && (
                    <div className="space-y-6">
                        <div className="bg-white text-blue-950 p-6 rounded-3xl border-4 border-yellow-400 shadow-xl text-center space-y-2">
                            <h2 className="text-xl md:text-2xl font-black text-blue-900 uppercase">
                                {data.actividadAcompanamiento.titulo}
                            </h2>
                            <p className="text-sm md:text-base font-semibold text-slate-700">
                                {data.actividadAcompanamiento.instrucciones}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.actividadAcompanamiento.opciones?.map((opc) => {
                                const checked = checksAcompanamiento.includes(opc.id);
                                return (
                                    <button
                                        key={opc.id}
                                        type="button"
                                        onClick={() => handleToggleCheck(checksAcompanamiento, setChecksAcompanamiento, opc.id)}
                                        className={`p-4 rounded-2xl border-2 font-bold text-sm text-left transition-all flex items-center gap-3 shadow ${
                                            checked
                                                ? "bg-yellow-400 text-blue-950 border-yellow-500 scale-102 font-black"
                                                : "bg-blue-950 text-white border-blue-700 hover:border-yellow-400"
                                        }`}
                                    >
                                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black border flex-shrink-0 ${
                                            checked ? "bg-blue-950 text-yellow-300 border-blue-950" : "bg-blue-900 border-blue-600"
                                        }`}>
                                            {checked ? "✓" : ""}
                                        </span>
                                        <span>{opc.texto}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 3: VIAJA AL FUTURO */}
                {data?.viajaAlFuturo && (
                    <div className="space-y-8">
                        <div className="bg-yellow-400 text-blue-950 p-6 rounded-3xl border-4 border-yellow-500 shadow-xl text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black uppercase">
                                {data.viajaAlFuturo.titulo}
                            </h2>
                            <p className="text-base font-bold">
                                {data.viajaAlFuturo.subtitulo}
                            </p>
                        </div>

                        {/* PARTE 1: LOGROS A LOS 25 AÑOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            {data.viajaAlFuturo.imagenEspejo && (
                                <img
                                    src={data.viajaAlFuturo.imagenEspejo}
                                    alt="Hablando con tu yo del futuro"
                                    className="max-h-80 object-contain mx-auto rounded-3xl animate-float-slow"
                                />
                            )}

                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-yellow-300 uppercase border-b border-blue-700/50 pb-2">
                                    Selecciona lo que te gustaría lograr:
                                </h3>
                                <div className="space-y-2">
                                    {data.viajaAlFuturo.opcionesLogros?.map((opc) => {
                                        const checked = checksLogros.includes(opc.id);
                                        return (
                                            <button
                                                key={opc.id}
                                                type="button"
                                                onClick={() => handleToggleCheck(checksLogros, setChecksLogros, opc.id)}
                                                className={`w-full p-3 rounded-xl border-2 font-bold text-xs md:text-sm text-left transition-all flex items-center gap-3 shadow ${
                                                    checked
                                                        ? "bg-yellow-400 text-blue-950 border-yellow-500 font-black"
                                                        : "bg-blue-950 text-white border-blue-700 hover:border-yellow-400"
                                                }`}
                                            >
                                                <span className={`w-5 h-5 rounded flex items-center justify-center font-black border flex-shrink-0 ${
                                                    checked ? "bg-blue-950 text-yellow-300" : "bg-blue-900 border-blue-600"
                                                }`}>
                                                    {checked ? "✓" : ""}
                                                </span>
                                                <span>{opc.texto}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                         {/* PARTE 2: QUÉ TE PEDIRÍA TU YO DE 25 AÑOS */}
                        <div className="bg-white text-blue-950 p-6 rounded-3xl border-4 border-yellow-400 shadow-xl space-y-4">
                            <h3 className="text-base md:text-lg font-black text-blue-900 text-center leading-relaxed">
                                {data.viajaAlFuturo.subtituloSegundaParte}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-yellow-300 uppercase border-b border-blue-700/50 pb-2">
                                    Selecciona lo que crees que pediría:
                                </h3>
                                <div className="space-y-2">
                                    {data.viajaAlFuturo.opcionesPeticiones?.map((opc) => {
                                        const checked = checksPeticiones.includes(opc.id);
                                        return (
                                            <button
                                                key={opc.id}
                                                type="button"
                                                onClick={() => handleToggleCheck(checksPeticiones, setChecksPeticiones, opc.id)}
                                                className={`w-full p-3 rounded-xl border-2 font-bold text-xs md:text-sm text-left transition-all flex items-center gap-3 shadow ${
                                                    checked
                                                        ? "bg-yellow-400 text-blue-950 border-yellow-500 font-black"
                                                        : "bg-blue-950 text-white border-blue-700 hover:border-yellow-400"
                                                }`}
                                            >
                                                <span className={`w-5 h-5 rounded flex items-center justify-center font-black border flex-shrink-0 ${
                                                    checked ? "bg-blue-950 text-yellow-300" : "bg-blue-900 border-blue-600"
                                                }`}>
                                                    {checked ? "✓" : ""}
                                                </span>
                                                <span>{opc.texto}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {data.viajaAlFuturo.imagenEspejo2 && (
                                <img
                                    src={data.viajaAlFuturo.imagenEspejo2}
                                    alt="Hablando con tu yo del futuro"
                                    className="max-h-80 object-contain mx-auto rounded-3xl animate-float-slow"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 4: MENSAJE FINAL DEL MÓDULO */}
                {todoCompletado && data?.mensajeFinal && (
                    <div className="bg-blue-950 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {data.mensajeFinal.imagen && (
                            <img
                                src={data.mensajeFinal.imagen}
                                alt="Tu futuro comienza hoy"
                                className="max-h-52 object-contain animate-bounce-gentle"
                            />
                        )}
                        <div className="space-y-3">
                            <h3 className="text-2xl md:text-3xl font-black text-yellow-300 uppercase">
                                {data.mensajeFinal.titulo}
                            </h3>
                            <p className="text-base md:text-lg font-medium text-blue-100 leading-relaxed">
                                {data.mensajeFinal.mensaje}
                            </p>
                        </div>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (REINICIAR Y CONCLUIR MÓDULO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all uppercase"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!todoCompletado}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all uppercase ${
                            !todoCompletado
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-yellow-400 text-blue-950 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </LayoutActividad>
    );
};

export default Act13;