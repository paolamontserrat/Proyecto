import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .eq('password', password)
      .single();

    if (error || !data) {
      setError('Usuario o contraseña incorrectos');
      return;
    }

    localStorage.removeItem('usuario');

    localStorage.setItem('usuario', JSON.stringify({
      id: data.id,
      usuario: data.usuario,
      nivel: data.nivel,
      nombre: data.nombre

    }));

    navigate(`/dashboard/${data.nivel}`);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* CONTENIDO */}
      <div
        className="flex-1 flex items-center justify-center bg-cover bg-center px-4 py-10"
        style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
      >
        {/* Overlay para mejorar contraste */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Card */}
        <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/images/Logo2.png"
              alt="Logo"
              className="w-32 sm:w-36 mb-2"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-alianza-azul text-center">
              ¡Bienvenido!
            </h2>
            <p className="text-gray-600 text-sm text-center">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            <input
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
            />

            <button
              type="submit"
              className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              Iniciar sesión
            </button>
          </form>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">
              {error}
            </p>
          )}

          {/* Frase */}
          <p className="text-xs text-center text-gray-500 mt-6">
            Aprender juntos, crecer siempre 💛
          </p>
          <p className="text-xs text-center text-black mt-6">
            Usuarios de prueba:
          </p>
          <p className="text-xs text-center text-black mt-6">
            De 0-5   Usuario: prueba0-5  o  prueba1  Contraseña: 1234
          </p>
          <p className="text-xs text-center text-black mt-6">
            De 6-8   Usuario: prueba6-8  o  prueba2 Contraseña: 1234
          </p>
          <p className="text-xs text-center text-black mt-6">
            De 9-12 Usuario:prueba9-12 o prueba3  Contraseña:1234
          </p>
          {/*<p className="text-xs text-center text-black mt-6">
            De 13-15 Usuario:prueba13-15 o prueba4 Contraseña:1234
          </p>
          <p className="text-xs text-center text-black mt-6">
            De 16-17 Usuario:prueba16-17 o prueba5 Contraseña:1234
          </p>*/}
        </div>
      </div>

      {/* 🔻 FOOTER SIEMPRE ABAJO */}
      <Footer />
    </div>
  );
}

export default Login;