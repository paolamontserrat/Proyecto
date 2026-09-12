import { Navigate } from 'react-router-dom';

// Envoltura para proteger rutas del panel administrativo.
function AdminProtectedRoute({ children }) {
  // Lee al usuario guardado en el navegador al iniciar sesión.
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  // Si no hay sesión iniciada, o el usuario no tiene rol de administrador,
  // lo regresa a la página principal en lugar de dejarlo entrar.
  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  // Si es admin, deja pasar y renderiza la pantalla protegida.
  return children;
}

export default AdminProtectedRoute;