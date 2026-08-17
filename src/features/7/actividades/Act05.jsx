import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act05 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const casos = config.preguntaSeleccion?.casos || [];
    const preguntasFrases = config.seccionFrases?.preguntas || [];

    // Respuestas seleccionadas
    const [respuestasSeleccion, setRespuestasSeleccion] = useState({});
    const [textosFrases, setTextosFrases] = useState({});

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act5-${rango}-${userId}`;

    // Cargar progreso previo
    useEffect(() => {
        const cargarProgreso = async () => {
            if (userId !== "anon" && config.id) {
                try {
                    const { data: progreso } = await supabase
                        .from("progreso_actividades")
                        .select("datos_actividad")
                        .eq("usuario_id", userId)
                        .eq("actividad_id", config.id)
                        .maybeSingle();

                    if (progreso?.datos_actividad) {
                        setRespuestasSeleccion(progreso.datos_actividad.respuestasSeleccion || {});
                        setTextosFrases(progreso.datos_actividad.textosFrases || {});
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Manejar selección de imágenes
    const handleSelectAction = (casoId, opcion) => {
        setRespuestasSeleccion((prev) => ({
            ...prev,
            [casoId]: opcion,
        }));
    };

    // Manejar entrada de texto libre en las frases
    const handleTextChange = (preguntaId, valor) => {
        setTextosFrases((prev) => ({
            ...prev,
            [preguntaId]: valor,
        }));
    };

    // Función para reiniciar la actividad
    const handleReset = () => {
        setRespuestasSeleccion({});
        setTextosFrases({});
    };

    // Validación para habilitar el botón de continuar
    const validarActividad = () => {
        // 1. Verificar que todos los casos tengan respuesta seleccionada
        const todosCasosRespondidos = casos.every((caso) => respuestasSeleccion[caso.id]);
        if (!todosCasosRespondidos) return false;

        // 2. Verificar que todas las selecciones sean correctas
        const todasImagenesCorrectas = casos.every(
            (caso) => respuestasSeleccion[caso.id]?.esCorrecta === true
        );
        if (!todasImagenesCorrectas) return false;

        // 3. Verificar que todas las frases tengan texto no vacío
        const todasFrasesLlenas = preguntasFrases.every(
            (preg) => textosFrases[preg.id] && textosFrases[preg.id].trim() !== ""
        );
        if (!todasFrasesLlenas) return false;

        return true;
    };

    const esValido = validarActividad();

    const handleContinue = async () => {
        if (!esValido) return;

        const payload = {
            respuestasSeleccion,
            textosFrases,
            fechaCompleto: new Date().toISOString(),
        };

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: payload,
                        completada: true,
                    },
                    { onConflict: "usuario_id,actividad_id" }
                );
            } catch (err) {
                console.warn("Error guardando avance en Supabase", err);
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(payload));
        onComplete();
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/dashboard/${rango}`)}
                        className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                    >
                        🏠 Inicio
                    </button>
                </div>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-4xl mx-auto space-y-8 min-w-0 box-border"
                translate="no"
            >
                {/* ENCABEZADO */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl sm:text-4xl font-black text-blue-900 uppercase tracking-wide">
                        {config.titulo}
                    </h1>
                    {config.subtitulo && (
                        <p className="text-blue-900 font-bold text-base sm:text-lg max-w-2xl mx-auto">
                            {config.subtitulo}
                        </p>
                    )}
                </div>

                {/* IMAGEN DESTACADA (Opcional) */}
                {config.imagen && (
                    <div className="flex justify-center">
                        <img
                            src={config.imagen}
                            alt="Fachada Cooperativa"
                            className="w-full max-w-lg h-auto object-contain rounded-3xl shadow-lg border-2 border-sky-100"
                        />
                    </div>
                )}

                {/* BENEFICIOS / INTRODUCCIÓN */}
                {config.introduccion?.beneficios && (
                    <div className="bg-sky-50 p-4 sm:p-6 rounded-3xl border-2 border-sky-200 space-y-4">
                        <h2 className="text-xl sm:text-2xl font-black text-blue-900 text-center">
                            {config.introduccion.titulo}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {config.introduccion.beneficios.map((b) => (
                                <div
                                    key={b.id}
                                    className="bg-white p-4 rounded-2xl shadow flex flex-col items-center text-center space-y-2 border border-sky-100"
                                >
                                    {b.imagen && (
                                        <img
                                            src={b.imagen}
                                            alt={b.texto}
                                            className="w-24 h-24 object-contain"
                                        />
                                    )}
                                    <p className="font-bold text-blue-900 text-sm sm:text-base">
                                        {b.texto}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SELECCIÓN DE BUENAS ACCIONES */}
                {config.preguntaSeleccion && (
                    <div className="space-y-6">
                        <div className="text-center bg-blue-900 text-white p-4 rounded-2xl shadow">
                            <h2 className="text-xl sm:text-2xl font-black uppercase">
                                {config.preguntaSeleccion.instruccion}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {casos.map((caso) => (
                                <div
                                    key={caso.id}
                                    className="bg-sky-50 p-4 rounded-3xl border-2 border-sky-200 space-y-3"
                                >
                                    <h3 className="text-center font-black text-blue-900 text-lg">
                                        {caso.categoria}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {caso.opciones.map((opcion) => {
                                            const esSeleccionada =
                                                respuestasSeleccion[caso.id]?.id === opcion.id;
                                            const esCorrecta = opcion.esCorrecta;

                                            // Estilos de borde dinámicos:
                                            // Si está seleccionada y es correcta -> Borde Azul + Ring Azul
                                            // Si está seleccionada e incorrecta -> Borde Rojo
                                            let borderStyle = "border-transparent hover:border-sky-300";
                                            if (esSeleccionada) {
                                                if (esCorrecta) {
                                                    borderStyle = "border-blue-600 ring-4 ring-blue-300 scale-105";
                                                } else {
                                                    borderStyle = "border-red-500 ring-4 ring-red-200 scale-95 opacity-80";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={opcion.id}
                                                    onClick={() => handleSelectAction(caso.id, opcion)}
                                                    className={`p-2 rounded-2xl border-4 transition-all overflow-hidden bg-white shadow-md flex items-center justify-center relative ${borderStyle}`}
                                                >
                                                    <img
                                                        src={opcion.imagen}
                                                        alt="Opción"
                                                        className="w-full h-36 sm:h-44 object-contain rounded-xl"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* COMPLETA LA FRASE (TEXTO LIBRE) */}
                {config.seccionFrases && (
                    <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200 space-y-6">
                        <h2 className="text-2xl font-black text-blue-900 text-center uppercase">
                            {config.seccionFrases.titulo}
                        </h2>

                        <div className="space-y-6">
                            {preguntasFrases.map((preg) => (
                                <div key={preg.id} className="space-y-2">
                                    <label className="block font-black text-blue-900 text-lg sm:text-xl">
                                        {preg.textoBase}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Escribe tu respuesta aquí..."
                                        value={textosFrases[preg.id] || ""}
                                        onChange={(e) => handleTextChange(preg.id, e.target.value)}
                                        className="w-full p-4 rounded-2xl border-2 border-sky-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-blue-950 font-bold text-base sm:text-lg shadow-inner outline-none transition-all bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTÓN CONTINUAR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-10">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!esValido}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            
                            !esValido
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

export default Act05;