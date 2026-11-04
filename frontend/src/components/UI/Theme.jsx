import { useEffect, useState } from "react";
export default function Theme() {
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem("nexo:theme") ||
        (matchMedia("(prefers-color-scheme:light)").matches ? "light" : "dark")
      );
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nexo:theme", theme);
    } catch {}
  }, [theme]);
  return (
    <button
      className="secondary theme"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={`Activar tema ${theme === "dark" ? "claro" : "oscuro"}`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>{" "}
      <span>Tema {theme === "dark" ? "claro" : "oscuro"}</span>
    </button>
  );
}
