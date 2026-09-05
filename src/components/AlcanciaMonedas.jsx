import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ajusta la ruta según tu proyecto

// Banner fijo y llamativo — NO es un desplegable, siempre visible.
const AlcanciaMonedas = ({ usuarioId }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!usuarioId) return;
    const cargar = async () => {
      const { data } = await supabase
        .from("monedas_usuario")
        .select("total_monedas")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      setTotal(data?.total_monedas || 0);
    };
    cargar();
  }, [usuarioId]);

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-pink-400 via-amber-300 to-yellow-300 shadow-xl flex items-center gap-4">
      <span className="text-8xl drop-shadow-md animate-bounce">🐷</span>
      <div>
        <p className="text-xs font-black text-white/90 uppercase tracking-wide drop-shadow-sm">
          Mi alcancía de retos
        </p>
        <p className="text-4xl font-black text-white drop-shadow-sm">
          {total} <span className="text-3xl">🪙</span>
        </p>
      </div>
      <span className="absolute -right-4 -bottom-4 text-8xl opacity-20">🪙</span>
    </div>
  );
};

export default AlcanciaMonedas;