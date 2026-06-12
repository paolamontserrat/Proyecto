import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Passport from './pages/Passport';
import Dashboard from './pages/Dashboard';
// Importamos el nuevo contenedor
import ContenedorActividades from './components/actividades/ContenedorActividades';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/:rango" element={<Dashboard />} />
        <Route path="/pasaporte/:rango" element={<Passport />} />
        {/* Nueva ruta para las actividades dinámicas */}
        <Route path="/actividades/:rango" element={<ContenedorActividades />} />
      </Routes>
    </Router>
  );
}

export default App;