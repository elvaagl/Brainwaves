import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Waves.css";

/* ══════════════════════════════════════════════════
   SECCIONES Facts Waves — 9 cards
══════════════════════════════════════════════════ */
const cards = [
  {
    img: "/pinkwaves.jpg",
    title: "¿Qué son las ondas cerebrales?",
    subtitle: "Brain waves",
    description: "El cerebro genera impulsos eléctricos constantemente. Estas señales, llamadas ondas cerebrales, se miden en Hz (ciclos por segundo) y reflejan tu estado mental en tiempo real. Si alguna frecuencia está en exceso o en déficit, el rendimiento mental puede verse afectado.",
    lobulo: "Corteza cerebral completa", rango: "0.5 – 100+ Hz", estado: "Base de toda actividad mental", color: "#ff6b8a",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/Alpha.jpg",
    title: "Ondas Alpha", subtitle: "8–12 Hz",
    description: "Predominan cuando estás relajado pero consciente. Aparecen al cerrar los ojos, respirar profundo o meditar. Son el puente entre el estado consciente y el subconsciente, y están asociadas a la creatividad, la extroversión y el buen humor.",
    lobulo: "Lóbulo occipital y frontal", rango: "8 – 12 Hz", estado: "Relajación consciente", color: "#ff6b8a",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/beta.jpg",
    title: "Ondas Beta", subtitle: "13–30 Hz",
    description: "Dominan cuando tienes los ojos abiertos, estás pensando, tomando decisiones o resolviendo problemas. Se dividen en Low Beta (foco relajado), Mid Beta (actividad mental) y High Beta (alerta intensa o agitación).",
    lobulo: "Lóbulo frontal y parietal", rango: "13 – 30 Hz", estado: "Concentración activa", color: "#ba7517",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/theta.jpg",
    title: "Ondas Theta", subtitle: "4–8 Hz",
    description: "Aparecen en la frontera entre vigilia y sueño. Son la sede de la creatividad intuitiva, la memoria emocional y la meditación profunda. En niños menores de 13 años son completamente normales en estado de vigilia.",
    lobulo: "Hipocampo y lóbulo temporal", rango: "4 – 8 Hz", estado: "Meditación profunda", color: "#7f77dd",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/deltajpg.jpg",
    title: "Ondas Delta", subtitle: "0.5–4 Hz",
    description: "Las más lentas y de mayor amplitud. Dominan el sueño profundo sin sueños (fases 3 y 4). Son esenciales para la recuperación física y el acceso al inconsciente. En adultos despiertos, un exceso de delta puede indicar dificultades de atención.",
    lobulo: "Tálamo y corteza frontal", rango: "0.5 – 4 Hz", estado: "Sueño profundo", color: "#1d9e75",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/gamma.jpg",
    title: "Ondas Gamma", subtitle: "30+ Hz",
    description: "Las más rápidas. Están presentes en todas las regiones del cerebro simultáneamente y se asocian al procesamiento cognitivo de alto nivel, la percepción integrada y la memoria funcional. Una deficiencia de actividad a 40 Hz puede provocar dificultades de aprendizaje.",
    lobulo: "Corteza prefrontal", rango: "30 – 100 Hz", estado: "Procesamiento cognitivo alto", color: "#e24b4a",
    ref: { label: "NHA Health — Brainwaves: The Language", url: "https://nhahealth.com/brainwaves-the-language/" },
  },
  {
    img: "/YSL Scent Station hero.png",
    title: "Aplicaciones modernas del EEG", subtitle: "Tecnología y bienestar",
    description: "El EEG ya no es solo clínico. YSL Beauty utilizó un headset de EEG en tienda para medir reacciones cerebrales ante fragancias y personalizar recomendaciones. La neurotecnología se integra al consumo, la educación y la salud mental.",
    lobulo: "Corteza olfativa y prefrontal", rango: "Aplicación comercial", estado: "Innovación tecnológica", color: "#ba7517",
    ref: { label: "L'Oréal — YSL Scent-Sation", url: "https://www.loreal.com/en/articles/science-and-technology/ysl-scent-sation/" },
  },
  {
    img: "/music brain.png",
    title: "Música y ondas cerebrales", subtitle: "Brainwaves & música",
    description: "La música modifica activamente la actividad eléctrica cerebral. La música preferida aumenta las bandas alpha y beta en regiones frontales y temporales derechas. La terapia musical ha demostrado reducir ansiedad, aumentar alpha y mejorar la cognición en pacientes con depresión y esquizofrenia.",
    lobulo: "Corteza auditiva y frontal", rango: "Efecto sobre Alpha/Beta/Theta", estado: "Modulación emocional", color: "#7f77dd",
    ref: { label: "PMC — Impact of music on bioelectrical oscillations", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6130927/" },
    ref2: { label: "Nature — EEG & musical engagement", url: "https://www.nature.com/articles/s41598-019-40254-w" },
  },
];

/* ══════════════════════════════════════════════════
   LÍNEA DE TIEMPO — Historia del EEG
══════════════════════════════════════════════════ */
const timelineEvents = [
  { year: "1875", name: "Richard Caton",             fact: "Proyectó la primera señal eléctrica cerebral sobre una pared usando un galvanómetro de hilo. Considerado el precursor del EEG." },
  { year: "1890", name: "Adolf Beck",                fact: "Localizó las modalidades sensoriales de la corteza con potenciales evocados y describió por primera vez la desincronización de ondas bajo estimulación." },
  { year: "1912", name: "Vladimir Pravdich-Neminsky", fact: "Publicó el primer EEG impreso de la historia. Descubrió lo que luego se llamarían ondas alfa y beta." },
  { year: "1924", name: "Hans Berger",               fact: "Registró el primer EEG en humanos. Acuñó el término 'electroencefalografía' y describió el ritmo alfa, también llamado 'ritmo de Berger'." },
  { year: "1934", name: "Edgar Douglas Adrian",      fact: "Premio Nobel. Junto a Bryan Matthews amplió el conocimiento sobre la inducción cerebral y sentó las bases de la neurofisiología moderna." },
  { year: "1937", name: "Alfred Lee Loomis",         fact: "Filántropo y físico. En su laboratorio privado descubrió los husos del sueño y las ondas K, fundamentales para entender el sueño NREM." },
];

/* ══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — solo vista paciente
══════════════════════════════════════════════════ */
export default function Waves() {
  const navigate  = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [usuario,  setUsuario]  = useState({ nombre: "", rol: "paciente" });

  useEffect(() => {
    const u = sessionStorage.getItem("usuario");
    if (!u) { navigate("/"); return; }
    const parsed = JSON.parse(u);
    // Si es médico, redirigir al panel clínico
    if (parsed.rol === "medico") { navigate("/waves/panel"); return; }
    setUsuario(parsed);
  }, [navigate]);

  const initials = usuario.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    try { await fetch("http://localhost:8080/api/session/activa", { method: "DELETE" }); } catch (_) {}
    sessionStorage.clear();
    navigate("/");
  };

  const navLinks = [
    { label: "Home",        path: "/home",     active: false },
    { label: "Facts Waves", path: "/waves",    active: true  },
    { label: "Graphics",    path: "/graphics", active: false },
  ];

  return (
    <div className={`waves-page ${darkMode ? "dark" : ""}`}>
      <nav className="home-nav">
        <span className="nav-logo">Brainwaves</span>
        <div className="nav-links">
          {navLinks.map(({ label, path, active }) => (
            <span key={label} className={`nav-link${active ? " active" : ""}`}
              onClick={() => !active && navigate(path)}>{label}</span>
          ))}
        </div>
        <div className="nav-user">
          <div className="avatar">{initials}</div>
          <span className="nav-nombre">{usuario.nombre}</span>
          <button className="mode-btn" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="waves-main">
        <div className="waves-header">
          <h1>Tu cerebro en ondas</h1>
          <p>Explora cómo tu actividad eléctrica cerebral refleja tu estado mental</p>
        </div>

        {/* Hero imagen cerebro */}
        <div className="brain-container">
          <img src="/brain-waves_brain.jpg" alt="Ondas cerebrales y lóbulos del cerebro" className="brain-hero-img" />
          <p className="brain-caption">Actividad eléctrica cerebral · Lóbulos y frecuencias</p>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          <span className="disclaimer-icon">⚠️</span>
          <p>Este dispositivo <strong>lee señales eléctricas (biopotenciales)</strong>, no pensamientos ni emociones. Los valores mostrados son aproximaciones basadas en rangos de actividad eléctrica del cuero cabelludo.</p>
        </div>

        {/* Cards ondas 1–6 */}
        <div className="waves-cards">
          {cards.slice(0, 6).map((card, i) => (
            <div key={i} className="wave-card">
              <div className="wave-card-img"><img src={card.img} alt={card.title} /></div>
              <div className="wave-card-info">
                <div className="wave-card-header">
                  <div>
                    <h2>{card.title}</h2>
                    <span className="wave-badge" style={{ background: card.color + "22", color: card.color }}>{card.subtitle}</span>
                  </div>
                  <span className="estado-tag">{card.estado}</span>
                </div>
                <p className="wave-desc">{card.description}</p>
                <div className="wave-meta">
                  <div className="meta-item"><span className="meta-label">Lóbulo</span><span className="meta-value">{card.lobulo}</span></div>
                  <div className="meta-item"><span className="meta-label">Rango</span><span className="meta-value">{card.rango}</span></div>
                </div>
                <div className="wave-ref">
                  <a href={card.ref.url} target="_blank" rel="noopener noreferrer">📎 {card.ref.label}</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección Lóbulos */}
        <div className="lobulos-section">
          <div className="lobulos-header">
            <h2 className="section-title">Lóbulos del cerebro</h2>
            <p className="section-sub">Cada región controla funciones distintas — todas conectadas entre sí</p>
          </div>
          <div className="lobulos-grid">
            <div className="lobulo-card" style={{ borderTop: "3px solid #ff6b8a" }}>
              <span className="lobulo-icon">🧠</span>
              <h3>Lóbulo Frontal</h3>
              <p>Razonamiento, creatividad, toma de decisiones y control del movimiento voluntario. Sede de la personalidad.</p>
              <span className="lobulo-tag" style={{ background: "#ffeef2", color: "#ff6b8a" }}>Ondas Beta · Alpha</span>
            </div>
            <div className="lobulo-card" style={{ borderTop: "3px solid #ba7517" }}>
              <span className="lobulo-icon">📡</span>
              <h3>Lóbulo Parietal</h3>
              <p>Integra información sensorial de distintas fuentes. Involucrado en el lenguaje y la orientación espacial.</p>
              <span className="lobulo-tag" style={{ background: "#faeeda", color: "#ba7517" }}>Ondas Alpha · Beta</span>
            </div>
            <div className="lobulo-card" style={{ borderTop: "3px solid #7f77dd" }}>
              <span className="lobulo-icon">🎵</span>
              <h3>Lóbulo Temporal</h3>
              <p>Sede de la audición, el lenguaje hablado y parte de la memoria episódica. Procesa el sonido y el significado.</p>
              <span className="lobulo-tag" style={{ background: "#ede9f7", color: "#3c3489" }}>Ondas Theta · Gamma</span>
            </div>
            <div className="lobulo-card" style={{ borderTop: "3px solid #1d9e75" }}>
              <span className="lobulo-icon">👁️</span>
              <h3>Lóbulo Occipital</h3>
              <p>Procesa toda la información visual. Las ondas Alpha son más fuertes aquí con ojos cerrados.</p>
              <span className="lobulo-tag" style={{ background: "#e1f5ee", color: "#085041" }}>Ondas Alpha dominante</span>
            </div>
            <div className="lobulo-card lobulo-card-wide" style={{ borderTop: "3px solid #e24b4a" }}>
              <span className="lobulo-icon">🔄</span>
              <h3>Estructuras internas clave</h3>
              <p><strong>Tálamo</strong> — estación central de relevo sensorial hacia la corteza. <strong>Hipotálamo</strong> — regula hambre, sed, sueño y temperatura. <strong>Sistema límbico</strong> (hipocampo, amígdala) — emociones y memoria. <strong>Ganglios basales</strong> — coordinan el movimiento voluntario y la postura.</p>
              <span className="lobulo-tag" style={{ background: "#fcebeb", color: "#791f1f" }}>Estructuras subcorticales</span>
            </div>
          </div>
          <div className="wave-ref" style={{ justifyContent: "center", marginTop: 16 }}>
            <a href="https://www.facmed.unam.mx/Libro-NeuroFisio/06-SistemaNervioso/SistemaNerviosoCentral/SNC2-Lobulos.html"
              target="_blank" rel="noopener noreferrer">📎 UNAM — Lóbulos del cerebro y sus funciones</a>
          </div>
        </div>

        {/* Línea de tiempo */}
        <div className="timeline-section">
          <h2 className="section-title">Historia del EEG</h2>
          <p className="section-sub">Los pioneros que descubrieron cómo leer el cerebro</p>
          <div className="timeline">
            {timelineEvents.map((ev, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? "left" : "right"}`}>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <span className="timeline-year">{ev.year}</span>
                  <h3 className="timeline-name">{ev.name}</h3>
                  <p className="timeline-fact">{ev.fact}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="wave-ref" style={{ justifyContent: "center", marginTop: 16 }}>
            <a href="https://brainclinics.com/research/articles/pioneros-de-la-electroencefalografia-eeg"
              target="_blank" rel="noopener noreferrer">📎 Brainclinics — Pioneros de la EEG</a>
          </div>
        </div>

        {/* Cards aplicaciones y música */}
        <div className="waves-cards">
          {cards.slice(6, 8).map((card, i) => (
            <div key={i} className="wave-card">
              <div className="wave-card-img"><img src={card.img} alt={card.title} /></div>
              <div className="wave-card-info">
                <div className="wave-card-header">
                  <div>
                    <h2>{card.title}</h2>
                    <span className="wave-badge" style={{ background: card.color + "22", color: card.color }}>{card.subtitle}</span>
                  </div>
                  <span className="estado-tag">{card.estado}</span>
                </div>
                <p className="wave-desc">{card.description}</p>
                <div className="wave-meta">
                  <div className="meta-item"><span className="meta-label">Región</span><span className="meta-value">{card.lobulo}</span></div>
                  <div className="meta-item"><span className="meta-label">Efecto</span><span className="meta-value">{card.rango}</span></div>
                </div>
                <div className="wave-ref">
                  <a href={card.ref.url} target="_blank" rel="noopener noreferrer">📎 {card.ref.label}</a>
                  {card.ref2 && <a href={card.ref2.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>📎 {card.ref2.label}</a>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Graphics */}
        <div className="cta-graphics-card" onClick={() => navigate("/graphics")}>
          <div className="cta-icon">📈</div>
          <div className="cta-text">
            <h3>Tu actividad cerebral en vivo</h3>
            <p>Ve tu señal en tiempo real, el estado actual de tus ondas y la música recomendada para tu cerebro ahora mismo.</p>
          </div>
          <div className="cta-arrow">→</div>
        </div>
      </div>
    </div>
  );
}