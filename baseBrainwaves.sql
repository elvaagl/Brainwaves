-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS brainwaves_bd;
USE brainwaves_bd;

-- 2. Crear la tabla para las lecturas del sensor
CREATE TABLE IF NOT EXISTS lecturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    valor INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alertas para nivel de stress alto. Funcion extra 
 
CREATE TABLE IF NOT EXISTS alertas_estres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lectura_id INT,
    mensaje VARCHAR(255),
    nivel_detectado INT,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id)
);