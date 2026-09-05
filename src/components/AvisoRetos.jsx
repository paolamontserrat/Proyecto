import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../supabaseClient"; // ajusta la ruta según tu proyecto

// Muestra un aviso cuando el usuario tiene un reto vigente que aún no ha visto.
const AvisoRetos = () => {
  const navigate = useNavigate();
  const { rango } = useParams();
  const [aviso, setAviso] = useState(null);
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {
    if (!usuario?.id) return;
    const cargar = async () => {
      // Se asegura de que el usuario ya esté inscrito en los retos activos
      // (si nunca ha entrado al pasaporte, esta fila todavía no existía).
      await supabase.rpc("asegurar_retos_usuario", { p_usuario_id: usuario.id });

      const hoy = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("retos_usuario")
        .select("id, visto, reto:retos(titulo, descripcion, fecha_inicio, fecha_fin, activo)")
        .eq("usuario_id", usuario.id)
        .eq("visto", false);

      if (error || !data) return;

      const vigente = data.find(
        (r) => r.reto?.activo && hoy >= r.reto.fecha_inicio && hoy <= r.reto.fecha_fin
      );
      if (vigente) setAviso(vigente);
    };
    cargar();
  }, [usuario?.id]);

  const verReto = async () => {
    if (aviso?.id) {
      await supabase.from("retos_usuario").update({ visto: true }).eq("id", aviso.id);
    }
    navigate(`/pasaporte/${rango}`, { state: { irARetos: true } });
  };

  if (!aviso) return null;

  return (
    <button
      onClick={verReto}
      className="w-full flex items-center gap-4 bg-gradient-to-r from-alianza-amarillo to-yellow-300 rounded-2xl p-4 shadow-lg text-left hover:scale-[1.01] transition"
    >
      <div className="w-12 h-12 shrink-0 rounded-full bg-white/70 flex items-center justify-center">
        <Trophy className="text-alianza-azul" size={24} />
      </div>
      <div className="flex-1">
        <p className="font-black text-alianza-azul uppercase text-sm">¡Nuevo reto disponible!</p>
        <p className="text-sm text-alianza-azul/80 font-medium">{aviso.reto.titulo}</p>
      </div>
      <span className="text-alianza-azul font-black text-sm">Ver reto →</span>
    </button>
  );
};

export default AvisoRetos;