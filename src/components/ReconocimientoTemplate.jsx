import { forwardRef } from 'react';

const FUENTE = "'Fredoka','Baloo 2','Trebuchet MS',Arial,sans-serif";

// Colores según el tipo de reto (sin verde, que es el color de la competencia)
const TIPOS = {
  ahorro: { emoji: '💰', etiqueta: 'Reto de ahorro', color: '#F59E0B', oscuro: '#B45309', suave: '#FEF3C7' },
  habito: { emoji: '🌱', etiqueta: 'Reto de hábito', color: '#1E3A8A', oscuro: '#172554', suave: '#DBEAFE' },
};

const fechaLarga = (iso) =>
  new Date(iso || Date.now()).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });

// Reflexión muy larga no cabe en el reconocimiento: se recorta.
const recortar = (texto, max = 140) =>
  texto.length > max ? texto.slice(0, max - 1).trimEnd() + '…' : texto;

// Puntos de "confeti" repartidos por la tarjeta (posiciones fijas para que siempre se vea igual)
const CONFETI = [
  { x: 190, y: 70, s: 16, r: 30, f: 'cuadro' },
  { x: 330, y: 52, s: 12, r: 0, f: 'circulo' },
  { x: 560, y: 60, s: 18, r: 20, f: 'cuadro' },
  { x: 790, y: 78, s: 14, r: 0, f: 'circulo' },
  { x: 110, y: 560, s: 14, r: 0, f: 'circulo' },
  { x: 860, y: 640, s: 16, r: 45, f: 'cuadro' },
  { x: 300, y: 780, s: 12, r: 0, f: 'circulo' },
  { x: 700, y: 790, s: 16, r: 15, f: 'cuadro' },
];

// Plantilla (1200x850) del RECONOCIMIENTO por cumplir un reto.
// Es distinta al diploma de ahorro: tarjeta tipo "reto cumplido" con insignia de estrellas,
// confeti y colores cálidos. También usa el fondo del panel (FondoAdmin.png).
const ReconocimientoTemplate = forwardRef(({ nombre, reto, fecha, reflexion }, ref) => {
  const tipo = TIPOS[reto.tipo] || TIPOS.ahorro;
  const logro =
    reto.tipo === 'habito'
      ? `${reto.meta_dias} día${reto.meta_dias > 1 ? 's' : ''} de constancia`
      : `Meta de $${reto.meta_monto} alcanzada`;

  const largo = (nombre || '').length;
  const tamanoNombre = largo > 30 ? 34 : largo > 22 ? 40 : 48;
  const largoTitulo = (reto.titulo || '').length;
  const tamanoTitulo = largoTitulo > 40 ? 28 : largoTitulo > 26 ? 32 : 38;

  return (
    <div
      ref={ref}
      style={{
        width: '1200px',
        height: '850px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#eef2ff',
        backgroundImage: "url('/images/FondoAdmin.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        fontFamily: FUENTE,
        color: '#1f2a4d',
      }}
    >
      {/* Confeti */}
      {CONFETI.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            width: c.s,
            height: c.s,
            background: i % 2 ? tipo.color : '#FFCC00',
            borderRadius: c.f === 'circulo' ? '50%' : 3,
            transform: `rotate(${c.r}deg)`,
            opacity: 0.9,
          }}
        />
      ))}

      {/* Logo */}
      <div style={{ position: 'absolute', left: 64, top: 36, background: 'white', borderRadius: 14, padding: '6px 16px', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
        <img src="/images/Logos.png" alt="Alianza Caja Popular Cerano" style={{ height: 44, display: 'block' }} />
      </div>

      {/* Tarjeta principal */}
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 112,
          width: 720,
          height: 656,
          background: 'rgba(255,255,255,0.88)',
          border: `6px solid ${tipo.color}`,
          borderRadius: 36,
          boxShadow: `0 10px 0 ${tipo.oscuro}33`,
          boxSizing: 'border-box',
          padding: '34px 36px 24px 135px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 56,
        }}
      >
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: 5, color: tipo.oscuro }}>
          RECONOCIMIENTO · {tipo.etiqueta.toUpperCase()}
        </p>

        {/* Título tipo "sticker" */}
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            color: tipo.color,
            textShadow: `3px 3px 0 white, 6px 6px 0 ${tipo.oscuro}`,
          }}
        >
          ¡Reto cumplido!
        </p>

        <p style={{ margin: '22px 0 0', fontSize: 20, color: '#4b5878' }}>Se reconoce a</p>
        <p style={{ margin: '2px 0 0', fontSize: tamanoNombre, fontWeight: 700, color: '#004A99', lineHeight: 1.15 }}>
          {nombre}
        </p>

        <p style={{ margin: '10px 0 8px', fontSize: 20, color: '#4b5878' }}>por completar el reto</p>

        <div
          style={{
            background: tipo.suave,
            border: `3px dashed ${tipo.color}`,
            borderRadius: 20,
            padding: '10px 22px',
            maxWidth: 540,
          }}
        >
          <p style={{ margin: 0, fontSize: tamanoTitulo, fontWeight: 700, color: tipo.oscuro, lineHeight: 1.15 }}>
            {reto.titulo}
          </p>
        </div>

        <p
          style={{
            margin: '12px 0 0',
            padding: '5px 20px',
            background: tipo.color,
            color: 'white',
            borderRadius: 999,
            fontSize: 21,
            fontWeight: 600,
          }}
        >
          🏁 {logro}
        </p>

        {reflexion && (
          <p style={{ margin: '14px 0 0', fontSize: 19, fontStyle: 'italic', lineHeight: 1.3, maxWidth: 540, color: '#3a4668' }}>
            “{recortar(reflexion)}”
          </p>
        )}

        <p style={{ position: 'absolute', left: 135, right: 36, bottom: 22, margin: 0, textAlign: 'center', fontSize: 17, color: '#4b5878' }}>
          Caja Popular Cerano · {fechaLarga(fecha)}
        </p>
      </div>

      {/* Insignia de estrellas que sobresale del lado izquierdo de la tarjeta */}
      <div style={{ position: 'absolute', left: 36, top: 240, width: 250, height: 250 }}>
        <div style={{ position: 'absolute', inset: 10, background: '#FFCC00', borderRadius: 26, transform: 'rotate(0deg)' }} />
        <div style={{ position: 'absolute', inset: 10, background: '#FFCC00', borderRadius: 26, transform: 'rotate(30deg)' }} />
        <div style={{ position: 'absolute', inset: 10, background: '#FFCC00', borderRadius: 26, transform: 'rotate(60deg)' }} />
        <div
          style={{
            position: 'absolute',
            inset: 34,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${tipo.color}, ${tipo.oscuro})`,
            border: '6px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 92,
          }}
        >
          {tipo.emoji}
        </div>
      </div>
    </div>
  );
});

export default ReconocimientoTemplate;