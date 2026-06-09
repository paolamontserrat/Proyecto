import React, { useState } from 'react';
import Footer from '../components/Footer';

const Passport = () => {
  const [ahorros, setAhorros] = useState(() => JSON.parse(localStorage.getItem('ahorros_alianza')) || {});
  const [mesExpandido, setMesExpandido] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fecha: '', monto: '', id: null });

  // Lógica de fechas
  const mesesDelAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesActualIndex = new Date().getMonth();
  const nombreMesActual = mesesDelAnio[mesActualIndex];

  // Ordenar meses: Actual primero
  const mesesOrdenados = [nombreMesActual, ...mesesDelAnio.filter(m => m !== nombreMesActual)];

  const handleSave = () => {
    const nuevosAhorros = { ...ahorros };
    if (!nuevosAhorros[mesExpandido]) nuevosAhorros[mesExpandido] = [];

    if (formData.id) {
      // Editar
      nuevosAhorros[mesExpandido] = nuevosAhorros[mesExpandido].map(item => 
        item.id === formData.id ? { ...formData } : item
      );
    } else {
      // Nuevo
      nuevosAhorros[mesExpandido].push({ ...formData, id: Date.now() });
    }

    setAhorros(nuevosAhorros);
    localStorage.setItem('ahorros_alianza', JSON.stringify(nuevosAhorros));
    setShowForm(false);
    setFormData({ fecha: '', monto: '', id: null });
  };

  const handleDelete = (id) => {
    const nuevosAhorros = { ...ahorros };
    nuevosAhorros[mesExpandido] = nuevosAhorros[mesExpandido].filter(item => item.id !== id);
    setAhorros(nuevosAhorros);
    localStorage.setItem('ahorros_alianza', JSON.stringify(nuevosAhorros));
  };

  const iniciarEdicion = (item) => {
    setFormData(item);
    setShowForm(true);
  };

  const calcularTotalAnual = () => {
    let total = 0;
    Object.values(ahorros).forEach(mes => {
      mes.forEach(a => total += Number(a.monto));
    });
    return total;
  };

  return (
    <div className="p-4 bg-azul-fondo min-h-screen pb-10">
      <h1 className="text-2xl font-black text-alianza-azul text-center mb-6 uppercase">Mi Pasaporte</h1>

      {/* Indicador de Total Anual */}
      <div className="bg-alianza-azul text-white p-4 rounded-3xl mb-6 text-center shadow-lg">
        <p className="text-xs uppercase opacity-80">Total ahorrado este año</p>
        <p className="text-3xl font-black text-alianza-amarillo">${calcularTotalAnual()}</p>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        {mesesOrdenados.map((mes) => {
          const esMesActual = mes === nombreMesActual;
          const totalMes = ahorros[mes]?.reduce((sum, a) => sum + Number(a.monto), 0) || 0;

          return (
            <div key={mes} className={`bg-white border-2 rounded-2xl overflow-hidden ${esMesActual ? 'border-alianza-amarillo shadow-lg' : 'border-alianza-azul'}`}>
              <button 
                onClick={() => setMesExpandido(mesExpandido === mes ? null : mes)}
                className={`w-full p-4 flex justify-between items-center font-black ${esMesActual ? 'bg-alianza-amarillo text-alianza-azul' : 'text-alianza-azul'}`}
              >
                {mes} {esMesActual && "(ACTUAL)"}
                <span className="bg-alianza-azul text-white px-3 py-1 rounded-full text-sm">${totalMes}</span>
              </button>

              {mesExpandido === mes && (
                <div className="p-4 bg-fondo-claro">
                  {ahorros[mes]?.map(a => (
                    <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="font-bold text-sm">{a.fecha}</p>
                        <p className="text-alianza-azul font-black">${a.monto}</p>
                      </div>
                      {esMesActual && (
                        <div className="flex gap-2">
                          <button onClick={() => iniciarEdicion(a)} className="text-xs bg-blue-100 p-1 rounded">✏️</button>
                          <button onClick={() => handleDelete(a.id)} className="text-xs bg-red-100 p-1 rounded">🗑️</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {esMesActual && (
                    <button onClick={() => { setFormData({ fecha: '', monto: '', id: null }); setShowForm(true); }} className="mt-3 w-full py-2 bg-alianza-azul text-white rounded-lg font-bold">
                      + Agregar ahorro
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm border-4 border-alianza-azul">
            <h3 className="font-black text-alianza-azul mb-4">{formData.id ? 'Editar' : 'Nuevo'} ahorro</h3>
            <input type="date" value={formData.fecha} className="w-full p-3 border-2 rounded-xl mb-3" onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
            <input type="number" value={formData.monto} placeholder="Monto ($)" className="w-full p-3 border-2 rounded-xl mb-4" onChange={(e) => setFormData({...formData, monto: e.target.value})} />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-200 rounded-xl">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-alianza-azul text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
          
        </div>
      )}
        <Footer />
    </div>
  );
};

export default Passport;