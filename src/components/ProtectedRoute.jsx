import { Navigate } from 'react-router-dom';
// Componente que protege rutas para usuarios autenticados.
const ProtectedRoute = ({ children }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  // Si no hay usuario autenticado, redirige a la página de inicio de sesión.
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;