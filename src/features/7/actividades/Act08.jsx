import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

const Act08 = ({ data, onComplete, onBack, rango }) => {
    const navigate = useNavigate();
    const config = data || {};
    const metasIniciales = config.metas || [];

    const [asignaciones, setAsignaciones] = useState({}); // { idMeta: "pequeña" | "grande" }
    const [metaSeleccionada, setMetaSeleccionada] = useState(null); // Soporte Móvil Tap/Click

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    };

    const userId = getUser()?.id || "anon";
    const storageKey = `act8-${rango}-${userId}`;

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

                    if (progreso?.datos_actividad?.asignaciones) {
                        setAsignaciones(progreso.datos_actividad.asignaciones);
                    }
                } catch (err) {
                    console.warn("Error cargando progreso de Supabase:", err);
                }
            }
        };

        cargarProgreso();
    }, [config.id, userId]);

    // Asignar una meta a una categoría
    const asignarCategoria = (metaId, catId) => {
        setAsignaciones((prev) => ({
            ...prev,
            [metaId]: catId,
        }));
        setMetaSeleccionada(null);
    };

    // DRAG & DROP NATIVO (Escritorio)
    const handleDragStart = (e, metaId) => {
        e.dataTransfer.setData("text/plain", metaId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, catId) => {
        e.preventDefault();
        const metaId = e.dataTransfer.getData("text/plain");
        if (metaId) {
            asignarCategoria(metaId, catId);
        }
    };

    // Reiniciar ejercicio
    const handleReset = () => {
        setAsignaciones({});
        setMetaSeleccionada(null);
    };

    // Validaciones
    const todasAsignadas = metasIniciales.length > 0 && metasIniciales.every((m) => asignaciones[m.id]);
    const hayErrores = metasIniciales.some(
        (m) => asignaciones[m.id] && asignaciones[m.id] !== m.categoriaCorrecta
    );
    const esValido = todasAsignadas && !hayErrores;

    const handleContinue = async () => {
        if (!esValido) return;

        const payload = {
            asignaciones,
            completado: true,
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

    // Metas sin clasificar aún
    const metasPendientes = metasIniciales.filter((m) => !asignaciones[m.id]);

    // Helper para renderizar las tarjetas colocadas
    const renderMetaColocada = (meta) => {
        const esCorrecto = asignaciones[meta.id] === meta.categoriaCorrecta;
        return (
            <div
                key={meta.id}
                onClick={(e) => {
                    e.stopPropagation();
                    // Quitar de la categoría al hacer clic/tap
                    setAsignaciones((prev) => {
                        const copy = { ...prev };
                        delete copy[meta.id];
                        return copy;
                    });
                }}
                className={`p-2 sm:p-3 rounded-2xl bg-white border-4 shadow-md flex flex-col items-center w-32 sm:w-36 cursor-pointer transition-all ${
                    esCorrecto
                        ? "border-blue-500 hover:border-blue-700"
                        : "border-red-500 hover:border-red-700"
                }`}
                title="Haz clic para devolver al banco"
            >
                <img
                    src={meta.imagen}
                    alt={meta.texto}
                    className="w-12 h-12 object-contain mb-1 pointer-events-none"
                />
                <span className="text-xs font-bold text-blue-950 text-center leading-tight">
                    {meta.texto}
                </span>
            </div>
        );
    };

    return (
        <LayoutActividad fondo={config.fondo}>
            {/* Navegación Superior */}
            <div className="flex justify-between items-center mb-4 max-w-5xl mx-auto px-2">
                <button
                    onClick={onBack}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    ← Regresar
                </button>
                <button
                    onClick={() => navigate(`/dashboard/${rango}`)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition text-sm sm:text-base"
                >
                    🏠 Inicio
                </button>
            </div>

            {/* Contenedor Principal */}
            <div
                className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border-4 border-amber-400 shadow-2xl max-w-5xl mx-auto space-y-6 min-w-0 box-border"
                translate="no"
            >
                {/* ENCABEZADO E INSTRUCCIÓN */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-blue-900 uppercase">
                        {config.titulo}
                    </h1>
                    <p className="text-gray-700 font-bold text-base sm:text-lg max-w-2xl mx-auto">
                        {config.instruccion}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-600 font-semibold md:hidden">
                        💡 Toca una meta y luego toca la categoría donde corresponda.
                    </p>
                </div>

                {/* BANCO DE METAS (PENDIENTES) */}
                <div className="bg-sky-50 p-4 rounded-3xl border-2 border-sky-200 min-h-[140px]">
                    <h2 className="text-sm font-black text-blue-900 uppercase mb-3 text-center md:text-left">
                        Metas por clasificar:
                    </h2>
                    {metasPendientes.length === 0 ? (
                        <p className="text-center text-blue-900 font-bold py-4">
                            ¡Has colocado todas las metas!
                        </p>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-4">
                            {metasPendientes.map((meta) => {
                                const isSelected = metaSeleccionada === meta.id;
                                return (
                                    <div
                                        key={meta.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, meta.id)}
                                        onClick={() =>
                                            setMetaSeleccionada(isSelected ? null : meta.id)
                                        }
                                        className={`p-3 rounded-2xl bg-white border-2 cursor-pointer shadow-md transition-all flex flex-col items-center w-36 sm:w-40 select-none ${
                                            isSelected
                                                ? "border-amber-500 ring-4 ring-amber-200 scale-105"
                                                : "border-sky-300 hover:border-blue-500 hover:scale-102"
                                        }`}
                                    >
                                        <img
                                            src={meta.imagen}
                                            alt={meta.texto}
                                            className="w-16 h-16 object-contain pointer-events-none mb-2"
                                        />
                                        <span className="text-xs sm:text-sm font-bold text-blue-950 text-center leading-tight">
                                            {meta.texto}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MENSAJE DE ADVERTENCIA CUANDO HAY ERRORES */}
                {todasAsignadas && hayErrores && (
                    <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-2xl text-center font-bold text-base sm:text-lg animate-bounce">
                        ⚠️ Algunas metas no están en la categoría correcta. Toca las que tengan borde rojo para cambiar su ubicación.
                    </div>
                )}

                {/* ZONAS DE CLASIFICACIÓN (CATEGORÍAS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* META PEQUEÑA */}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "pequeña")}
                        onClick={() => {
                            if (metaSeleccionada) asignarCategoria(metaSeleccionada, "pequeña");
                        }}
                        className={`p-4 sm:p-6 rounded-3xl border-4 border-dashed transition-all min-h-[260px] flex flex-col items-center ${
                            metaSeleccionada
                                ? "border-amber-400 bg-amber-50/50 cursor-pointer"
                                : "border-yellow-400 bg-yellow-50/50"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🎯</span>
                            <h3 className="text-xl font-black text-amber-900 uppercase">
                                Meta Pequeña
                            </h3>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 w-full">
                            {metasIniciales
                                .filter((m) => asignaciones[m.id] === "pequeña")
                                .map(renderMetaColocada)}
                        </div>
                    </div>

                    {/* META GRANDE */}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "grande")}
                        onClick={() => {
                            if (metaSeleccionada) asignarCategoria(metaSeleccionada, "grande");
                        }}
                        className={`p-4 sm:p-6 rounded-3xl border-4 border-dashed transition-all min-h-[260px] flex flex-col items-center ${
                            metaSeleccionada
                                ? "border-amber-500 bg-amber-50/50 cursor-pointer"
                                : "border-amber-500 bg-amber-50/50"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-3xl">🎯</span>
                            <h3 className="text-xl font-black text-amber-950 uppercase">
                                Meta Grande
                            </h3>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 w-full">
                            {metasIniciales
                                .filter((m) => asignaciones[m.id] === "grande")
                                .map(renderMetaColocada)}
                        </div>
                    </div>
                </div>

                {/* BOTONES DE REINICIAR Y CONTINUAR (GRID) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
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
                                : "bg-amber-400 text-blue-950 hover:scale-102 active:scale-98 cursor-pointer"
                        }`}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </LayoutActividad>
    );
};

export default Act08;