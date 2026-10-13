import { forwardRef } from 'react';

const FUENTE = "'Fredoka','Baloo 2','Trebuchet MS',Arial,sans-serif";
const AZUL = '#004A99';
const AZUL_OSCURO = '#00316B';
const AMARILLO = '#FFCC00';
const AMARILLO_OSCURO = '#D9A400';

// Estrella de 5 puntas en SVG (se dibuja bien con html2canvas)
const Estrella = ({ size = 40, color = AMARILLO, borde = AMARILLO_OSCURO }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 2.2l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17l-6 3.3 1.3-6.6L2.4 9.1l6.7-.8z"
      fill={color}
      stroke={borde}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

// Esquina decorativa del marco
const Esquina = ({ style }) => (
  <div style={{ position: 'absolute', ...style }}>
    <Estrella size={46} />
  </div>
);

// Plantilla (1200x850) del DIPLOMA DE AHORRO: se obtiene al juntar 3 sellos.
// Usa el fondo del panel de administración (FondoAdmin.png). La mascota queda abajo a la derecha,
// por eso todo el contenido se acomoda en la parte izquierda y central.
const DiplomaTemplate = forwardRef(({ nombre, numero, fecha }, ref) => {
  const largo = (nombre || '').length;
  const tamanoNombre = largo > 30 ? 40 : largo > 22 ? 50 : 66;

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
        color: AZUL_OSCURO,
      }}
    >
      {/* Marco doble: dorado sólido por fuera, azul punteado por dentro */}
      <div style={{ position: 'absolute', inset: 22, border: `7px solid ${AMARILLO}`, borderRadius: 32 }} />
      <div style={{ position: 'absolute', inset: 40, border: `2px dashed ${AZUL}`, borderRadius: 22, opacity: 0.5 }} />
      <Esquina style={{ top: 2, left: 2 }} />
      <Esquina style={{ top: 2, right: 2 }} />
      <Esquina style={{ bottom: 2, left: 2 }} />
      <Esquina style={{ bottom: 2, right: 2 }} />

      {/* Contenido principal (columna izquierda, deja libre a la mascota) */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 62,
          width: 780,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ background: 'white', borderRadius: 14, padding: '6px 18px', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
          <img src="/images/Logos.png" alt="Alianza Caja Popular Cerano" style={{ height: 50, display: 'block' }} />
        </div>

        {/* Listón con el título */}
        <div
          style={{
            marginTop: 24,
            padding: '10px 64px 12px',
            background: `linear-gradient(180deg, #0b66d1 0%, ${AZUL} 100%)`,
            color: 'white',
            borderRadius: 16,
            fontSize: 50,
            fontWeight: 700,
            letterSpacing: 10,
            boxShadow: `0 7px 0 ${AZUL_OSCURO}`,
            border: `3px solid ${AMARILLO}`,
          }}
        >
          DIPLOMA
        </div>
        <p style={{ margin: '22px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: 6, color: AMARILLO_OSCURO }}>
          DE AHORRADOR CONSTANTE
        </p>

        <p style={{ margin: '20px 0 0', fontSize: 24, color: '#3b5b8c' }}>Se otorga con orgullo a</p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: tamanoNombre,
            fontWeight: 700,
            color: AZUL,
            lineHeight: 1.15,
            maxWidth: 760,
            paddingBottom: 6,
            borderBottom: `6px solid ${AMARILLO}`,
          }}
        >
          {nombre}
        </p>

        <p style={{ margin: '18px 0 0', fontSize: 25, lineHeight: 1.4, maxWidth: 640, color: '#27406b' }}>
          por ahorrar con constancia y completar <b>3 sellos</b> en su pasaporte de ahorro
        </p>

        {/* Los 3 sellos ganados */}
        <div style={{ display: 'flex', gap: 22, marginTop: 20 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'white',
                border: `4px solid ${AZUL}`,
                boxShadow: `0 0 0 4px ${AMARILLO}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${(i - 1) * 8}deg)`,
              }}
            >
              <Estrella size={46} />
            </div>
          ))}
        </div>
      </div>

      {/* Medalla con el número de diploma */}
      <div style={{ position: 'absolute', left: 92, top: 612, width: 170, height: 200 }}>
        {/* Colas del listón */}
        <div
          style={{
            position: 'absolute', left: 22, top: 118, width: 52, height: 82,
            background: AZUL, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: 96, top: 118, width: 52, height: 82,
            background: AMARILLO_OSCURO, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
          }}
        />
        {/* Sello en forma de flor/estrella (dos cuadrados girados) */}
        <div style={{ position: 'absolute', left: 8, top: 0, width: 154, height: 154 }}>
          <div style={{ position: 'absolute', inset: 14, background: AMARILLO, borderRadius: 14, transform: 'rotate(22deg)' }} />
          <div style={{ position: 'absolute', inset: 14, background: AMARILLO, borderRadius: 14, transform: 'rotate(-22deg)' }} />
          <div style={{ position: 'absolute', inset: 14, background: AMARILLO, borderRadius: 14 }} />
          <div
            style={{
              position: 'absolute', inset: 24, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, #1a7be8, ${AZUL})`,
              border: '4px solid white',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}
          >
            <span style={{ fontSize: 15, letterSpacing: 2, lineHeight: 1 }}>N.º</span>
            <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{numero}</span>
          </div>
        </div>
      </div>

      {/* Pie del diploma */}
      <div style={{ position: 'absolute', left: 300, top: 700, width: 560, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: AZUL }}>¡Tu constancia te hace crecer!</p>
        <p style={{ margin: '6px 0 0', fontSize: 19, color: '#3b5b8c' }}>
          Programa Creciendo Juntos · Caja Popular Cerano
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 19, color: '#3b5b8c' }}>{fecha}</p>
      </div>
    </div>
  );
});

export default DiplomaTemplate;