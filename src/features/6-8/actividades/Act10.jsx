import React, { useState, useEffect } from "react";
import LayoutActividad from "../../../components/layout/LayoutActividad";
import TipoDibujar from "../../../components/actividades/tipos/TipoDibujar";

const Act10 = ({ data, onBack, onComplete, rango }) => {

  const [nombre, setNombre] = useState(
    () => localStorage.getItem(`act10-nombre-${rango}`) || ""
  );

  const [firmaCompleta, setFirmaCompleta] = useState(false);

  useEffect(() => {
    localStorage.setItem(`act10-nombre-${rango}`, nombre);
  }, [nombre, rango]);

  const isValid =
    nombre.trim() !== "" &&
    firmaCompleta;

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

      <div className="bg-white/95 rounded-[2rem] border-4 border-alianza-amarillo shadow-2xl p-4 md:p-8">

        {/* TITULO */}

        <h2 className="text-center text-2xl md:text-4xl font-black text-alianza-azul mb-8">
          {data.titulo}
        </h2>

        {/* CARTA */}

        <div className="max-w-3xl mx-auto bg-gray-100 border-8 border-alianza-azul rounded-xl overflow-hidden">

          {/* FRANJA SUPERIOR */}

          <div className="bg-alianza-azul h-8"></div>

          <div className="p-6 md:p-10">

            <h3 className="text-center font-black text-xl mb-8">
              MI COMPROMISO
            </h3>

            {/* NOMBRE */}

            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-3">

              <span className="font-medium text-lg">
                Yo,
              </span>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="flex-1 border-b-2 border-gray-500 bg-transparent outline-none text-center text-lg p-2"
              />

            </div>

            <p className="mb-4 text-lg">
              me comprometo a:
            </p>

            <ul className="space-y-3 text-lg mb-10">

              {data.compromisos.map((item, index) => (
                <li key={index}>
                  • {item}
                </li>
              ))}

            </ul>

            {/* FIRMA */}

            <div className="text-center mb-4">

              <p className="font-bold text-lg mb-3">
                Firma:
              </p>

            </div>

            <TipoDibujar
              storageKey={`act10-firma-${rango}`}
              onChange={setFirmaCompleta}
            />

            {/* LOGOS Y PERSONAJE */}

<div className="flex justify-center items-end gap-4 md:gap-8 mt-8 flex-wrap">

  <img
    src={data.recursos.logoAlianza}
    alt="Alianza"
    className="h-14 md:h-30 object-contain"
  />

  <img
    src={data.recursos.logoClub}
    alt="Club Alianzito"
    className="h-16 md:h-24 object-contain"
  />

  <img
    src={data.recursos.personaje}
    alt="Personaje"
    className="h-20 md:h-32 object-contain"
  />

</div>

          </div>

        </div>

        

        {/* BOTON CONTINUAR */}

        <button
          onClick={onComplete}
          disabled={!isValid}
          className={`w-full mt-8 py-4 rounded-full font-black text-xl transition ${
            isValid
              ? "bg-alianza-amarillo text-alianza-azul hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isValid
            ? "¡Continuar!"
            : "Escribe tu nombre y firma"}
        </button>

      </div>

    </LayoutActividad>
  );
};

export default Act10;