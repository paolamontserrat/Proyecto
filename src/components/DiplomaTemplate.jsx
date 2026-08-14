import { forwardRef } from 'react';

const DiplomaTemplate = forwardRef(({ nombre, numero, fecha }, ref) => {
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
          padding: '40px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <img src="/images/Logo2.png" alt="Logo" style={{ width: '130px', marginBottom: '16px' }} />
        <p style={{ fontSize: '26px', letterSpacing: '5px', textTransform: 'uppercase', color: '#FACC15', margin: 0 }}>
          Diploma de reconocimiento
        </p>
        <p style={{ fontSize: '18px', marginTop: '24px', opacity: 0.85 }}>Programa Creciendo Juntos</p>
        <p style={{ fontSize: '52px', fontWeight: 900, margin: '24px 0' }}>{nombre}</p>
        <p style={{ fontSize: '20px', maxWidth: '700px', lineHeight: 1.6, margin: 0 }}>
          Por su constancia y compromiso con el ahorro, ha obtenido el
        </p>
        <p style={{ fontSize: '38px', fontWeight: 900, color: '#FACC15', margin: '16px 0' }}>
          Diploma #{numero}
        </p>
        <p style={{ fontSize: '15px', marginTop: '30px', opacity: 0.7 }}>
          Caja Popular Cerano · {fecha}
        </p>
      </div>
    </div>
  );
});

export default DiplomaTemplate;