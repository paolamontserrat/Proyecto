import { Navigate } from 'react-router-dom';

function AdminProtectedRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminProtectedRoute;