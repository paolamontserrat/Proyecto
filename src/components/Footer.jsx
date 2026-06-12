import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-sky-50 py-4 px-4 mt-8 border-t-2 border-alianza-amarillo text-[10px] md:text-xs">
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4 items-center">
        
        {/* Columna 1: Logo Grande */}
        <div className="flex justify-center">
          <img src="/images/Logo1.png" alt="Logo Alianza" className="w-50 object-contain" />
        </div>

        {/* Columna 2: Contacto */}
        <div className="text-blue-900 font-bold leading-tight">
          <p className="mb-1">ALIANZA CAJA POPULAR CERANO</p>
          <p className="mt-1 font-normal text-[9px]">J. Jesús Montaño 271, Centro, Cerano, Yuriria, Gto.</p>
          <p className="mt-1">800 237 2666</p>
          <a href="https://cpcerano.com.mx" className="text-blue-600 underline">cpcerano.com.mx</a>
        </div>

        {/* Columna 3: Redes Sociales */}
        <div className="flex flex-col gap-2">
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <img src="/images/Facebook.png" alt="FB" className="h-10 w-auto object-contain" />
            <span className="font-bold text-blue-900 truncate">CajaPopular</span>
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <img src="/images/Instagram.png" alt="IG" className="h-10 w-auto object-contain" />
            <span className="font-bold text-blue-900 truncate">cajapopular</span>
          </a>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;