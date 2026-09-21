import { forwardRef } from 'react';

const TIPOS = {
  ahorro: { emoji: '💰' },
  habito: { emoji: '🌱' },
};

const fechaLarga = (iso) =>
  new Date(iso || Date.now()).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });

// Reflexión muy larga no cabe en el diploma: se recorta.
const recortar = (texto, max = 140) =>
  texto.length > max ? texto.slice(0, max - 1).trimEnd() + '…' : texto;

// Plantilla (1200x850) del reconocimiento por cumplir un reto.
// Mismo estilo que el diploma, pero con el nombre del reto que cumplió el niño.
const ReconocimientoTemplate = forwardRef(({ nombre, reto, fecha, reflexion }, ref) => {
  const tipo = TIPOS[reto.tipo] || TIPOS.ahorro;
  const logro =
    reto.tipo === 'habito'
      ? `${reto.meta_dias} día${reto.meta_dias > 1 ? 's' : ''} de constancia`
      : `Meta de $${reto.meta_monto} alcanzada`;

  return (
    <div
      ref={ref}
      style={{
        width: '1200px',
        height: '850px',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1e3a8a 60%, #1e40af 100%)',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          border: '10px solid #FACC15',
          borderRadius: '28px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 60px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <img src="/images/LogoBlanco.png" alt="Logo" style={{ width: '110px', marginBottom: '12px' }} />
        <p style={{ fontSize: '26px', letterSpacing: '5px', textTransform: 'uppercase', color: '#FACC15', margin: 0 }}>
          Reconocimiento
        </p>
        <p style={{ fontSize: '18px', marginTop: '14px', opacity: 0.85 }}>Programa Creciendo Juntos</p>
        <p style={{ fontSize: '50px', fontWeight: 900, margin: '18px 0 10px' }}>{nombre}</p>
        <p style={{ fontSize: '20px', margin: 0 }}>por cumplir el reto</p>

        <p style={{ fontSize: '64px', margin: '14px 0 0', lineHeight: 1 }}>{tipo.emoji}</p>
        <p style={{ fontSize: '38px', fontWeight: 900, color: '#FACC15', margin: '10px 0 8px', maxWidth: '900px', lineHeight: 1.2 }}>
          {reto.titulo}
        </p>
        <p style={{ fontSize: '20px', opacity: 0.9, margin: 0 }}>{logro}</p>

        {reflexion && (
          <p style={{ fontSize: '18px', fontStyle: 'italic', opacity: 0.85, maxWidth: '820px', lineHeight: 1.4, margin: '22px 0 0' }}>
            “{recortar(reflexion)}”
          </p>
        )}

        <p style={{ fontSize: '15px', marginTop: '28px', opacity: 0.7 }}>
          Caja Popular Cerano · {fechaLarga(fecha)}
        </p>
      </div>
    </div>
  );
});

export default ReconocimientoTemplate;