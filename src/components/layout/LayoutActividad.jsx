import React from 'react';

const LayoutActividad = ({ children, fondo }) => {
  return (
    <div
      className="min-h-screen p-4 flex flex-col"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md md:max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default LayoutActividad;