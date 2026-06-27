import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;