import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const TABLA_CLAVE = [
    { letra: "A", num: 1 }, { letra: "B", num: 2 }, { letra: "C", num: 3 }, { letra: "D", num: 4 },
    { letra: "E", num: 5 }, { letra: "F", num: 6 }, { letra: "G", num: 7 }, { letra: "H", num: 8 },
    { letra: "I", num: 9 }, { letra: "J", num: 10 }, { letra: "K", num: 11 }, { letra: "L", num: 12 },
    { letra: "M", num: 13 }, { letra: "N", num: 14 }, { letra: "Ñ", num: 15 }, { letra: "O", num: 16 },
    { letra: "P", num: 17 }, { letra: "Q", num: 18 }, { letra: "R", num: 19 }, { letra: "S", num: 20 },
    { letra: "T", num: 21 }, { letra: "U", num: 22 }, { letra: "V", num: 23 }, { letra: "W", num: 24 },
    { letra: "X", num: 25 }, { letra: "Y", num: 26 }, { letra: "Z", num: 27 }
];

const Act09 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};

    const seccionInformativa = config.seccionInformativa || {};
    const actividad = config.actividad || {};
    const palabras = actividad.palabras || [];

    // Respuestas organizadas por palabra: { [palabraId]: ["A", "H", ...] }
    const [letrasUsuario, setLetrasUsuario] = useState({});

    // --- Persistencia ---
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act09-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.letrasUsuario) {
                        setLetrasUsuario(progreso.datos_actividad.letrasUsuario);
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({ letrasUsuario: progreso.datos_actividad.letrasUsuario })
                        );
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
                    if (parsed.letrasUsuario) {
                        setLetrasUsuario(parsed.letrasUsuario);
                    }
                } catch (e) {
                    console.error("Error al cargar en LocalStorage", e);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    const handleLetraChange = (palabraObj, idx, valor) => {
        const char = valor.toUpperCase().slice(-1);
        const totalLetras = palabraObj.numeros.length;
        const actualPalabra = letrasUsuario[palabraObj.id] 
            ? [...letrasUsuario[palabraObj.id]] 
            : Array(totalLetras).fill("");
        
        actualPalabra[idx] = char;

        const nuevasLetras = { ...letrasUsuario, [palabraObj.id]: actualPalabra };
        setLetrasUsuario(nuevasLetras);
        localStorage.setItem(storageKey, JSON.stringify({ letrasUsuario: nuevasLetras }));

        // Auto-focus a la siguiente casilla no bloqueada
        if (char && idx < totalLetras - 1) {
            const nextInput = document.getElementById(`input-${palabraObj.id}-${idx + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const estaCorrecto = () => {
        if (palabras.length === 0) return false;

        return palabras.every((p) => {
            const respuestaLetras = letrasUsuario[p.id] || [];
            const textoEscrito = respuestaLetras.join("");
            return textoEscrito === p.palabraCorrecta;
        });
    };

    const handleReset = () => {
        setLetrasUsuario({});
        localStorage.removeItem(storageKey);
    };

    const handleContinue = async () => {
        if (!estaCorrecto()) return;

        if (userId !== "anon" && config.id) {
            try {
                await supabase.from("progreso_actividades").upsert(
                    {
                        usuario_id: userId,
                        actividad_id: config.id,
                        datos_actividad: { letrasUsuario, completado: true },
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
            {/* Navegación */}
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

                {/* Encabezado e Imagen Principal */}
                <div className="text-center space-y-4">
                    <h1 className="font-extrabold text-blue-900 text-2xl md:text-4xl tracking-wide uppercase">
                        {config.titulo || "VALOR COOPERATIVO: DEMOCRACIA"}
                    </h1>

                    {config.imagen && (
                        <div className="flex justify-center my-4">
                            <img
                                src={config.imagen}
                                alt="Valor Cooperativo Democracia"
                                className="max-w-full h-auto max-h-80 object-contain rounded-2xl shadow-md"
                            />
                        </div>
                    )}
                </div>

                {/* SECCIÓN 1: Explicación de la Democracia */}
                <div className="bg-sky-50 p-6 rounded-3xl border-2 border-sky-200">
                    <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-3">
                        {seccionInformativa.subtitulo}
                    </h2>
                    <p className="text-gray-800 text-base md:text-lg mb-4 font-medium">
                        {seccionInformativa.descripcion}
                    </p>

                    <p className="font-bold text-blue-950 mb-2">{seccionInformativa.derechosTitulo}</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 font-medium ml-2 mb-4">
                        {seccionInformativa.derechos?.map((d, i) => (
                            <li key={i}>{d}</li>
                        ))}
                    </ul>

                    <p className="text-blue-900 font-semibold bg-sky-100 p-3 rounded-xl border border-sky-200">
                        {seccionInformativa.conclusion}
                    </p>
                </div>

                {/* SECCIÓN 2: Descifra el Mensaje Secreto */}
                <div className="bg-sky-50/50 p-4 md:p-6 rounded-3xl border-2 border-sky-100 space-y-6">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 text-center">
                        {actividad.titulo || "Descifra el Mensaje Secreto"}
                    </h2>

                    {/* Tabla de Equivalencias Clave */}
                    <div className="bg-amber-300/80 border-2 border-amber-400 p-4 rounded-2xl max-w-2xl mx-auto shadow-sm">
                        <h3 className="text-center font-black text-blue-950 text-lg mb-2">CLAVE DE CIFRADO</h3>
                        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 text-center font-bold text-xs md:text-sm text-blue-950">
                            {TABLA_CLAVE.map((item) => (
                                <div key={item.num} className="bg-white/90 p-1.5 rounded-lg border border-amber-200 shadow-xs">
                                    <span className="text-blue-900">{item.letra}</span>={item.num}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pista */}
                    {actividad.pista && (
                        <div className="bg-blue-900 text-white p-4 rounded-2xl text-center max-w-xl mx-auto border-2 border-amber-300 shadow">
                            <span className="text-amber-300 font-black text-sm block mb-1">PISTA:</span>
                            <p className="italic font-medium text-sm md:text-base">"{actividad.pista}"</p>
                        </div>
                    )}

                    {/* Palabras y Casillas de Cifrado */}
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {palabras.map((p) => {
                            const letrasActuales = letrasUsuario[p.id] || Array(p.numeros.length).fill("");

                            return (
                                
                                <div key={p.id} className="bg-white p-4 rounded-2xl border-2 border-sky-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-900 text-white font-black w-7 h-7 rounded-full flex items-center justify-center text-sm shadow">
                                            {p.id}
                                        </span>
                                        <div className="flex gap-3 text-blue-900 font-extrabold text-lg">
                                            {p.numeros.join(" - ")}
                                        </div>
                                    </div>

                                    {/* Inputs en casillas */}
                                    <div className="flex flex-wrap gap-2">
                                        {p.numeros.map((num, idx) => {
                                            const letraCorrecta = p.palabraCorrecta[idx] || "";
                                            const letraEscrita = letrasActuales[idx] || "";
                                            const esCorrecto = letraEscrita.toUpperCase() === letraCorrecta.toUpperCase() && letraEscrita !== "";

                                            return (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <input
                                                        id={`input-${p.id}-${idx}`}
                                                        type="text"
                                                        maxLength={1}
                                                        disabled={esCorrecto}
                                                        value={letraEscrita}
                                                        onChange={(e) => handleLetraChange(p, idx, e.target.value)}
                                                        className={`w-10 h-12 text-center text-xl font-black rounded-xl border-2 transition-all uppercase shadow-inner ${
                                                            esCorrecto
                                                                ? "bg-blue-600 text-white border-blue-800 cursor-not-allowed"
                                                                : "bg-sky-50 text-blue-950 border-sky-300 focus:border-blue-600 focus:outline-none"
                                                        }`}
                                                    />
                                                    <span className="text-xs font-bold text-gray-400 mt-1">{num}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Botones de Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    <button
                        onClick={handleReset}
                        className="py-4 rounded-full font-black text-xl bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-98 transition-all"
                    >
                        Reiniciar
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!estaCorrecto()}
                        className={`py-4 rounded-full font-black text-xl shadow-lg transition-all ${
                            !estaCorrecto()
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

export default Act09;