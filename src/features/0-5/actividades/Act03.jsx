import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutActividad from '../../../components/layout/LayoutActividad';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';


const Act03 = ({ data, onComplete, onBack, rango }) => {
const navigate = useNavigate();
  // USUARIO DESDE LOCALSTORAGE (IGUAL QUE ACT05)
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userId = usuario?.id;

  // CLAVE MULTIUSUARIO
  const storageKey = `act03-${rango}-${userId}`;

  // ==============================
  // GUARDADO GLOBAL (ESPEJO)
  // ==============================
  const guardarTodo = async () => {

    // 1. LOCAL (MARCAR COMO VISITADO POR USUARIO)
    localStorage.setItem(storageKey, "visitado");

    // 2. SUPABASE
    if (userId) {
      try {
        await supabase.from('progreso_actividades').upsert({
          usuario_id: userId,
          actividad_id: data.id,

          // SIEMPRE OBJETO VACÍO
          datos_actividad: {},

          completada: true
        }, {
          onConflict: 'usuario_id, actividad_id'
        });

      } catch (err) {
        console.warn("Offline, se sincroniza después");
      }
    }
  };

  // ==============================
  // REINTENTO ONLINE (IGUAL QUE ACT05)
  // ==============================
  useEffect(() => {
    const handleOnline = () => guardarTodo();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // ==============================
  // CONTINUAR
  // ==============================
  const guardarYContinuar = () => {
    guardarTodo();
    onComplete();
  };

  return (
    <LayoutActividad fondo={data.recursos?.fondo || '/images/0-5/Fondo20-5.png'}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <button
          onClick={onBack}
          className="bg-alianza-azul text-white px-4 py-2 rounded-full font-bold shadow"
        >
          ← Regresar
        </button>

        <button
          onClick={() => navigate(`/dashboard/${rango}`)}
          className="bg-alianza-azul text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition"
        >
          🏠 Inicio
        </button>

      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 p-6 md:p-10 rounded-[2.5rem] shadow-2xl border-[6px] border-alianza-amarillo"
        translate="no"
      >
        
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 text-center">
          <motion.img initial={{ x: -50 }} animate={{ x: 0 }} src={data.recursos.ninoHeader} className="w-24 h-24 md:w-32 md:h-32 object-contain" />
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-black text-alianza-azul uppercase leading-tight mb-2">{data.titulo}</h2>
            <p className="text-lg md:text-xl font-bold text-gray-600 italic">"{data.contenido.historia[0]}"</p>
          </div>
          <motion.img initial={{ x: 50 }} animate={{ x: 0 }} src={data.recursos.puerquitoHeader} className="w-24 h-24 md:w-32 md:h-32 object-contain" />
        </header>

        {/* Consejo */}
        <motion.section 
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }}
          className="bg-pink-50 p-6 rounded-[2rem] border-4 border-pink-200 flex flex-col items-center text-center gap-4 mb-8"
        >
          <img src={data.recursos.medallaHabito} className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-lg" />
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-pink-500 mb-2 uppercase">¡Consejo de oro!</h3>
            <p className="text-xl md:text-2xl font-black text-alianza-azul">{data.contenido.historia[1]}</p>
          </div>
        </motion.section>

        {/* Actividades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-blue-50 p-6 rounded-[2rem] border-4 border-alianza-azul flex flex-col items-center text-center">
            <img src={data.recursos.familiaContando} className="w-32 h-32 md:w-40 md:h-40 object-contain mb-4" />
            <p className="text-xl font-black text-alianza-azul">Contar dinero JUNTOS</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-50 p-6 rounded-[2rem] border-4 border-alianza-amarillo flex flex-col items-center text-center">
            <img src={data.recursos.ninoCantando} className="w-32 h-32 md:w-40 md:h-40 object-contain mb-4" />
            <p className="text-xl font-black text-alianza-azul">Guardar dinero mientras cantan</p>
          </motion.div>
        </div>

        {/* Tips */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="bg-alianza-azul text-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-white">
          <h4 className="text-2xl font-black mb-4">💡 TIPS PARA PAPÁS:</h4>
          <p className="text-lg font-bold mb-4">{data.contenido.historia[2]}</p>
          <ul className="text-lg md:text-xl font-bold space-y-3">
            {data.contenido.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="bg-alianza-amarillo text-alianza-azul min-w-[24px] h-6 rounded-full flex items-center justify-center text-sm font-black mt-1">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* BOTÓN */}
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={guardarYContinuar}
          className="mt-8 w-full bg-alianza-amarillo py-5 rounded-full font-black text-alianza-azul text-2xl md:text-3xl shadow-xl uppercase"
        >
          ¡Continuar el Reto!
        </motion.button>

      </motion.div>
    </LayoutActividad>
  );
};

export default Act03;