import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import App from "./App";
import "./index.css";
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error) {
    console.error("NEXO:", error);
  }
  render() {
    return this.state.error ? (
      <main className="recovery">
        <h1>No pudimos mostrar esta vista.</h1>
        <p>
          Desactiva la traducción automática de esta página y vuelve a
          intentarlo. Los datos guardados permanecen en el servidor.
        </p>
        <button onClick={() => location.reload()}>Volver a cargar</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>,
);
