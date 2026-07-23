import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Passport from "./pages/Passport";
import ContenedorActividades from "./components/actividades/ContenedorActividades";
import ProtectedRoute from "./components/ProtectedRoute";
import RecuperarPassword from "./pages/RecuperarPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminAhorros from './pages/admin/AdminAhorros';
import AdminCiclos from './pages/admin/AdminCiclos';
import AdminConfiguracion from './pages/admin/AdminConfiguracion';
import AdminContenido from './pages/admin/AdminContenido';




function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 pública */}
        <Route path="/" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
          
        >
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="ahorros" element={<AdminAhorros />} />
          <Route path="ciclos" element={<AdminCiclos />} />
          <Route path="configuracion" element={<AdminConfiguracion />} />   
          <Route path="contenido" element={<AdminContenido />} />
        </Route>

        {/* 🔐 protegidas */}
        <Route
          path="/dashboard/:rango"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pasaporte/:rango"
          element={
            <ProtectedRoute>
              <Passport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/actividades/:rango"
          element={
            <ProtectedRoute>
              <ContenedorActividades />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
