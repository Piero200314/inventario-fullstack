import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(event) {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { data } = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      if (!data.token) {
        throw new Error('El servidor no devolvió un token.');
      }

      localStorage.setItem('token', data.token);
      navigate('/productos', { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.error ||
          'No se pudo iniciar sesión. Revisa tus datos y el backend.'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-2">Iniciar sesión</h1>
          <p className="text-secondary mb-4">
            Ingresa para gestionar el inventario.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}