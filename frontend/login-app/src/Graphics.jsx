import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "./Graphics.css";

const API_BASE = "http://localhost:8080/api";

const colores = {
  Delta: { bg:"#ede9f7", stroke:"#7f77dd", badge:"#eeedfe", badgeText:"#3c3489" },
  Theta: { bg:"#e1f5ee", stroke:"#1d9e75", badge:"#e1f5ee", badgeText:"#085041" },
  Alpha: { bg:"#ffeef2", stroke:"#ff6b8a", badge:"#fbeaf0", badgeText:"#993556" },
  Beta:  { bg:"#faeeda", stroke:"#ba7517", badge:"#faeeda", badgeText:"#633806" },
  Gamma: { bg:"#fcebeb", stroke:"#e24b4a", badge:"#fcebeb", badgeText:"#791f1f" },
};

export default function Graphics() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const sseRef    = useRef(null);
  const navigate  = useNavigate();

  const [usuario,      setUsuario]      = useState({ nombre: "", rol: "paciente", id: null });
  const [liveValue,    setLiveValue]    = useState("--");
  const [semaforo,     setSemaforo]     = useState("⚪");
  const [statusBadge,  setStatusBadge]  = useState({ text: "Detectando...", color: "#999" });
  const [onda,         setOnda]         = useState("Alpha");
  const [estadoBadge,  setEstadoBadge]  = useState({ text: "Detectando...", color: "#ba7e7e" });
  const [music,        setMusic]        = useState({ cancion: "--", artista: "--", url: "" });
  const [historial,    setHistorial]    = useState([]);
  const [loadingHist,  setLoadingHist]  = useState(false);

  const col = colores[onda] || colores.Alpha;

  // Cargar usuario y notificar sesión activa al backend
  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) { navigate("/"); return; }
    const parsed = JSON.parse(u);
    setUsuario(parsed);
    if (parsed.id) {
      fetch(`${API_BASE}/session/activa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: parsed.id }),
      }).catch(() => {});
    }
  }, [navigate]);

  // Cargar historial de canciones del usuario
  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) return;
    const parsed = JSON.parse(u);
    if (!parsed.id) return;
    setLoadingHist(true);
    fetch(`${API_BASE}/music/historial?id=${parsed.id}`)
      .then(r => r.json())
      .then(data => { setHistorial(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  // Inicializar Chart.js
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array(15).fill(""),
        datasets: [{
          label: "Señal del Sensor",
          data: [],
          borderColor: "#ff4d6d",
          backgroundColor: "rgba(255, 77, 109, 0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 1900, max: 2100, grid: { display: false }, ticks: { color: "#aaa" } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
    return () => chartRef.current?.destroy();
  }, []);

  // SSE — conexión persistente
  useEffect(() => {
    const sse = new EventSource(`${API_BASE}/brain/stream`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLiveValue(data.valor);
        setSemaforo(data.semaforo || "⚪");
        setStatusBadge({ text: data.diagnostico, color: data.color_sugerido });

        const chart = chartRef.current;
        if (chart) {
          chart.data.datasets[0].data.push(data.valor);
          if (chart.data.datasets[0].data.length > 15) chart.data.datasets[0].data.shift();
          chart.update();
        }

        setOnda(data.onda || "Alpha");
        setEstadoBadge({ text: data.estado, color: data.color });

        if (data.cancion) {
          setMusic({
            cancion: data.cancion || "--",
            artista: data.artista || "--",
            url:     data.url     || "",
          });
          // Refrescar historial cada vez que cambia la canción
          const u = sessionStorage.getItem("usuario");
          if (u) {
            const parsed = JSON.parse(u);
            if (parsed.id) {
              fetch(`${API_BASE}/music/historial?id=${parsed.id}`)
                .then(r => r.json())
                .then(d => { if (Array.isArray(d)) setHistorial(d); })
                .catch(() => {});
            }
          }
        }
      } catch {
        setStatusBadge({ text: "Error procesando datos", color: "#999" });
      }
    };

    sse.onerror = () => setStatusBadge({ text: "Sin conexión al servidor", color: "#999" });
    return () => sse.close();
  }, []);

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/session/activa`, { method: "DELETE" }); } catch (_) {}
    sessionStorage.clear();
    navigate("/");
  };

  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const esMedico = usuario.rol === "medico";

  const navLinks = esMedico
    ? [
        { label: "Home",            path: "/doctor",   active: false },
        { label: "Panel Clínico",   path: "/waves",    active: false },
        { label: "Monitor en vivo", path: "/graphics", active: true  },
      ]
    : [
        { label: "Home",        path: "/home",     active: false },
        { label: "Facts Waves", path: "/waves",    active: false },
        { label: "Graphics",    path: "/graphics", active: true  },
      ];

  const ONDA_COLOR = {
    Delta: { bg: "#ede9f7", text: "#3c3489", dot: "#7f77dd" },
    Theta: { bg: "#e1f5ee", text: "#085041", dot: "#1d9e75" },
    Alpha: { bg: "#fbeaf0", text: "#993556", dot: "#ff6b8a" },
    Beta:  { bg: "#faeeda", text: "#633806", dot: "#ba7517" },
    Gamma: { bg: "#fcebeb", text: "#791f1f", dot: "#e24b4a" },
  };

  return (
    <div className="graphics-page">
      <nav className="home-nav">
        <span className="nav-logo">Brainwaves</span>
        <div className="nav-links">
          {navLinks.map(({ label, path, active }) => (
            <span key={label} className={`nav-link${active ? " active" : ""}`}
              onClick={() => !active && navigate(path)}>
              {label}
            </span>
          ))}
        </div>
        <div className="nav-user">
          <div className="avatar" style={{ background: col.bg, color: col.stroke }}>{initials}</div>
          <span className="nav-nombre">{usuario.nombre}</span>
          {esMedico && <span className="nav-rol-badge">Médico</span>}
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="graphics-main">
        <div className="graphics-header">
          <h1>Monitor en Tiempo Real</h1>
          <p>Tu actividad bioeléctrica en vivo</p>
        </div>

        <div className="bento-grid">
          {/* Gráfica */}
          <div className="bento-card bento-chart">
            <div className="card-title">📈 Señal del Sensor</div>
            <div className="chart-wrap">
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Estado */}
          <div className="bento-card bento-status" style={{ borderColor: col.stroke + "55" }}>
            <div className="card-title">🩺 Estado Actual</div>
            <div className="semaforo-big">{semaforo}</div>
            <div className="live-value" style={{ color: col.stroke }}>{liveValue}</div>
            <span className="status-pill" style={{ background: col.badge, color: col.badgeText }}>
              {statusBadge.text}
            </span>
            <div className="onda-info">
              <span className="onda-pill" style={{ background: col.bg, color: col.stroke }}>
                Onda {onda}
              </span>
              <span className="estado-text">{estadoBadge.text}</span>
            </div>
          </div>

          {/* Música actual */}
          <div className="bento-card bento-music">
            <div className="card-title">🎵 Música Recomendada</div>
            <p className="music-subtitle">Según tu estado bioeléctrico actual</p>
            {music.url ? (
              <a href={music.url} target="_blank" rel="noopener noreferrer" className="music-link"
                style={{ background: col.bg, color: col.stroke, borderColor: col.stroke + "44" }}>
                <span className="music-icon">♪</span>
                <div>
                  <div className="music-name">{music.cancion}</div>
                  <div className="music-artist">{music.artista}</div>
                </div>
                <span className="music-arrow">→</span>
              </a>
            ) : (
              <div className="music-loading">Buscando música...</div>
            )}
          </div>

          {/* Historial de canciones */}
          <div className="bento-card bento-historial">
            <div className="card-title">🎶 Historial de Canciones</div>
            <p className="music-subtitle">Últimas canciones recomendadas en tus sesiones</p>
            {loadingHist ? (
              <div className="music-loading">Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div className="historial-empty">
                <span>Sin registros aún</span>
                <p>Las canciones aparecerán aquí durante tus sesiones en vivo</p>
              </div>
            ) : (
              <div className="historial-canciones-lista">
                {historial.map((item, i) => {
                  const c = ONDA_COLOR[item.onda] || ONDA_COLOR.Alpha;
                  return (
                    <div key={i} className="historial-cancion-item">
                      <span className="hc-onda" style={{ background: c.bg, color: c.text }}>
                        <span className="hc-dot" style={{ background: c.dot }} />
                        {item.onda}
                      </span>
                      <div className="hc-info">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hc-nombre">
                            {item.cancion}
                          </a>
                        ) : (
                          <span className="hc-nombre">{item.cancion}</span>
                        )}
                        {item.artista && <span className="hc-artista">{item.artista}</span>}
                      </div>
                      <span className="hc-fecha">
                        {item.fecha ? new Date(item.fecha).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}