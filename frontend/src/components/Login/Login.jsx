import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });
      if (!data.token) throw new Error();
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario || {}));
      navigate("/productos", { replace: true });
    } catch (e) {
      setError(
        e.response?.data?.error || "No se pudo conectar. Comprueba el backend.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-art">
        <a className="brand" href="/">
          ◈{" "}
          <span>
            NEXO<small>INVENTORY SYSTEM</small>
          </span>
        </a>
        <div className="orbital">
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="core">N</div>
        </div>
        <div>
          <span className="eyebrow">CONTROL / PRECISIÓN / CONEXIÓN</span>
          <h1>
            Tu inventario.
            <br />
            <em>Otra dimensión.</em>
          </h1>
          <p>
            Un espacio para organizar tus productos y mantener el stock bajo
            control.
          </p>
        </div>
        <span className="micro">FULLSTACK EXPERIENCE · LABORATORIO 09</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">ACCESO AL SISTEMA</span>
          <h2>
            Bienvenido de nuevo<span className="red">.</span>
          </h2>
          <p>Inicia sesión para entrar a tu espacio de trabajo.</p>
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <button className="primary full" disabled={busy}>
              {busy ? "Conectando…" : "Ingresar al sistema →"}
            </button>
          </form>
          <div className="login-foot">
            <span className="status-dot" /> Acceso con autenticación JWT
          </div>
        </div>
      </section>
    </main>
  );
}
