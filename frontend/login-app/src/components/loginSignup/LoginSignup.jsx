import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginSignup.css";

const LoginSignup = () => {
  const [action, setAction]       = useState("Login");
  const [nombre, setNombre]       = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [mensaje, setMensaje]     = useState("");
  const [mensajeError, setMensajeError] = useState(false);
  const navigate = useNavigate();

  const validarEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validarPassword = (p) => {
    if (p.length < 8)       return "Mínimo 8 caracteres";
    if (!/[A-Z]/.test(p))   return "Debe incluir al menos una mayúscula";
    if (!/[a-z]/.test(p))   return "Debe incluir al menos una minúscula";
    if (!/[0-9]/.test(p))   return "Debe incluir al menos un número";
    return null;
  };

  // Detecta en el frontend si el email es de médico (solo para el hint visual)
  const esMedico = email.toLowerCase().endsWith("@brainwaves.com");

  const handleSubmit = async () => {
    setMensaje(""); setMensajeError(false);

    if (action === "Sign Up" && !nombre.trim()) {
      setMensaje("El nombre es requerido"); setMensajeError(true); return;
    }
    if (!validarEmail(email)) {
      setMensaje("Correo electrónico inválido"); setMensajeError(true); return;
    }
    if (action === "Sign Up") {
      const err = validarPassword(password);
      if (err) { setMensaje(err); setMensajeError(true); return; }
    }

    const endpoint = action === "Sign Up"
      ? "http://localhost:8080/api/auth/register"
      : "http://localhost:8080/api/auth/login";
    const body = action === "Sign Up"
      ? { nombre, email, password }
      : { email, password };

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        if (action === "Sign Up") {
          // Mensaje diferenciado según rol detectado por el backend
          const msg = data.rol === "medico"
            ? "¡Cuenta médica creada! Inicia sesión."
            : "¡Cuenta creada! Inicia sesión.";
          setMensaje(msg);
          setMensajeError(false);
          setTimeout(() => { setAction("Login"); setMensaje(""); }, 1800);
        } else {
          const rolFinal = data.rol || (data.email?.endsWith("@brainwaves.com") ? "medico" : "paciente");
          sessionStorage.setItem("usuario", JSON.stringify({
            nombre: data.nombre,
            id:     data.id,
            rol:    rolFinal,
          }));
          console.log("Login response:", data); // para verificar en consola
          navigate(rolFinal === "medico" ? "/doctor" : "/home");
        }

      } else {
        setMensaje(data.message); setMensajeError(true);
      }
    } catch {
      setMensaje("No se pudo conectar al servidor."); setMensajeError(true);
    }
  };

  return (
    <div className="card">
      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${action === "Sign Up" ? "active" : ""}`}
          onClick={() => { setAction("Sign Up"); setMensaje(""); }}>
          Sign Up
        </div>
        <div className={`tab ${action === "Login" ? "active" : ""}`}
          onClick={() => { setAction("Login"); setMensaje(""); }}>
          Login
        </div>
      </div>

      <div className="form-title">
        {action === "Sign Up" ? "Crear Cuenta" : "Iniciar Sesión"}
      </div>

      {/* Campos */}
      {action === "Sign Up" && (
        <div className="field">
          <span className="icon">👤</span>
          <input type="text" placeholder="Nombre" value={nombre}
            onChange={(e) => setNombre(e.target.value)} />
        </div>
      )}

      <div className="field">
        <span className="icon">✉️</span>
        <input type="email" placeholder="Correo electrónico" value={email}
          onChange={(e) => setEmail(e.target.value)} />
      </div>

      {/* Hint de tipo de cuenta — solo en Sign Up cuando escribe el email */}
      {action === "Sign Up" && email.includes("@") && (
        <div className={`account-type-hint ${esMedico ? "medico" : "paciente"}`}>
          {esMedico
            ? "👨‍⚕️ Se creará una cuenta de médico"
            : "🧠 Se creará una cuenta de paciente"}
        </div>
      )}

      <div className="field">
        <span className="icon">🔒</span>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Requisitos de contraseña — solo en Sign Up */}
      {action === "Sign Up" && (
        <div className="password-hints">
          <span className={password.length >= 8     ? "hint ok" : "hint"}>✓ Mínimo 8 caracteres</span>
          <span className={/[A-Z]/.test(password)   ? "hint ok" : "hint"}>✓ Al menos una mayúscula</span>
          <span className={/[a-z]/.test(password)   ? "hint ok" : "hint"}>✓ Al menos una minúscula</span>
          <span className={/[0-9]/.test(password)   ? "hint ok" : "hint"}>✓ Al menos un número</span>
        </div>
      )}

      {action === "Login" && (
        <div className="forgot">
          ¿Olvidaste tu contraseña? <span>Click aquí</span>
        </div>
      )}

      {mensaje && (
        <div className={`mensaje ${mensajeError ? "error" : "success"}`}>
          {mensaje}
        </div>
      )}

      <button className="btn-main" onClick={handleSubmit}>
        {action === "Sign Up" ? "Crear cuenta" : "Entrar"}
      </button>
    </div>
  );
};

export default LoginSignup;