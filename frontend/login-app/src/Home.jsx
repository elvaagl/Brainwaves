import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const frases = {
  Delta: "Tu cerebro está en descanso profundo. Tómate un momento para recuperarte.",
  Theta: "Estás en un estado meditativo. Ideal para reflexionar y ser creativo.",
  Alpha: "Tu mente está en calma. Buen momento para concentrarte o meditar.",
  Beta:  "Estás activo y enfocado. Aprovecha esta energía mental.",
  Gamma: "Tu cerebro está muy activo. Recuerda respirar y tomar pausas.",
};

const colores = {
  Delta: { bg:"#ede9f7", stroke:"#7f77dd", badge:"#eeedfe", badgeText:"#3c3489" },
  Theta: { bg:"#e1f5ee", stroke:"#1d9e75", badge:"#e1f5ee", badgeText:"#085041" },
  Alpha: { bg:"#ffeef2", stroke:"#ff6b8a", badge:"#fbeaf0", badgeText:"#993556" },
  Beta:  { bg:"#faeeda", stroke:"#ba7517", badge:"#faeeda", badgeText:"#633806" },
  Gamma: { bg:"#fcebeb", stroke:"#e24b4a", badge:"#fcebeb", badgeText:"#791f1f" },
};

const images = [
  "/front.JPG", "/purplyyy.JPG", "/flowery.JPG", "/pinkybrain.JPG", "/cool.GIF",
  "/front.JPG", "/purplyyy.JPG", "/flowery.JPG", "/pinkybrain.JPG", "/cool.GIF",
];

export default function Home() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({ nombre: "Paciente" });
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) { navigate("/"); return; }
    setUsuario(JSON.parse(u));
  }, [navigate]);

  useEffect(() => {
    const fetchEstado = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/brain/recommendation");
        const data = await res.json();
        setEstado(data);
      } catch {
        setEstado(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEstado();
    const interval = setInterval(fetchEstado, 5000);
    return () => clearInterval(interval);
  }, []);

  const onda = estado?.onda || "Alpha";
  const col = colores[onda] || colores.Alpha;
  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="home-page">
      <nav className="home-nav">
        <span className="nav-logo">Brainwaves</span>
        <div className="nav-links">
          <span className="nav-link active">Home</span>
          <span className="nav-link" onClick={() => navigate("/waves")}>Facts Waves</span>
          <span className="nav-link" onClick={() => navigate("/graphics")}>Graphics</span>
        </div>
        <div className="nav-user">
          <div className="avatar" style={{ background: col.bg, color: col.stroke }}>{initials}</div>
          <span className="nav-nombre">{usuario.nombre}</span>
          <button className="logout-btn" onClick={() => { sessionStorage.clear(); navigate("/"); }}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="home-main">
        <div className="greeting">
          <h1>Hola, {usuario.nombre.split(" ")[0]} 👋</h1>
          <p><span className="dot"></span>Leyendo tu actividad cerebral en tiempo real</p>
        </div>

        {loading ? (
          <div className="estado-card"><p className="loading-text">Leyendo tu actividad cerebral...</p></div>
        ) : estado ? (
          <div className="estado-card" style={{ borderColor: col.stroke + "55" }}>
            <div className="estado-left">
              <div className="semaforo" style={{ background: col.bg }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={col.stroke} strokeWidth="2" width="28" height="28">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="estado-info">
                <h2>{estado.estado}</h2>
                <p>Valor del sensor: <strong>{estado.valor}</strong> <span className="valor-chip">Onda {estado.onda}</span></p>
                <span className="onda-badge" style={{ background: col.badge, color: col.badgeText }}>Onda {estado.onda}</span>
              </div>
            </div>
            <p className="frase">"{frases[onda]}"</p>
          </div>
        ) : (
          <div className="estado-card"><p className="loading-text">Sin conexión al sensor</p></div>
        )}

        <div className="cards-grid">
          <div className="card" onClick={() => navigate("/graphics")}>
            <div className="card-icon" style={{ background: col.bg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={col.stroke} strokeWidth="1.8" width="22" height="22">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3>Ver mis biométricos</h3>
            <p>Gráfica en tiempo real, semáforo de salud y recomendación de música según tu estado actual.</p>
            <span className="card-arrow" style={{ color: col.stroke }}>Ir a Graphics →</span>
          </div>
          <div className="card" onClick={() => navigate("/waves")}>
            <div className="card-icon" style={{ background: col.bg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={col.stroke} strokeWidth="1.8" width="22" height="22">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Aprender sobre mis ondas</h3>
            <p>Descubre qué significan las ondas Alpha, Beta, Theta, Delta y Gamma en tu cerebro.</p>
            <span className="card-arrow" style={{ color: col.stroke }}>Ir a Facts Waves →</span>
          </div>
        </div>
      </div>

      <div className="slider-section">
        <p className="slider-label">Galería</p>
        <div className="slider-wrap">
          <div className="slider-track">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`slide-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
