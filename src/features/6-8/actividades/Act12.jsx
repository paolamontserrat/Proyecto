import React, { useMemo } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";

const Act12 = ({ data, onBack, onComplete, rango }) => {
    console.log("DATA ACT12:", data);

  const nombre = useMemo(() => {
    return (
      localStorage.getItem(`act10-nombre-${rango}`) ||
      "Participante"
    );
  }, [rango]);

  return (
    <LayoutActividad fondo={data.recursos.fondo}>

      {/* REGRESAR */}

      <div className="mb-4">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>
      </div>

      {/* CONTENEDOR */}

      <div className="
        bg-white/90
        p-6 md:p-10
        rounded-[2rem]
        shadow-2xl
        border-4
        border-alianza-amarillo
        max-w-6xl
        mx-auto
      ">

        {/* TITULO */}

        <h2 className="text-2xl md:text-4xl font-black text-center text-alianza-azul mb-10">
          {data.titulo}
        </h2>

        {/* BLOQUE SUPERIOR */}

        <div className="
          flex
          flex-col
          lg:flex-row
          justify-center
          items-center
          gap-8
          mb-10
        ">

          {/* IMAGENES */}

          <div className="flex flex-col gap-6">

            <img
              src={data.recursos.imagenSuperior}
              alt=""
              className="w-48 md:w-60 object-contain"
            />

            <img
              src={data.recursos.imagenInferior}
              alt=""
              className="w-48 md:w-60 object-contain"
            />

          </div>

          {/* TARJETA VERDE */}

          <div className="
            max-w-xl
            bg-green-600
            text-white
            rounded-[2rem]
            overflow-hidden
            shadow-xl
          ">

            <div className="
              bg-white
              text-green-700
              text-center
              font-black
              text-2xl
              py-4
            ">
              {data.contenido.titulo}
            </div>

            <div className="p-6 space-y-4 text-lg">

              <p>
                {data.contenido.texto[0]}
              </p>

              <p className="font-black">
                {data.contenido.texto[1]}
              </p>

              <ul className="space-y-2">

                <li>✓ {data.contenido.texto[2]}</li>
                <li>✓ {data.contenido.texto[3]}</li>
                <li>✓ {data.contenido.texto[4]}</li>

              </ul>

              <p>
                {data.contenido.texto[5]}
              </p>

              <div className="
                bg-white
                text-green-700
                font-black
                text-center
                py-3
                rounded-xl
              ">
                {data.contenido.texto[6]}
              </div>

            </div>

          </div>

        </div>

        {/* MENSAJE */}

        <div className="text-center mb-12">

          {data.mensajeFinal.map((linea, i) => (
            <p
              key={i}
              className="text-xl md:text-2xl font-bold text-alianza-azul"
            >
              {linea}
            </p>
          ))}

        </div>

        {/* DIPLOMA */}

        <div className="
          max-w-4xl
          mx-auto
          bg-white
          border-[14px]
          border-alianza-azul
          rounded-xl
          p-8
          md:p-12
          shadow-2xl
        ">

          <div className="text-center">

            <div className="text-6xl mb-4">
              🏅
            </div>

            <h3 className="
              text-4xl
              font-black
              text-alianza-azul
              mb-4
            ">
              Diploma
            </h3>

            <div className="
              h-1
              w-40
              bg-alianza-amarillo
              mx-auto
              mb-8
            " />

            <p className="text-lg mb-6">
              Este pasaporte demuestra que:
            </p>

            <h4 className="
              text-3xl
              md:text-4xl
              font-black
              text-alianza-azul
              mb-8
            ">
              {nombre}
            </h4>

            <p className="
              font-bold
              text-lg
              md:text-xl
              max-w-2xl
              mx-auto
              mb-8
            ">
              Es responsable, constante y paciente para lograr
              sus proyectos, y sabe que el ahorro construye
              su futuro.
            </p>

            <p className="
              font-black
              text-alianza-azul
              mb-10
            ">
              Con orgullo, su Caja.
            </p>

            {/* LOGOS */}

            <div className="
              flex
              justify-center
              items-center
              gap-6
              flex-wrap
            ">

              <img
                src={data.recursos.logoClub}
                alt=""
                className="h-16 md:h-15 object-contain"
              />
              <img
                src={data.recursos.logoExtra1}
                alt=""
                className="h-16 md:h-15 object-contain"
              />

              <img
                src={data.recursos.logoAlianza}
                alt=""
                className="h-16 md:h-10 object-contain"
              />

            </div>

          </div>

        </div>

        {/* CONTINUAR */}

        <button
          onClick={onComplete}
          className="
            w-full
            mt-10
            py-4
            rounded-full
            font-black
            text-xl
            bg-alianza-amarillo
            text-alianza-azul
            hover:scale-[1.02]
            transition
          "
        >
          Finalizar
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act12;