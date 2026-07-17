import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act04 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();

    // Estados para las entradas de usuario
    const [reflexion, setReflexion] = useState("");
    const [queQuiero, setQueQuiero] = useState("");
    const [cuantoCuesta, setCuantoCuesta] = useState("");
    const [paraCuando, setParaCuando] = useState("");
    const [semanas, setSemanas] = useState("");
    const [error, setError] = useState("");

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act04-${rango}-${userId}`;

    // Cargar progreso guardado al montar con llaves homologadas correctamente
    useEffect(() => {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            try {
                const parsed = JSON.parse(guardado);
                if (parsed.reflexion) setReflexion(parsed.reflexion);
                if (parsed.queQuiero) setQueQuiero(parsed.queQuiero);
                if (parsed.cuantoCuesta) setCuantoCuesta(parsed.cuantoCuesta);
                if (parsed.paraCuando) setParaCuando(parsed.paraCuando);
                if (parsed.semanas) setSemanas(parsed.semanas);
            } catch (e) {
                console.error("Error al cargar progreso local", e);
            }
        }
    }, []);

    // Efecto para calcular de forma automática las semanas a partir de la fecha seleccionada
    useEffect(() => {
        if (paraCuando) {
            const fechaSeleccionada = new Date(paraCuando);
            const fechaHoy = new Date();
            fechaHoy.setHours(0, 0, 0, 0);

            const diferenciaTiempo = fechaSeleccionada.getTime() - fechaHoy.getTime();

            if (diferenciaTiempo > 0) {
                const diferenciaDias = diferenciaTiempo / (1000 * 60 * 60 * 24);
                const semanasCalculadas = Math.ceil(diferenciaDias / 7);
                setSemanas(semanasCalculadas.toString());
            } else {
                setSemanas("");
            }
        } else {
            setSemanas("");
        }
    }, [paraCuando]);

    const costoNum = parseFloat(cuantoCuesta) || 0;
    const semanasNum = parseInt(semanas) || 0;

    const ahorroSemanal = (costoNum > 0 && semanasNum > 0) 
        ? (costoNum / semanasNum).toFixed(2) 
        : "0.00";

    // Validación interactiva en tiempo real
    useEffect(() => {
        setError("");

        if (reflexion && reflexion.trim().length < 3) {
            setError("Por favor, escribe una respuesta más detallada en tu reflexión de 6 meses.");
            return;
        }

        if (queQuiero && queQuiero.trim().length < 3) {
            setError("Describe de forma más clara qué meta quieres lograr.");
            return;
        }

        if (cuantoCuesta && costoNum <= 0) {
            setError("El costo aproximado de tu meta debe ser un número mayor a $0.");
            return;
        }

        if (paraCuando) {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            const seleccionada = new Date(paraCuando);
            if (seleccionada <= hoy) {
                setError("La fecha para lograr tu meta debe ser posterior al día de hoy.");
                return;
            }
        }

        if (semanas && semanasNum <= 0) {
            setError("El tiempo para lograr tu meta debe ser de al menos 1 semana.");
            return;
        }
    }, [reflexion, queQuiero, cuantoCuesta, paraCuando, semanas, costoNum, semanasNum]);

    const formularioValido = 
        reflexion.trim() !== "" && 
        queQuiero.trim() !== "" && 
        costoNum > 0 && 
        paraCuando.trim() !== "" && 
        semanasNum > 0 && 
        !error;

    // Guardar en Supabase / LocalStorage
    const guardarProgreso = async (datos) => {
        const datosAGuardar = datos || {
            reflexion,
            queQuiero,       
            cuantoCuesta,   
            paraCuando,
            semanas: semanasNum,
            ahorroSemanalRequerido: parseFloat(ahorroSemanal)
        };

        localStorage.setItem(storageKey, JSON.stringify(datosAGuardar));

        if (userId !== "anon" && data.id) {
            try {
                await supabase
                    .from("progreso_actividades")
                    .upsert(
                        {
                            usuario_id: userId,
                            actividad_id: data.id,
                            datos_actividad: datosAGuardar,
                            completada: true,
                        },
                        {
                            onConflict: "usuario_id,actividad_id",
                        }
                    );
            } catch {
                console.warn("Offline, se sincroniza después");
            }
        }
    };

    // Auto-guardado de conectividad offline-online
    useEffect(() => {
        const handleOnline = () => guardarProgreso();
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [data.id, reflexion, queQuiero, cuantoCuesta, paraCuando, semanasNum]);

    const handleReset = () => {
        setReflexion("");
        setQueQuiero("");
        setCuantoCuesta("");
        setParaCuando("");
        setSemanas("");
        setError("");
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!formularioValido) {
            setError("Por favor, llena todos los campos correctamente antes de finalizar.");
            return;
        }

        const datosCompletos = {
            reflexion,
            queQuiero,
            cuantoCuesta,
            paraCuando,
            semanas: semanasNum,
            ahorroSemanalRequerido: parseFloat(ahorroSemanal)
        };

        await guardarProgreso(datosCompletos);
        onComplete();
    };

    return (
        <LayoutActividad fondo={data.fondo}>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onBack}
                    className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition"
                >
                    🏠 Inicio
                </button>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl" translate="no">
                <h1 className="text-center font-extrabold text-blue-900 mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2.3rem)" }}>
                    {data?.titulo || "Te invito a que realices tu propio presupuesto..."}
                </h1>

                {data.secciones?.infoMetas && (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-6 mb-8">
                        <div className="space-y-3">
                            <p className="text-xl font-bold text-blue-900">{data.secciones.infoMetas.encabezado}</p>
                            <p className="text-lg font-extrabold text-sky-600">{data.secciones.infoMetas.subtitulo}</p>
                            <div className="space-y-3">
                                {data.secciones.infoMetas.puntos?.map((punto, index) => (
                                    <div key={index} className="flex items-start">
                                        <span className="text-yellow-400 text-2xl mr-3 select-none">⭐</span>
                                        <p className="text-lg font-semibold text-gray-700">{punto}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {data.secciones?.reflexion && (
                    <div className="bg-yellow-50/50 border-2 border-yellow-200 rounded-3xl p-6 mb-8">
                        <h2 className="text-xl font-black text-blue-900 mb-4 text-center">{data.secciones.reflexion.titulo}</h2>
                        <p className="text-center text-gray-700 font-bold mb-4 text-lg">{data.secciones.reflexion.pregunta}</p>
                        <input
                            type="text"
                            placeholder={data.secciones.reflexion.placeholder}
                            value={reflexion}
                            onChange={(e) => setReflexion(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-yellow-300 focus:border-yellow-500 focus:outline-none text-center font-semibold text-gray-800 shadow-inner"
                        />
                    </div>
                )}

                {data.secciones?.disciplina && (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 mb-10">
                        <p className="text-center font-bold text-blue-900 text-lg mb-3">{data.secciones.disciplina.textoPrincipal}</p>
                        <p className="text-center font-extrabold text-sky-600 text-md mb-4">{data.secciones.disciplina.subtitulo}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 font-semibold text-sm">
                            {data.secciones.disciplina.ejemplos.map((ejemplo, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                                    <span className="text-xl select-none">✨</span>
                                    <p>{ejemplo}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.secciones?.ligaMeta && (
                    <div className="border-t-4 border-dashed border-gray-200 pt-8 mb-10">
                        <h2 className="text-center text-2xl font-black text-blue-900 mb-6 bg-sky-100 py-3 rounded-2xl">
                            {data.secciones.ligaMeta.titulo}
                        </h2>
                        <p className="font-bold text-gray-700 text-center mb-6">{data.secciones.ligaMeta.descripcion}</p>

                        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
                            <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 shadow-sm">
                                <label className="block text-blue-900 font-extrabold mb-2 text-center">
                                    {data.secciones.ligaMeta.campos.que.label}
                                </label>
                                <input
                                    type="text"
                                    placeholder={data.secciones.ligaMeta.campos.que.placeholder}
                                    value={queQuiero}
                                    onChange={(e) => setQueQuiero(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-gray-700 text-sm"
                                />
                            </div>

                            <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 shadow-sm">
                                <label className="block text-blue-900 font-extrabold mb-2 text-center">
                                    {data.secciones.ligaMeta.campos.cuanto.label}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder={data.secciones.ligaMeta.campos.cuanto.placeholder}
                                        value={cuantoCuesta}
                                        onChange={(e) => setCuantoCuesta(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-gray-700 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 shadow-sm">
                                <label className="block text-blue-900 font-extrabold mb-2 text-center">
                                    {data.secciones.ligaMeta.campos.cuando.label}
                                </label>
                                <input
                                    type="date"
                                    value={paraCuando}
                                    onChange={(e) => setParaCuando(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none text-center font-semibold text-gray-700 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {data.secciones?.tarjetaFinal && (
                    <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="space-y-4 flex-1">
                            <h3 className="text-2xl font-black tracking-wide border-b-2 border-white/30 pb-2">{data.secciones.tarjetaFinal.titulo}</h3>
                            <div className="space-y-2 font-bold text-lg">
                                <p>{data.secciones.tarjetaFinal.metaTexto} <span className="bg-white/20 px-3 py-1 rounded-lg ml-2 font-black text-white">{queQuiero || data.secciones.tarjetaFinal.metaPlaceholder}</span></p>
                                <p>{data.secciones.tarjetaFinal.costoTexto} <span className="bg-white/20 px-3 py-1 rounded-lg ml-2 font-black text-white">${costoNum > 0 ? costoNum.toLocaleString() : "0.00"}</span></p>
                                <div className="flex items-center gap-2 mt-4">
                                    <span>{data.secciones.tarjetaFinal.tiempoTexto}</span>
                                    <input
                                        type="number"
                                        placeholder={data.secciones.tarjetaFinal.tiempoInputPlaceholder}
                                        value={semanas}
                                        readOnly
                                        className="w-24 px-2 py-1 text-center rounded-lg text-blue-900 font-black border-2 border-white bg-white/90 focus:outline-none text-md"
                                    />
                                    <span>{data.secciones.tarjetaFinal.tiempoSufijo}</span>
                                </div>
                            </div>

                            {semanasNum > 0 && costoNum > 0 && (
                                <div className="mt-4 bg-yellow-400 text-blue-900 rounded-2xl p-4 font-black text-center shadow-md animate-pulse">
                                    {data.secciones.tarjetaFinal.calculoExito} <span className="text-2xl block text-red-600">${ahorroSemanal} {data.secciones.tarjetaFinal.calculoSufijo}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center flex-shrink-0">
                            {data.personaje ? (
                                <img src={data.personaje} alt={data.secciones.tarjetaFinal.personajeNombre} className="w-32 h-auto object-contain drop-shadow-md select-none" />
                            ) : (
                                <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center text-6xl shadow-inner border border-white/20">💵👔</div>
                            )}
                            <span className="mt-2 text-xs font-black uppercase tracking-widest text-sky-100 bg-blue-800/50 px-3 py-1 rounded-full">{data.secciones.tarjetaFinal.personajeNombre}</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 bg-red-100 border-l-8 border-red-500 text-red-900 p-4 rounded-xl font-bold text-lg">
                        ⚠️ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!formularioValido}
                        className={`py-4 rounded-full font-black text-xl shadow-md transition-all ${
                            !formularioValido
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                : "bg-alianza-amarillo text-alianza-azul hover:scale-102 active:scale-98"
                        }`}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act04;