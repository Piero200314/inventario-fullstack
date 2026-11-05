import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  Link,
} from "react-router-dom";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Theme from "./components/UI/Theme";
import { InventoryProvider } from "./context/Inventory";
import {useInventory} from "./context/inventory-context";
import InventoryPage from "./pages/InventoryPage";
import Suppliers from "./pages/Suppliers";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import { low } from "./services/analytics";
import "./App.css";
const links = [
  ["/resumen", "◫", "Resumen"],
  ["/productos", "▦", "Catálogo"],
  ["/stock-bajo", "△", "Stock y alertas"],
  ["/proveedores", "◇", "Proveedores"],
  ["/movimientos", "⇄", "Movimientos"],
  ["/reportes", "↗", "Reposición y reportes"],
];
function Shell() {
  const navigate = useNavigate(),
    [open, setOpen] = useState(false);
  const { items, error, loading, updated, load } = useInventory();
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {}
  useEffect(() => {
    const logout = () => navigate("/", { replace: true });
    window.addEventListener("nexo:logout", logout);
    return () => window.removeEventListener("nexo:logout", logout);
  }, [navigate]);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/", { replace: true });
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        Saltar al contenido
      </a>
      <button
        className="mobile-menu"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Abrir menú"
      >
        ☰
      </button>
      {open && (
        <button
          className="sidebar-shade"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="brand" to="/resumen">
          ◈{" "}
          <span>
            NEXO<small>GESTIÓN DE INVENTARIO</small>
          </span>
        </Link>
        <p className="workspace-label">ESPACIO DE TRABAJO</p>
        <nav aria-label="Menú principal">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-card">
            <span className="avatar">{user.nombre?.charAt(0) || "U"}</span>
            <div>
              <strong>{user.nombre || "Usuario"}</strong>
              <small>{user.rol}</small>
            </div>
          </div>
          <button className="secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <span className="top-title">
            Inventario / <b>Tu centro de control</b>
          </span>
          <div className="toolbar-actions">
            <Link
              className="secondary"
              to="/stock-bajo"
              aria-label={`${items.filter(low).length} alertas de stock`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>{" "}
              <span>{items.filter(low).length} alertas</span>
            </Link>
            <Theme />
          </div>
        </header>
        <main id="content" className="workspace">
          <div className="sync-line">
            <span role="status">
              {loading
                ? "Sincronizando…"
                : updated
                  ? `Actualizado a las ${updated.toLocaleTimeString("es-PE")}`
                  : "Esperando conexión"}
            </span>
            <button className="text-button" disabled={loading} onClick={load}>
              Sincronizar
            </button>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <Outlet />
        </main>
        <footer className="workspace-footer">
          NEXO · Existencias, personas y decisiones conectadas.
        </footer>
      </div>
    </div>
  );
}
function LoginPage() {
  return (
    <>
      <div className="login-theme">
        <Theme />
      </div>
      <Login />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <InventoryProvider>
                <Shell />
              </InventoryProvider>
            </ProtectedRoute>
          }
        >
          <Route path="resumen" element={<InventoryPage mode="summary" />} />
          <Route path="productos" element={<InventoryPage mode="catalog" />} />
          <Route path="stock-bajo" element={<InventoryPage mode="stock" />} />
          <Route path="proveedores" element={<Suppliers />} />
          <Route path="movimientos" element={<Movements />} />
          <Route path="reportes" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
