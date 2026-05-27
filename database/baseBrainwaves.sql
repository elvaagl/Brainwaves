-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS brainwaves_bd;
USE brainwaves_bd;

-- 2. Tabla de lecturas del sensor
CREATE TABLE IF NOT EXISTS lecturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    valor INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Alertas de estrés
CREATE TABLE IF NOT EXISTS alertas_estres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lectura_id INT,
    mensaje VARCHAR(255),
    nivel_detectado INT,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id)
);

-- 4. Tabla de usuarios con rol
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('paciente', 'medico') DEFAULT 'paciente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Relacionar lecturas con usuarios
ALTER TABLE lecturas ADD COLUMN IF NOT EXISTS usuario_id INT;
ALTER TABLE lecturas ADD CONSTRAINT IF NOT EXISTS fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

-- 6. Marcadores clínicos del médico
CREATE TABLE IF NOT EXISTS marcadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lectura_id INT,
    nota VARCHAR(500),
    valor_en_marcador INT,
    fecha_marcador TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id)
);

-- 7. Usuario médico por defecto (password: Doctor123)
-- SHA-256 de "Doctor123" = 1a4e5e2b8c7d...
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES (
    'Dr. Brainwaves',
    'doctor@brainwaves.com',
    SHA2('Doctor123', 256),
    'medico'
);


CREATE TABLE IF NOT EXISTS historial_canciones (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT NOT NULL,
    cancion      VARCHAR(255) NOT NULL,
    artista      VARCHAR(255),
    youtube_url  VARCHAR(500),
    onda         VARCHAR(20),
    valor_eeg    INT,
    fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
 