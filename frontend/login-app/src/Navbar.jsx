import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(sessionStorage.getItem("usuario") || '{"nombre":""}');
  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const links = [
    { label: "Home",        path: "/home" },
    { label: "Facts Waves", path: "/waves" },
    { label: "Graphics",    path: "/graphics" },
  ];

  return (
    <nav className="home-nav">
      <span className="nav-logo">Brainwaves</span>

      <div className="nav-links">
        {links.map(({ label, path }) => (
          <span
            key={path}
            className={`nav-link ${location.pathname === path ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="nav-user">
        {/* Slot para botones extra (ej: dark mode en Waves) */}
        {children}
        <div className="avatar">{initials}</div>
        <span className="nav-nombre">{usuario.nombre}</span>
        <button className="logout-btn" onClick={() => { sessionStorage.clear(); navigate("/"); }}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
