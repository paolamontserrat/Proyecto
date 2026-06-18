import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';

const TipoDibujar = ({ storageKey, onChange }) => {
  const canvasRef = useRef(null);
  const saveTimeout = useRef(null);

  const [isEraser, setIsEraser] = useState(false);
  const [brushColor, setBrushColor] = useState("#2D3748");

  const colores = [
    "#FF5733", "#33FF57", "#3357FF",
    "#F333FF", "#FFD700", "#FF4500", "#2D3748"
  ];

  // Cargar dibujo guardado
  const [saveData, setSaveData] = useState(() => {
    return localStorage.getItem(storageKey) || "";
  });

  // VALIDAR + AUTOGUARDAR
  const handleChange = () => {
    const data = canvasRef.current?.getSaveData() || "";

    // Guardado con delay (optimizado)
    clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      if (data) {
        localStorage.setItem(storageKey, data);
      }
    }, 500);

    const tieneDibujo = data.length > 50;
    onChange && onChange(tieneDibujo);
  };

  // REINICIAR
  const reiniciar = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      localStorage.removeItem(storageKey);
      onChange && onChange(false);
    }
  };

  // VALIDAR AL CARGAR
  useEffect(() => {
    if (saveData && saveData.length > 50) {
      onChange && onChange(true);
    }
  }, []);

  return (
    <div className="bg-white border-4 border-alianza-azul rounded-[2rem] p-4 mb-6">

      {/*COLORES */}
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {colores.map((c) => (
          <button
            key={c}
            onClick={() => {
              setBrushColor(c);
              setIsEraser(false);
            }}
            className="w-8 h-8 rounded-full border-4 border-white shadow-lg"
            style={{ backgroundColor: c }}
          />
        ))}

        {/* GOMA */}
        <button
          onClick={() => setIsEraser(true)}
          className="w-8 h-8 rounded-full bg-white border-4 border-red-500 font-bold notranslate shadow-lg"
        >
          B
        </button>
      </div>

      {/* 🔁 REINICIAR */}
      <button
        onClick={reiniciar}
        className="w-full text-sm bg-red-50 text-red-600 py-2 rounded-full font-bold mb-3"
      >
        Reiniciar dibujo
      </button>

      {/* CANVAS */}
      <div className="w-full h-[250px] bg-gray-50 rounded-2xl overflow-hidden border-4 border-gray-200 flex justify-center">
        <CanvasDraw
          ref={canvasRef}
          canvasWidth={window.innerWidth < 768 ? window.innerWidth - 60 : 680}
          canvasHeight={250}
          brushRadius={isEraser ? 25 : 5}
          brushColor={isEraser ? "#F9FAFB" : brushColor}
          backgroundColor="transparent"
          onChange={handleChange}
          saveData={saveData}
        />
      </div>

    </div>
  );
};

export default TipoDibujar;