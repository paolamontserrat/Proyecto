import { Outlet, useNavigate, Link } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-alianza-azul text-white p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-6">Admin</h2>
        <Link to="/admin" className="block py-2 px-3 rounded hover:bg-blue-800">Dashboard</Link>
        <Link to="/admin/usuarios" className="block py-2 px-3 rounded hover:bg-blue-800">Usuarios</Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left py-2 px-3 rounded hover:bg-blue-800 mt-auto"
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;