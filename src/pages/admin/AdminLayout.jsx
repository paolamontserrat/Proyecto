import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, PiggyBank, Award, Settings, FileText, LogOut } from 'lucide-react';

const ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/ahorros', label: 'Ahorros y sellos', icon: PiggyBank },
  { to: '/admin/ciclos', label: 'Ciclos', icon: Award },
  //{ to: '/admin/contenido', label: 'Contenido', icon: FileText },
  { to: '/admin/configuracion', label: 'Ajustes', icon: Settings },
];


function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const estaActivo = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-alianza-azul to-blue-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col items-center justify-center">
            <img src="/images/LogoBlanco.png" alt="Logo" className="w-50 h-50 mb-3"/>
            <div className="text-center">
              <p className="font-black text-lg leading-tight">Administrador</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const activo = estaActivo(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activo
                    ? "bg-alianza-amarillo text-alianza-azul shadow"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main
        className="flex-1 relative overflow-y-auto"
        style={{
          backgroundImage: "url('/images/FondoAdmin.png')",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
        }}
      >
        <div className="min-h-screen bg-white/85 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
