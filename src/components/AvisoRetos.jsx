import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../supabaseClient";

const AvisoRetos = () => {
  const navigate = useNavigate();
  const { rango } = useParams();
  const [aviso, setAviso] = useState(null);
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {

    // Si no existe un usuario o no tiene ID, no se puede consultar sus retos.
    if (!usuario?.id) return;
    const cargar = async () => {
      // Llama a una función de Supabase que se asegura
      // de que el usuario tenga registrados los retos activos.
      await supabase.rpc("asegurar_retos_usuario", {
        p_usuario_id: usuario.id
      });

      // Se utiliza para comprobar si el reto está vigente.
      const hoy = new Date().toISOString().slice(0, 10);
      // Consulta los retos asociados al usuario.
      const { data, error } = await supabase
        .from("retos_usuario")

        .select(
          "id, visto, reto:retos(titulo, descripcion, fecha_inicio, fecha_fin, activo)"
        )
        .eq("usuario_id", usuario.id)
        .eq("visto", false);

      if (error || !data) return;


      
      const vigente = data.find(
        (r) =>
          r.reto?.activo &&
          hoy >= r.reto.fecha_inicio &&
          hoy <= r.reto.fecha_fin
      );


      if (vigente) setAviso(vigente);
    };

    cargar();

  }, [usuario?.id]);


  const verReto = async () => {
    if (aviso?.id) {

      // Marca el reto como visto en Supabase.
      await supabase
        .from("retos_usuario")
        .update({ visto: true })
        .eq("id", aviso.id);
    }
    navigate(`/pasaporte/${rango}`, {
      state: { irARetos: true }
    });
  };

  if (!aviso) return null;


  return (
    <button
      onClick={verReto}
      className="
        w-full
        flex
        items-center
        gap-4
        bg-gradient-to-r
        from-alianza-amarillo
        to-yellow-300
        rounded-2xl
        p-4
        shadow-lg
        text-left
        hover:scale-[1.01]
        transition
      "
    >

      {/* Trofeo */}
      <div className="
        w-12 h-12
        shrink-0
        rounded-full
        bg-white/70
        flex
        items-center
        justify-center
      ">
        <Trophy
          className="text-alianza-azul"
          size={24}
        />
      </div>


      {/* Información del reto */}
      <div className="flex-1">

        {/* Mensaje principal */}
        <p className="
          font-black
          text-alianza-azul
          uppercase
          text-sm
        ">
          ¡Nuevo reto disponible!
        </p>

        {/* Nombre del reto */}
        <p className="
          text-sm
          text-alianza-azul/80
          font-medium
        ">
          {aviso.reto.titulo}
        </p>

      </div>


      {/* Texto que indica que el usuario puede entrar */}
      <span className="
        text-alianza-azul
        font-black
        text-sm
      ">
        Ver reto →
      </span>

    </button>
  );
};


export default AvisoRetos;