import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act13 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const preguntas = config.preguntas || [];
    const seccionVotacion = config.seccionVotacionFamiliar || {};
    const reflexion = config.reflexionFinal || [];

    // Respuestas de las preguntas 1, 2 y 3
    const [respuestasPreguntas, setRespuestasPreguntas] = useState({});

    // Formulario de Votación Familiar
    const [opcionElegidaTema, setOpcionElegidaTema] = useState(0);
    const [otroTemaTexto, setOtroTemaTexto] = useState("");
    const [opcionesVoto, setOpcionesVoto] = useState({
        opcion1: { nombre: "", votos: 0 },
        opcion2: { nombre: "", votos: 0 },
        opcion3: { nombre: "", votos: 0 },
    });
    const [gano, setGano] = useState("");
    const [todosRespetaron, setTodosRespetaron] = useState("");

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act13-${rango}-${userId}`;

    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad, completada")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        const datos = progreso.datos_actividad;
                        if (datos.respuestasPreguntas) setRespuestasPreguntas(datos.respuestasPreguntas);
                        if (datos.opcionElegidaTema !== undefined) setOpcionElegidaTema(datos.opcionElegidaTema);
                        if (datos.otroTemaTexto) setOtroTemaTexto(datos.otroTemaTexto);
                        if (datos.opcionesVoto) setOpcionesVoto(datos.opcionesVoto);
                        if (datos.gano) setGano(datos.gano);
                        if (datos.todosRespetaron) setTodosRespetaron(datos.todosRespetaron);
                        return;
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase...", err);
                }
            }

            const guardado = localStorage.getItem(storageKey);
            if (guardado) {
                try {
                    const parsed = JSON.parse(guardado);
                    if (parsed.respuestasPreguntas) setRespuestasPreguntas(parsed.respuestasPreguntas);
                    if (parsed.opcionElegidaTema !== undefined) setOpcionElegidaTema(parsed.opcionElegidaTema);
                    if (parsed.otroTemaTexto) setOtroTemaTexto(parsed.otroTemaTexto);
                    if (parsed.opcionesVoto) setOpcionesVoto(parsed.opcionesVoto);
                    if (parsed.gano) setGano(parsed.gano);
                    if (parsed.todosRespetaron) setTodosRespetaron(parsed.todosRespetaron);
                } catch (e) {
                    console.error("Error al cargar LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Función auxiliar para determinar automáticamente la opción ganadora
    const calcularGanador = (opciones) => {
        const lista = [
            { nombre: opciones.opcion1.nombre, votos: Number(opciones.opcion1.votos) || 0 },
            { nombre: opciones.opcion2.nombre, votos: Number(opciones.opcion2.votos) || 0 },
            { nombre: opciones.opcion3.nombre, votos: Number(opciones.opcion3.votos) || 0 },
        ];

        const maxVotos = Math.max(...lista.map((item) => item.votos));

        if (maxVotos === 0) return "";

        const ganadoras = lista.filter((item) => item.votos === maxVotos && item.nombre.trim() !== "");

        if (ganadoras.length === 1) {
            return ganadoras[0].nombre;
        } else if (ganadoras.length > 1) {
            return "Empate (" + ganadoras.map((g) => g.nombre).join(", ") + ")";
        }
        return "";
    };

    // Manejar selección de opciones A/B
    const handleSeleccionarRespuesta = (preguntaId, indiceOpcion) => {
        const pregunta = preguntas.find((p) => p.id === preguntaId);
        const seleccionPrevia = respuestasPreguntas[preguntaId];

        // Si ya había seleccionado la opción correcta previa, bloqueamos el cambio
        if (seleccionPrevia !== undefined && pregunta?.opciones[seleccionPrevia]?.esCorrecta) {
            return;
        }

        const nuevasRespuestas = {
            ...respuestasPreguntas,
            [preguntaId]: indiceOpcion,
        };
        setRespuestasPreguntas(nuevasRespuestas);
        guardarEstadoLocal({ respuestasPreguntas: nuevasRespuestas });
    };

    const guardarEstadoLocal = (cambios = {}) => {
        const estadoCompleto = {
            respuestasPreguntas,
            opcionElegidaTema,
            otroTemaTexto,
            opcionesVoto,
            gano,
            todosRespetaron,
            ...cambios,
        };
        localStorage.setItem(storageKey, JSON.stringify(estadoCompleto));
    };

    // Reiniciar todo
    const handleReset = () => {
        setRespuestasPreguntas({});
        setOpcionElegidaTema(0);
        setOtroTemaTexto("");
        setOpcionesVoto({
            opcion1: { nombre: "", votos: 0 },
            opcion2: { nombre: "", votos: 0 },
            opcion3: { nombre: "", votos: 0 },
        });
        setGano("");
        setTodosRespetaron("");
        localStorage.removeItem(storageKey);
    };

    // Validar respuestas correctas
    const preguntasCorrectas = preguntas.every((p) => {
        const sel = respuestasPreguntas[p.id];
        return sel !== undefined && p.opciones[sel]?.esCorrecta;
    });

    // Validar que la sección de votación familiar esté completa
    const votacionFamiliarLista =
        todosRespetaron !== "" &&
        gano.trim() !== "" &&
        (opcionesVoto.opcion1.nombre.trim() !== "" ||
            opcionesVoto.opcion2.nombre.trim() !== "" ||
            opcionesVoto.opcion3.nombre.trim() !== "");

    const puedeCompletar = preguntasCorrectas && votacionFamiliarLista;

    const handleContinue = async () => {
        if (!puedeCompletar) return;

        const estadoGuardar = {
            respuestasPreguntas,
            opcionElegidaTema,
            otroTemaTexto,
            opcionesVoto,
            gano,
            todosRespetaron,
            completado: true,
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: estadoGuardar,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Offline, guardado local", err);
            }
        }
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4">
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

            {/* Tarjeta Principal */}
            <div className="bg-white p-4 md:p-8 rounded-3xl border-4 border-alianza-amarillo shadow-2xl space-y-8" translate="no">

                {/* Título Principal */}
                <div className="text-center space-y-2">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "ACTIVIDAD"}
                    </h1>
                    <p className="text-gray-700 font-bold text-base md:text-lg">
                        {config.subtitulo || "¿Qué harías tú? Lee cada situación y responde."}
                    </p>
                </div>

                {/* PARTE 1: Situaciones 1, 2 y 3 */}
                <div className="space-y-6 max-w-2xl mx-auto">
                    {preguntas.map((p) => {
                        const seleccionada = respuestasPreguntas[p.id];
                        const esRespuestaBloqueada =
                            seleccionada !== undefined && p.opciones[seleccionada]?.esCorrecta;

                        return (
                            <div key={p.id} className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-200 shadow-sm space-y-4">
                                <span className="bg-blue-900 text-amber-300 font-extrabold px-3 py-1 rounded-full text-xs md:text-sm">
                                    Situación {p.id}
                                </span>

                                <div className="bg-yellow-300 text-blue-950 font-bold p-4 rounded-2xl text-base md:text-lg border border-yellow-400">
                                    {p.situacion}
                                </div>

                                <div className="space-y-2 pt-1">
                                    {p.opciones.map((op, idx) => {
                                        const esEsta = seleccionada === idx;
                                        let estiloBtn = "bg-white text-gray-800 border-gray-300 hover:bg-sky-100";

                                        if (esEsta) {
                                            estiloBtn = op.esCorrecta
                                                ? "bg-blue-500 text-white border-blue-600 shadow-md scale-[1.01]"
                                                : "bg-red-500 text-white border-red-600 shadow-md";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                disabled={esRespuestaBloqueada}
                                                onClick={() => handleSeleccionarRespuesta(p.id, idx)}
                                                className={`w-full text-left p-3.5 rounded-2xl border-2 font-bold text-sm md:text-base transition-all flex items-center gap-3 ${
                                                    esRespuestaBloqueada ? "cursor-default" : ""
                                                } ${estiloBtn}`}
                                            >
                                                <span className="font-black text-lg">{op.letra})</span>
                                                <span>{op.texto}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PARTE 2: Votación Familiar */}
                <div className="bg-yellow-300 p-6 md:p-8 rounded-3xl border-4 border-yellow-400 shadow-lg max-w-2xl mx-auto space-y-6 text-blue-950">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl md:text-3xl font-black uppercase text-blue-900">
                            {seccionVotacion.titulo || "Votación familiar"}
                        </h2>
                        <p className="font-extrabold text-sm md:text-base">
                            {seccionVotacion.instruccion || "Realiza una votación en casa."}
                        </p>
                    </div>

                    {/* Selector de Tema */}
                    <div className="space-y-2">
                        <label className="font-black text-base md:text-lg block">Tema:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {seccionVotacion.temas?.map((tema, tIdx) => (
                                <label
                                    key={tIdx}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 font-extrabold text-sm cursor-pointer transition ${
                                        opcionElegidaTema === tIdx
                                            ? "bg-blue-900 text-white border-blue-950"
                                            : "bg-white/80 text-blue-950 border-yellow-500 hover:bg-white"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tema"
                                        checked={opcionElegidaTema === tIdx}
                                        onChange={() => {
                                            setOpcionElegidaTema(tIdx);
                                            guardarEstadoLocal({ opcionElegidaTema: tIdx });
                                        }}
                                        className="accent-amber-400 w-4 h-4"
                                    />
                                    <span>
                                        {tIdx + 1}. {tema}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {opcionElegidaTema === 3 && (
                            <input
                                type="text"
                                placeholder="Escribe el tema..."
                                value={otroTemaTexto}
                                onChange={(e) => {
                                    setOtroTemaTexto(e.target.value);
                                    guardarEstadoLocal({ otroTemaTexto: e.target.value });
                                }}
                                className="w-full mt-2 p-3 rounded-xl border-2 border-blue-900 font-bold bg-white focus:outline-none"
                            />
                        )}
                    </div>

                    {/* Resultados de Opciones y Votos */}
                    <div className="space-y-3 pt-2">
                        <h3 className="font-black text-lg">Resultados:</h3>

                        {[1, 2, 3].map((num) => {
                            const key = `opcion${num}`;
                            return (
                                <div key={num} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-7 sm:col-span-8 flex items-center gap-2 bg-white/90 p-2 rounded-xl border border-yellow-500">
                                        <span className="font-black text-xs md:text-sm whitespace-nowrap">
                                            Opción {num}:
                                        </span>
                                        <input
                                            type="text"
                                            value={opcionesVoto[key].nombre}
                                            onChange={(e) => {
                                                const nuevas = {
                                                    ...opcionesVoto,
                                                    [key]: { ...opcionesVoto[key], nombre: e.target.value },
                                                };
                                                const nuevoGanador = calcularGanador(nuevas);
                                                setOpcionesVoto(nuevas);
                                                setGano(nuevoGanador);
                                                guardarEstadoLocal({ opcionesVoto: nuevas, gano: nuevoGanador });
                                            }}
                                            className="w-full font-bold bg-transparent focus:outline-none text-sm"
                                            placeholder={`Nombre de opción ${num}`}
                                        />
                                    </div>

                                    <div className="col-span-5 sm:col-span-4 flex items-center gap-2 bg-white/90 p-2 rounded-xl border border-yellow-500">
                                        <span className="font-black text-xs md:text-sm">Votos:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={opcionesVoto[key].votos}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const nuevas = {
                                                    ...opcionesVoto,
                                                    [key]: { ...opcionesVoto[key], votos: val },
                                                };
                                                const nuevoGanador = calcularGanador(nuevas);
                                                setOpcionesVoto(nuevas);
                                                setGano(nuevoGanador);
                                                guardarEstadoLocal({ opcionesVoto: nuevas, gano: nuevoGanador });
                                            }}
                                            className="w-full font-bold bg-transparent focus:outline-none text-sm text-center"
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Ganó (Calculado automáticamente) */}
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-blue-900 mt-2">
                            <span className="font-black text-blue-900 text-base">Ganó:</span>
                            <input
                                type="text"
                                readOnly
                                value={gano}
                                placeholder="Se calcula automáticamente..."
                                className="w-full font-extrabold text-blue-900 bg-transparent focus:outline-none text-sm md:text-base cursor-not-allowed"
                            />
                        </div>

                        {/* ¿Todos respetaron el resultado? */}
                        <div className="space-y-2 pt-2">
                            <label className="font-black text-base block">
                                ¿Todos respetaron el resultado?
                            </label>
                            <div className="flex gap-4">
                                {["Sí", "No"].map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => {
                                            setTodosRespetaron(v);
                                            guardarEstadoLocal({ todosRespetaron: v });
                                        }}
                                        className={`px-6 py-2 rounded-xl font-extrabold transition border-2 ${
                                            todosRespetaron === v
                                                ? "bg-blue-900 text-white border-blue-950 shadow"
                                                : "bg-white text-blue-900 border-yellow-500 hover:bg-yellow-100"
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PARTE 3: Reflexión Final */}
                <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 max-w-2xl mx-auto space-y-4">
                    {reflexion.map((párrafo, rIdx) => (
                        <p key={rIdx} className="text-gray-800 font-bold text-base md:text-lg leading-relaxed">
                            {párrafo}
                        </p>
                    ))}
                </div>

                {/* Botones de Acción (Reiniciar y Completar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!puedeCompletar}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !puedeCompletar
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

export default Act13;