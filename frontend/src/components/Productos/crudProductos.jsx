import { useEffect, useState } from 'react';
import api from '../../services/api';
const vacio = { id: null, nombre: '', descripcion: '', precio: '', stock: '' };
const mensajeError = e => e.response?.data?.error || 'No se pudo conectar con el backend. Comprueba MySQL y el servidor del puerto 3006.';
export default function CrudProductos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ ...vacio });
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);
  async function cargar() {
    const { data } = await api.get('/productos');
    setProductos(data);
  }
  useEffect(() => {
    let activo = true;
    api.get('/productos').then(({data}) => { if (activo) setProductos(data); })
      .catch(e => { if (activo) setError(mensajeError(e)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);
  function cambiar(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function guardar(e) {
    e.preventDefault(); setError(''); setAviso(''); setOcupado(true);
    try {
      const datos = { nombre: form.nombre.trim(), descripcion: form.descripcion, precio: Number(form.precio), stock: Number(form.stock) };
      if (!datos.nombre) throw new Error('Ingresa un nombre válido.');
      if (form.id) await api.put(`/productos/${form.id}`, datos);
      else await api.post('/productos', datos);
      setForm({ ...vacio });
      setAviso('Producto guardado correctamente.');
      await cargar();
    } catch (e) { setError(e.response ? mensajeError(e) : e.message); }
    finally { setOcupado(false); }
  }
  async function eliminar(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    setOcupado(true); setError(''); setAviso('');
    try {
      await api.delete(`/productos/${id}`);
      if (form.id === id) setForm({ ...vacio });
      setAviso('Producto eliminado correctamente.');
      await cargar();
    } catch (e) { setError(mensajeError(e)); }
    finally { setOcupado(false); }
  }
  return <main className="container py-4">
    <h1 className="h2 mb-2">Gestión de productos</h1>
    <p className="text-secondary mb-4">Inventario · Laboratorio 8</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
    <div className="row g-4">
      <section className="col-lg-4">
        <div className="card shadow-sm"><div className="card-body">
          <h2 className="h5 mb-3">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
          <form onSubmit={guardar}>
            <fieldset disabled={ocupado}>
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input id="nombre" name="nombre" className="form-control mb-3" value={form.nombre} onChange={cambiar} required maxLength={255} />
              <label htmlFor="descripcion" className="form-label">Descripción</label>
              <textarea id="descripcion" name="descripcion" className="form-control mb-3" value={form.descripcion || ''} onChange={cambiar} />
              <label htmlFor="precio" className="form-label">Precio (S/)</label>
              <input id="precio" name="precio" type="number" min="0" max="99999999.99" step="0.01" className="form-control mb-3" value={form.precio} onChange={cambiar} required />
              <label htmlFor="stock" className="form-label">Stock</label>
              <input id="stock" name="stock" type="number" min="0" max="2147483647" step="1" className="form-control mb-3" value={form.stock} onChange={cambiar} required />
              <button className="btn btn-primary w-100" type="submit">{ocupado ? 'Procesando...' : form.id ? 'Actualizar' : 'Guardar'}</button>
              {form.id && <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={() => setForm({ ...vacio })}>Cancelar edición</button>}
            </fieldset>
          </form>
        </div></div>
      </section>
      <section className="col-lg-8">
        <h2 className="h5">Lista de productos</h2>
        <div className="table-responsive bg-white rounded shadow-sm">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead className="table-dark"><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
            <tbody>
              {productos.map(p => <tr key={p.id}>
                <td>{p.id}</td><td>{p.nombre}</td><td className="text-nowrap">S/ {Number(p.precio).toFixed(2)}</td><td>{p.stock}</td>
                <td><div className="d-flex gap-2">
                  <button disabled={ocupado} className="btn btn-warning btn-sm" onClick={() => { setForm({ ...p }); setAviso(''); }}>Editar</button>
                  <button disabled={ocupado} className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)}>Eliminar</button>
                </div></td>
              </tr>)}
              {!productos.length && <tr><td colSpan={5} className="text-center text-secondary py-4">{cargando ? 'Cargando productos...' : 'No hay productos registrados.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>;
}
