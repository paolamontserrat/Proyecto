import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

// Preguntas de seguridad sugeridas para la activación de cuenta.
// Puedes editar esta lista libremente.
const PREGUNTAS_SEGURIDAD = [
  '¿Cuál es el nombre de tu mascota?',
  '¿Cuál es tu color favorito?',
  '¿Cuál es el nombre de tu mejor amigo(a)?',
  '¿En qué ciudad naciste?',
];

function Login() {
  // 'socio'  -> pantalla inicial, se captura el número de socio
  // 'activar'-> primer ingreso, el menor crea su contraseña
  // 'login'  -> ingreso normal, ya tiene contraseña
  const [paso, setPaso] = useState('socio');

  const [numeroSocio, setNumeroSocio] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pregunta, setPregunta] = useState(PREGUNTAS_SEGURIDAD[0]);
  const [respuesta, setRespuesta] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const limpiarMensajes = () => setError('');

  const guardarSesion = (data) => {
    localStorage.removeItem('usuario');
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        id: data.id,
        numero_socio: numeroSocio,
        nivel: data.nivel,
        nombre: data.nombre,
        rol: data.rol || 'menor',
      })
    );
  };

  const volverInicio = () => {
    setPaso('socio');
    setPassword('');
    setConfirmPassword('');
    setRespuesta('');
    limpiarMensajes();
  };

  // =========================
  // PASO 1: Verificar número de socio
  // =========================
  const handleContinuar = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    const socioLimpio = numeroSocio.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,10}$/.test(socioLimpio)) {
      setError('El número de socio debe tener entre 8 y 10 dígitos');
      return;
    }

    setCargando(true);

    const { data, error: dbError } = await supabase
      .from('usuarios')
      .select('nombre, activado')
      .eq('numero_socio', socioLimpio)
      .maybeSingle();

    setCargando(false);

    if (dbError) {
      setError('Ocurrió un problema al verificar tu número de socio. Intenta de nuevo.');
      return;
    }

    if (!data) {
      setError('No encontramos ese número de socio. Verifica con tu sucursal.');
      return;
    }

    setNombreUsuario(data.nombre || '');
    setPaso(data.activado ? 'login' : 'activar');
  };

  // =========================
  // PASO 2A: Activar cuenta (primer ingreso)
  // =========================
  const handleActivar = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!respuesta.trim()) {
      setError('Responde la pregunta de seguridad, te servirá si olvidas tu contraseña');
      return;
    }

    setCargando(true);

    const { data, error: rpcError } = await supabase.rpc('activar_cuenta', {
      p_numero_socio: numeroSocio.trim().toUpperCase(),
      p_password: password,
      p_pregunta: pregunta,
      p_respuesta: respuesta.trim(),
    });

    setCargando(false);

    if (rpcError || !data?.ok) {
      setError('No se pudo crear tu contraseña. Intenta de nuevo o contacta a tu sucursal.');
      return;
    }

    guardarSesion(data);
    navigate(data.rol === 'admin' ? '/admin' : `/dashboard/${data.nivel}`);
  };

  // =========================
  // PASO 2B: Login normal
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    if (!password) {
      setError('Escribe tu contraseña');
      return;
    }

    setCargando(true);

    const { data, error: rpcError } = await supabase.rpc('login_usuario', {
      p_numero_socio: numeroSocio.trim().toUpperCase(),
      p_password: password,
    });

    setCargando(false);

    if (rpcError || !data?.ok) {
      setError('Número de socio o contraseña incorrectos');
      return;
    }

    guardarSesion(data);
    navigate(data.rol === 'admin' ? '/admin' : `/dashboard/${data.nivel}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* CONTENIDO */}
      <div
        className="flex-1 flex items-center justify-center bg-cover bg-center px-4 py-10 relative"
        style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <img src="/images/Logo2.png" alt="Logo" className="w-32 sm:w-36 mb-2" />
            <h2 className="text-xl sm:text-2xl font-bold text-alianza-azul text-center">
              {paso === 'activar' && nombreUsuario
                ? `¡Hola, ${nombreUsuario}!`
                : '¡Bienvenido!'}
            </h2>
            <p className="text-gray-600 text-sm text-center">
              {paso === 'socio' && 'Ingresa tu número de socio para continuar'}
              {paso === 'activar' && 'Es tu primera vez aquí, crea tu contraseña'}
              {paso === 'login' && 'Escribe tu contraseña para continuar'}
            </p>
          </div>

          {/* PASO 1: NÚMERO DE SOCIO */}
          {paso === 'socio' && (
            <form onSubmit={handleContinuar} className="space-y-4">
              <input
                type="text"
                inputMode="text"
                placeholder="Número de socio"
                value={numeroSocio}
                onChange={(e) => setNumeroSocio(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                maxLength={10}
                required
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
              />

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
              >
                {cargando ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          {/* PASO 2A: ACTIVAR CUENTA */}
          {paso === 'activar' && (
            <form onSubmit={handleActivar} className="space-y-4">
              <input
                type="password"
                placeholder="Crea tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
              />

              <input
                type="password"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
              />

              <select
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul bg-white"
              >
                {PREGUNTAS_SEGURIDAD.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Tu respuesta"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
              />

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
              >
                {cargando ? 'Creando cuenta...' : 'Crear contraseña y entrar'}
              </button>

              <button
                type="button"
                onClick={volverInicio}
                className="w-full text-alianza-azul text-sm font-semibold py-1"
              >
                ← Usar otro número de socio
              </button>
            </form>
          )}

          {/* PASO 2B: LOGIN NORMAL */}
          {paso === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-alianza-azul"
              />

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-alianza-azul text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
              >
                {cargando ? 'Entrando...' : 'Iniciar sesión'}
              </button>

              <div className="flex justify-between text-xs">
                <button type="button" onClick={volverInicio} className="text-alianza-azul font-semibold">
                  ← Otro número de socio
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/recuperar-password')}
                  className="text-gray-500 font-semibold"
                >
                  Olvidé mi contraseña
                </button>
              </div>
            </form>
          )}

          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          <p className="text-center text-red-500 mt-6">Nuevo panel de administración </p>
          <p className="text-center text-red-500">Número de socio: ADMIN0001 contraseña: ADMIN0001</p>

          <p className="text-xs text-center text-gray-500 mt-6">
            Aprender juntos, crecer siempre 💛
          </p>
          <p>Número de socio: 10000001 contraseña: 1234 usuario: prueba0-5</p>
          <p>Número de socio: 10000002 contraseña: 1234 usuario: prueba6-8</p>
          <p>Número de socio: 10000003 contraseña: 1234 usuario: prueba1</p>
          <p>Número de socio: 10000004 contraseña: 1234 usuario: prueba2</p>
          <p>Número de socio: 10000005 contraseña: 1234 usuario: prueba9-12</p>
          <p>Número de socio: 10000006 contraseña: 1234 usuario: prueba3</p>
          <p>Número de socio: 10000007 contraseña: 1234 usuario: prueba13-15</p>
          <p>Número de socio: 10000008 contraseña: 1234 usuario: prueba4</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;