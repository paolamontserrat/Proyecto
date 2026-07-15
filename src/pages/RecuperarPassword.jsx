import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

function RecuperarPassword() {
  const [paso, setPaso] = useState('socio'); // 'socio' | 'responder'
  const [numeroSocio, setNumeroSocio] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleBuscar = async (e) => {
    e.preventDefault();
    setError('');

    const socioLimpio = numeroSocio.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,10}$/.test(socioLimpio)) {
      setError('El número de socio debe tener entre 8 y 10 caracteres');
      return;
    }

    setCargando(true);
    const { data, error: rpcError } = await supabase.rpc('obtener_pregunta_seguridad', {
      p_numero_socio: socioLimpio,
    });
    setCargando(false);

    if (rpcError || !data?.ok) {
      if (data?.error === 'sin_pregunta') {
        setError('Esta cuenta no tiene pregunta de seguridad. Pide ayuda en tu sucursal.');
      } else {
        setError('No encontramos ese número de socio o aún no está activado.');
      }
      return;
    }

    setPregunta(data.pregunta);
    setPaso('responder');
  };

  const handleRestablecer = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (nuevaPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    const { data, error: rpcError } = await supabase.rpc('recuperar_password', {
      p_numero_socio: numeroSocio.trim().toUpperCase(),
      p_respuesta: respuesta.trim(),
      p_nueva_password: nuevaPassword,
    });
    setCargando(false);

    if (rpcError || !data?.ok) {
      setError('La respuesta no es correcta. Intenta de nuevo o pide ayuda en tu sucursal.');
      return;
    }

    setExito(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="flex-1 flex items-center justify-center bg-cover bg-center px-4 py-10 relative"
        style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-alianza-azul text-center mb-2">
            Recuperar contraseña
          </h2>

          {exito ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-semibold">
                ¡Tu contraseña se actualizó correctamente!
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              {paso === 'socio' && (
                <form onSubmit={handleBuscar} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Número de socio"
                    value={numeroSocio}
                    onChange={(e) => setNumeroSocio(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    maxLength={10}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
                  />
                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
                  >
                    {cargando ? 'Buscando...' : 'Continuar'}
                  </button>
                </form>
              )}

              {paso === 'responder' && (
                <form onSubmit={handleRestablecer} className="space-y-4">
                  <p className="text-sm text-gray-700 font-semibold">{pregunta}</p>
                  <input
                    type="text"
                    placeholder="Tu respuesta"
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
                  />
                  <input
                    type="password"
                    placeholder="Confirma la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alianza-azul"
                  />
                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
                  >
                    {cargando ? 'Guardando...' : 'Restablecer contraseña'}
                  </button>
                </form>
              )}

              {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecuperarPassword;