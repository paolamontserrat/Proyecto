import { useMemo } from 'react';

const COLORES = ['#1E3A8A', '#FACC15', '#22C55E', '#EF4444', '#0EA5E9', '#F97316'];

function Confetti({ cantidad = 60 }) {
  const piezas = useMemo(() => {
    return Array.from({ length: cantidad }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 1.5,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      size: 6 + Math.random() * 6,
      rotate: Math.random() * 360,
    }));
  }, [cantidad]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
      <style>{`
        @keyframes caer {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
        }
      `}</style>
      {piezas.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animation: `caer ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;