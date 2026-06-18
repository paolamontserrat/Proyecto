import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-sky-50 py-6 px-4 mt-8 border-t-2 border-alianza-amarillo text-[10px] md:text-xs">
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
        
        {/* Columna 1: Logo */}
        <div className="flex justify-center">
          <img 
            src="/images/Logo1.png" 
            alt="Logo Alianza" 
            className="w-32 sm:w-40 md:w-48 object-contain" 
          />
        </div>

        {/* Columna 2: Contacto */}
        <div className="text-blue-900 font-bold leading-tight text-center md:text-left">
          <p className="mb-1">ALIANZA CAJA POPULAR CERANO</p>
          <p className="mt-1 font-normal text-[9px] sm:text-[10px]">
            J. Jesús Montaño 271, Centro, Cerano, Yuriria, Gto.
          </p>
          <p className="mt-1">800 237 2666</p>
          <a 
            href="https://cpcerano.com.mx" 
            className="text-blue-600 underline"
          >
            cpcerano.com.mx
          </a>
        </div>

        {/* Columna 3: Redes */}
        <div className="flex flex-col gap-3 items-center md:items-start">

          <a 
            href="https://www.facebook.com/CajaPopularCerano/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <img src="/images/Facebook.png" className="h-8 md:h-10 object-contain" />
            <span className="font-bold text-blue-900 text-xs sm:text-sm">
              Caja Popular Cerano
            </span>
          </a>

          <a 
            href="https://www.instagram.com/cajapopularcerano/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <img src="/images/Instagram.png" className="h-8 md:h-10 object-contain" />
            <span className="font-bold text-blue-900 text-xs sm:text-sm">
              cajapopularcerano
            </span>
          </a>

          <a 
            href="https://www.youtube.com/channel/UCwxA2Z92MgJLGWHWz1Ilkww" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <img src="/images/Youtube.png" className="h-10 md:h-12 object-contain ml-2" />
            <span className="font-bold text-blue-900 text-xs sm:text-sm">
              Caja Popular Cerano Alianza
            </span>
          </a>

        </div>

        {/* Columna 4: Imágenes */}
        <div className="flex flex-col items-center gap-3">
          <img 
            src="/images/5.png" 
            alt="Imagen 5" 
            className="w-16 sm:w-20 md:w-24 object-contain"
          />
          <img 
            src="/images/Logos.png" 
            alt="Logos" 
            className="w-24 sm:w-32 md:w-40 object-contain"
          />
        </div>

      </div>

    </footer>
  );
};

export default Footer;