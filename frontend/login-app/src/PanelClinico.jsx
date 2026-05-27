import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Doctor.css";

const API_BASE = "http://localhost:8080/api";

const ONDA_COLOR = {
  Delta: { bg: "#ede9f7", text: "#3c3489", dot: "#7f77dd" },
  Theta: { bg: "#e1f5ee", text: "#085041", dot: "#1d9e75" },
  Alpha: { bg: "#fbeaf0", text: "#993556", dot: "#ff6b8a" },
  Beta:  { bg: "#faeeda", text: "#633806", dot: "#ba7517" },
  Gamma: { bg: "#fcebeb", text: "#791f1f", dot: "#e24b4a" },
};

function exportarCSV(pacientes) {
  const headers = ["ID", "Nombre", "Email", "Onda", "Valor EEG", "Diagnóstico", "Última Lectura", "Alerta"];
  const rows = pacientes.map(p => [p.id, p.nombre, p.email, p.onda, p.valor, p.diagnostico, p.ultimaLectura, p.alerta ? "Sí" : "No"]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `brainwaves_pacientes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PanelClinico() {
  const navigate = useNavigate();
  const [usuario,      setUsuario]      = useState({ nombre: "", rol: "medico" });
  const [pacientes,    setPacientes]    = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [historial,    setHistorial]    = useState([]);
  const [filtro,       setFiltro]       = useState("Todos");
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) { navigate("/"); return; }
    const parsed = JSON.parse(u);
    if (parsed.rol !== "medico") { navigate("/home"); return; }
    setUsuario(parsed);
  }, [navigate]);

  // Cargar pacientes reales desde el backend
  useEffect(() => {
    fetch(`${API_BASE}/pacientes`)
      .then(r => r.json())
      .then(data => { setPacientes(Array.isArray(data) ? data : []); })
      .catch(() => setPacientes([]))
      .finally(() => setLoading(false));
  }, []);

  // Cargar historial cuando se selecciona un paciente
  useEffect(() => {
    if (!seleccionado) { setHistorial([]); return; }
    fetch(`${API_BASE}/pacientes/historial?id=${seleccionado.id}`)
      .then(r => r.json())
      .then(data => setHistorial(Array.isArray(data) ? data : []))
      .catch(() => setHistorial([]));
  }, [seleccionado]);

  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/session/activa`, { method: "DELETE" }); } catch (_) {}
    sessionStorage.clear();
    navigate("/");
  };

  const pacientesFiltrados = filtro === "Todos"
    ? pacientes
    : filtro === "Alertas"
    ? pacientes.filter(p => p.alerta)
    : pacientes.filter(p => p.onda === filtro);

  return (
    <div className="doctor-page">
      <nav className="home-nav">
        <span className="nav-logo">Brainwaves</span>
        <div className="nav-links">
          <span className="nav-link" onClick={() => navigate("/doctor")}>Home</span>
          <span className="nav-link active">Panel Clínico</span>
          <span className="nav-link" onClick={() => navigate("/graphics")}>Monitor en vivo</span>
        </div>
        <div className="nav-user">
          <div className="avatar">{initials}</div>
          <span className="nav-nombre">{usuario.nombre}</span>
          <span className="nav-rol-badge">Médico</span>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="doctor-main">
        <div className="doctor-header">
          <div>
            <h1>Panel Clínico</h1>
            <p>
              <span className="dot"></span>
              {loading ? "Cargando..." : `${pacientes.length} pacientes · ${pacientes.filter(p => p.alerta).length} alertas activas`}
            </p>
          </div>
          <button className="btn-export" onClick={() => exportarCSV(pacientes)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
        </div>

        <div className="doctor-layout">
          {/* Columna izquierda */}
          <div className="doctor-left">
            <div className="filtros-row">
              {["Todos", "Alertas", "Alpha", "Beta", "Gamma", "Delta", "Theta"].map(f => (
                <button key={f}
                  className={`filtro-btn${filtro === f ? " active" : ""}${f === "Alertas" ? " alerta" : ""}`}
                  onClick={() => setFiltro(f)}>
                  {f === "Alertas" && <span className="filtro-dot alerta"></span>}
                  {f}
                </button>
              ))}
            </div>

            <div className="tabla-card">
              {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>Cargando pacientes...</div>
              ) : pacientesFiltrados.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>Sin pacientes registrados</div>
              ) : (
                <table className="tabla-pacientes">
                  <thead>
                    <tr>
                      <th>Paciente</th><th>Onda</th><th>Valor EEG</th>
                      <th>Diagnóstico</th><th>Última lectura</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.map(p => {
                      const c = ONDA_COLOR[p.onda] || ONDA_COLOR.Alpha;
                      return (
                        <tr key={p.id}
                          className={`tabla-row${seleccionado?.id === p.id ? " selected" : ""}${p.alerta ? " row-alerta" : ""}`}
                          onClick={() => setSeleccionado(p.id === seleccionado?.id ? null : p)}>
                          <td>
                            <div className="paciente-cell">
                              <div className="tabla-avatar">{p.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                              <div>
                                <span className="paciente-nombre">{p.nombre}</span>
                                <span className="paciente-email">{p.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="onda-chip" style={{ background: c.bg, color: c.text }}>
                              <span className="onda-dot" style={{ background: c.dot }}></span>{p.onda}
                            </span>
                          </td>
                          <td className="valor-cell">{p.valor || "--"}</td>
                          <td>{p.diagnostico || "--"}</td>
                          <td className="lectura-cell">
                            {p.ultimaLectura ? new Date(p.ultimaLectura).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "--"}
                          </td>
                          <td>
                            {p.alerta && (
                              <span className="alerta-badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                  <line x1="12" y1="9" x2="12" y2="13"/>
                                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                Alerta
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel derecho — detalle */}
          <div className="doctor-right">
            {seleccionado ? (
              <div className="detalle-card">
                <div className="detalle-header">
                  <div className="detalle-avatar">{seleccionado.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <div><h2>{seleccionado.nombre}</h2><span>{seleccionado.email}</span></div>
                </div>
                <div className="marcadores-grid">
                  <div className="marcador"><span className="marcador-label">Valor EEG</span><span className="marcador-valor">{seleccionado.valor || "--"}</span></div>
                  <div className="marcador"><span className="marcador-label">Onda activa</span><span className="marcador-valor" style={{ color: ONDA_COLOR[seleccionado.onda]?.dot }}>{seleccionado.onda}</span></div>
                  <div className="marcador"><span className="marcador-label">Diagnóstico</span><span className="marcador-valor small">{seleccionado.diagnostico}</span></div>
                  <div className="marcador">
                    <span className="marcador-label">Estado</span>
                    <span className={`marcador-valor small ${seleccionado.alerta ? "alerta-text" : "ok-text"}`}>
                      {seleccionado.alerta ? "⚠ Requiere atención" : "✓ Normal"}
                    </span>
                  </div>
                </div>
                <div className="historial-section">
                  <h3>Historial de lecturas</h3>
                  <div className="historial-lista">
                    {historial.length === 0 ? (
                      <div style={{ color: "#aaa", fontSize: "13px", padding: "8px 0" }}>Sin lecturas registradas</div>
                    ) : historial.map((h, i) => {
                      const c = ONDA_COLOR[h.onda] || ONDA_COLOR.Alpha;
                      return (
                        <div key={i} className="historial-item">
                          <span className="historial-ts">{h.ts ? new Date(h.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "--"}</span>
                          <span className="historial-onda" style={{ background: c.bg, color: c.text }}>{h.onda}</span>
                          <span className="historial-valor">{h.valor}</span>
                          <span className="historial-diag">{h.diagnostico}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button className="btn-export-paciente" onClick={() => exportarCSV([seleccionado])}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Exportar datos de {seleccionado.nombre.split(" ")[0]}
                </button>
              </div>
            ) : (
              <div className="detalle-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffd6e0" strokeWidth="1.5" width="48" height="48">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p>Selecciona un paciente<br/>para ver su detalle clínico</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}