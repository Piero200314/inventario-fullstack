import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import api from "../services/api";
const Context = createContext(null);
export const useInventory = () => useContext(Context);
export function InventoryProvider({ children }) {
  const [data, setData] = useState({ items: [], suppliers: [], moves: [] });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [updated, setUpdated] = useState(null);
  const version = useRef(0),
    request = useRef(0),
    mounted = useRef(true),
    lastLoad = useRef(0);
  const load = useCallback(async () => {
    const id = ++request.current,
      revision = version.current;
    setLoading(true);
    try {
      const result = await Promise.all([
        api.get("/productos"),
        api.get("/api/proveedores"),
        api.get("/api/movimientos"),
      ]);
      if (result.some((r) => !Array.isArray(r.data)))
        throw Error("Respuesta inesperada.");
      if (
        mounted.current &&
        id === request.current &&
        revision === version.current
      ) {
        setData({
          items: result[0].data,
          suppliers: result[1].data,
          moves: result[2].data,
        });
        setError("");
        setUpdated(new Date());
        lastLoad.current = Date.now();
      }
    } catch (e) {
      if (
        mounted.current &&
        id === request.current &&
        revision === version.current
      )
        setError(
          e.response?.data?.error ||
            "No se pudo sincronizar. Se muestran los últimos datos disponibles.",
        );
    } finally {
      if (mounted.current && id === request.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    load();
    const focus = () => {
      if (!document.hidden && Date.now() - lastLoad.current > 30000) load();
    };
    const timer = setInterval(focus, 60000);
    window.addEventListener("focus", focus);
    return () => {
      mounted.current = false;
      request.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  function commit(fn) {
    version.current++;
    setData(fn);
    setError("");
    setUpdated(new Date());
  }
  async function saveProduct(p) {
    const { data: response } = p.id
      ? await api.put(`/productos/${p.id}`, p)
      : await api.post("/productos", p);
    const { apertura, ...record } = response;
    commit((s) => ({
      ...s,
      items: [record, ...s.items.filter((i) => i.id !== record.id)],
      moves: apertura ? [apertura, ...s.moves] : s.moves,
    }));
    return record;
  }
  async function archive(p) {
    await api.delete(`/productos/${p.id}`, { data: { revision: p.revision } });
    commit((s) => ({ ...s, items: s.items.filter((i) => i.id !== p.id) }));
  }
  async function saveSupplier(p) {
    const { data: record } = p.id
      ? await api.put(`/api/proveedores/${p.id}`, p)
      : await api.post("/api/proveedores", p);
    commit((s) => ({
      ...s,
      suppliers: [record, ...s.suppliers.filter((i) => i.id !== record.id)],
    }));
  }
  async function move(p) {
    const { data: r } = await api.post("/api/movimientos", p);
    commit((s) => ({
      ...s,
      items: [r.producto, ...s.items.filter((i) => i.id !== r.producto.id)],
      moves: [r.movimiento, ...s.moves.filter((i) => i.id !== r.movimiento.id)],
    }));
  }
  return (
    <Context.Provider
      value={{
        ...data,
        loading,
        error,
        updated,
        load,
        saveProduct,
        archive,
        saveSupplier,
        move,
      }}
    >
      {children}
    </Context.Provider>
  );
}
