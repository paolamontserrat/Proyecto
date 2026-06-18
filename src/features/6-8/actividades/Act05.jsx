import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import TipoDibujar from '../../../components/actividades/tipos/TipoDibujar';

const Act05 = ({ data, onComplete, onBack, rango }) => {
  const navigate = useNavigate();

  const [isValid, setIsValid] = useState(false);
  // Estado para bloquear el guardado hasta que terminen de cargar los datos
  const [datosCargados, setDatosCargados] = useState(false);

  const [ahorroSemana, setAhorroSemana] = useState('');
  const [ahorroMes, setAhorroMes] = useState('');
  const [ahorro9Meses, setAhorro9Meses] = useState('');

  // 1. Efecto de Carga: Lee del localStorage al montar
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(`plan-ahorro-${rango}`);
      if (guardado) {
        const datos = JSON.parse(guardado);
        setAhorroSemana(datos?.ahorroSemana?.toString() ?? '');
        setAhorroMes(datos?.ahorroMes?.toString() ?? '');
        setAhorro9Meses(datos?.ahorro9Meses?.toString() ?? '');
      }
    } catch (error) {
      console.error('Error cargando plan de ahorro:', error);
    } finally {
      setDatosCargados(true);
    }
  }, [rango]);

  // 2. Efecto de Guardado: Guarda solo si ya se cargaron los datos previos
  useEffect(() => {
    if (!datosCargados) return;

    localStorage.setItem(
      `plan-ahorro-${rango}`,
      JSON.stringify({
        ahorroSemana,
        ahorroMes,
        ahorro9Meses,
      })
    );
  }, [ahorroSemana, ahorroMes, ahorro9Meses, rango, datosCargados]);

  // Validación: Todos los campos deben tener contenido
  const planCompleto =
    ahorroSemana.trim() !== '' &&
    ahorroMes.trim() !== '' &&
    ahorro9Meses.trim() !== '';

  const puedeContinuar = isValid && planCompleto;

  return (
    <LayoutActividad fondo={data.recursos?.fondo}>
      {/* BOTÓN REGRESAR */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>
      </div>

      {/* CONTENEDOR */}
      <div className="bg-white/90 p-6 md:p-10 rounded-[2rem] shadow-2xl border-4 border-alianza-amarillo relative">
        
        {/* TIP FINANCIERO */}
        <div className="relative mb-8">
          <div className="bg-alianza-azul text-white font-black p-4 rounded-t-2xl w-[85%]">
            TIP FINANCIERO
          </div>
          <div className="bg-blue-300 text-alianza-azul font-bold p-4 rounded-b-2xl w-[85%] space-y-2">
            <p>Del cochinito a la Caja</p>
            <div className="flex gap-2 mt-2">
              <img src={data.recursos.img1} alt="" className="w-12" />
              <img src={data.recursos.img2} alt="" className="w-12" />
            </div>
            <div className="mt-3 space-y-1">
              <p>La alcancía te ayuda a empezar.</p>
              <p>La Caja te ayuda a crecer.</p>
              <p>Cuando llevas tu ahorro a la Caja:</p>
            </div>
          </div>
          <img
            src={data.recursos.imagenTip}
            alt=""
            className="absolute right-[20px] md:right-[30px] top-4 w-24 md:w-40 lg:w-52 drop-shadow-lg"
          />
        </div>

        {/* BENEFICIOS */}
        <div className="flex items-start gap-4 mb-8">
          <img src={data.recursos.imgCaja} alt="" className="w-5 md:w-6" />
          <div className="text-left font-bold text-gray-800 leading-relaxed whitespace-pre-line">
            <p>Está más seguro</p>
            <p>Puede generar más dinero.</p>
            <p>Aprendes a planear tu futuro.</p>
            <p>Participas en promociones y otros beneficios.</p>
          </div>
        </div>

        {/* PLAN DE AHORRO */}
        <div className="bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-alianza-amarillo rounded-2xl p-5 mb-8">
          <h3 className="text-center text-xl md:text-2xl font-black text-alianza-azul mb-6">
            {data.plan.titulo}
          </h3>

          <div className="space-y-5">
            {/* Si ahorro cada semana */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">Si ahorro cada semana:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <input
                  type="number"
                  value={ahorroSemana}
                  onChange={(e) => setAhorroSemana(e.target.value)}
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Al mes tendré */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">Al mes tendré:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <input
                  type="number"
                  value={ahorroMes}
                  onChange={(e) => setAhorroMes(e.target.value)}
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>

            {/* En 9 meses */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-800 md:min-w-[220px]">En 9 meses:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-alianza-azul text-lg">$</span>
                <input
                  type="number"
                  value={ahorro9Meses}
                  onChange={(e) => setAhorro9Meses(e.target.value)}
                  className="w-32 border-b-4 border-alianza-amarillo bg-transparent outline-none text-center text-lg font-black"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-alianza-amarillo/20 border-l-4 border-alianza-amarillo rounded-xl p-4">
            <p className="font-black text-alianza-azul text-lg mb-2">⭐ Tarea de ahorro</p>
            <p className="font-bold text-gray-700 leading-relaxed">{data.plan.tarea}</p>
          </div>
        </div>

        {/* BOTÓN PASAPORTE */}
        <button
          onClick={() => navigate(`/pasaporte/${rango}`)}
          className="bg-alianza-azul text-white px-8 py-4 rounded-full font-black text-lg hover:scale-110 transition mb-6 w-full"
        >
          Ir a mi pasaporte
        </button>

        {/* ACTIVIDAD DIBUJAR */}
        <div className="mb-6">
          <p className="text-center text-lg md:text-xl font-black text-alianza-azul mb-4">
            Con ayuda de un adulto, dibuja cómo te sentiste al ahorrar
          </p>
          <TipoDibujar
            storageKey={`dibujo-${rango}-5`}
            onChange={(tieneDibujo) => setIsValid(tieneDibujo)}
          />
        </div>

        {/* BOTÓN AVANZAR */}
        <button
          onClick={onComplete}
          disabled={!puedeContinuar}
          className={`w-full py-4 rounded-full font-black text-xl transition ${
            puedeContinuar
              ? 'bg-alianza-amarillo text-alianza-azul hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {puedeContinuar
            ? '¡Terminé!'
            : 'Completa el plan y realiza el dibujo'}
        </button>
      </div>
    </LayoutActividad>
  );
};

export default Act05;