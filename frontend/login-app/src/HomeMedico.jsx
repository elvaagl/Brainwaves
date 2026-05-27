import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeMedico.css";

const MOCK_TOTAL     = 12;
const MOCK_ALERTAS   = 2;
const MOCK_ULTIMA    = "hace 3 min";

export default function HomeMedico() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({ nombre: "Médico" });

  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) { navigate("/"); return; }
    const parsed = JSON.parse(u);
    // Guardia: si no es médico, redirige a su home
    if (parsed.rol !== "medico") { navigate("/home"); return; }
    setUsuario(parsed);
  }, [navigate]);

  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const firstName = usuario.nombre?.split(" ")[0];

  return (
    <div className="hm-page">
      {/* ── Navbar ──────────────────────────────── */}
      <nav className="hm-nav">
        <span className="hm-logo">Brainwaves</span>
        <div className="hm-links">
          <span className="hm-link active">Home</span>
          <span className="hm-link" onClick={() => navigate("/waves")}>Panel Clínico</span>
          <span className="hm-link" onClick={() => navigate("/graphics")}>Monitor en vivo</span>
        </div>
        <div className="hm-user">
          <div className="hm-avatar">{initials}</div>
          <span className="hm-nombre">{usuario.nombre}</span>
          <span className="hm-rol-badge">Médico</span>
          <button className="hm-logout" onClick={() => { sessionStorage.clear(); navigate("/"); }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="hm-main">
        {/* ── Saludo ──────────────────────────────── */}
        <div className="hm-greeting">
          <h1>Bienvenido, Dr. {firstName} 👨‍⚕️</h1>
          <p><span className="hm-dot"></span>Sistema activo — monitoreo en tiempo real</p>
        </div>

        {/* ── Stats rápidas ───────────────────────── */}
        <div className="hm-stats">
          <div className="hm-stat">
            <div className="hm-stat-icon" style={{ background: "#ffeef2" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b8a" strokeWidth="2" width="22" height="22">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="hm-stat-info">
              <span className="hm-stat-num">{MOCK_TOTAL}</span>
              <span className="hm-stat-label">Pacientes activos</span>
            </div>
          </div>

          <div className="hm-stat hm-stat-alerta">
            <div className="hm-stat-icon" style={{ background: "#fcebeb" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="2" width="22" height="22">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="hm-stat-info">
              <span className="hm-stat-num hm-num-alerta">{MOCK_ALERTAS}</span>
              <span className="hm-stat-label">Alertas activas</span>
            </div>
          </div>

          <div className="hm-stat">
            <div className="hm-stat-icon" style={{ background: "#e1f5ee" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2" width="22" height="22">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="hm-stat-info">
              <span className="hm-stat-num">{MOCK_ULTIMA}</span>
              <span className="hm-stat-label">Última lectura EEG</span>
            </div>
          </div>
        </div>

        {/* ── Cards de acceso ─────────────────────── */}
        <div className="hm-cards">
          <div className="hm-card" onClick={() => navigate("/waves")}>
            <div className="hm-card-icon" style={{ background: "#ffeef2" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b8a" strokeWidth="1.8" width="22" height="22">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3>Panel Clínico</h3>
            <p>Tabla de pacientes con estado EEG, marcadores clínicos, historial de lecturas y exportación CSV.</p>
            <span className="hm-card-arrow" style={{ color: "#ff6b8a" }}>Ir al panel →</span>
          </div>

          <div className="hm-card" onClick={() => navigate("/graphics")}>
            <div className="hm-card-icon" style={{ background: "#e1f5ee" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="1.8" width="22" height="22">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3>Monitor en vivo</h3>
            <p>Señal EEG en tiempo real, semáforo de actividad cerebral y recomendación de música según el sensor.</p>
            <span className="hm-card-arrow" style={{ color: "#1d9e75" }}>Ver monitor →</span>
          </div>
        </div>

        {/* ── Banner informativo ───────────────────── */}
        <div className="hm-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b8a" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>
            Las <strong>alertas activas</strong> corresponden a pacientes con actividad Gamma sostenida.
            Revisa el <strong>Panel Clínico</strong> para ver detalles y exportar datos.
          </p>
        </div>
      </div>
    </div>
  );
}