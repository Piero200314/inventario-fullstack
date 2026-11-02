import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import CrudProductos from './components/Productos/crudProductos';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function Productos() {
  const navigate = useNavigate();

  function cerrarSesion() {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  }

  return (
    <>
      <nav className="navbar bg-dark navbar-dark">
        <div className="container">
          <span className="navbar-brand">Inventario</span>
          <button
            className="btn btn-outline-light"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <CrudProductos />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/productos"
          element={
            <ProtectedRoute>
              <Productos />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}