# 🧠 Brainwaves

Sistema de monitoreo de actividad bioeléctrica en tiempo real. Captura señales EEG/ECG con un sensor AD8232 + ESP32, las procesa en un backend Java y las visualiza en una interfaz React.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Hardware | ESP32 DEVKIT V1 + AD8232 |
| Sensor | C++ (threads, mutex, serial) |
| Backend | Java (HTTP server, SSE, MariaDB) |
| Base de datos | MariaDB 10.11 |
| Frontend | React + Vite + Chart.js |
| Infraestructura | Docker Compose |

---

## Arquitectura
ESP32 → sensor.cpp → /data/datos_eeg.txt → LectorEEG.java → MariaDB → React (SSE)

---

## Requisitos

- Docker y Docker Compose
- VirtualBox con Xubuntu (o Linux nativo)
- ESP32 DEVKIT V1 + sensor AD8232

---

## Instrucciones de arranque

### 1. Clonar el repositorio
```bash
git clone https://github.com/elvaagl/Brainwaves.git
cd Brainwaves
```

### 2. Levantar los contenedores
```bash
docker compose up -d
```

### 3. Conectar el ESP32 por USB
En VirtualBox → Dispositivos → USB → seleccionar ESP32.

### 4. Dar permisos al puerto serial
```bash
sudo chmod 666 /dev/ttyUSB0
docker compose restart sensor
```

### 5. Verificar que el sensor lee datos
```bash
docker logs brainwaves_sensor --tail 10
```

### 6. Abrir la app
http://localhost

---

## Estructura del proyecto
brainwaves-main/
├── docker-compose.yml
├── backend/src/
│   ├── LectorEEG.java          ← main, pipe, arranque
│   ├── BrainController.java    ← /api/brain/, SSE, música
│   ├── AuthService.java        ← /api/auth/login y register
│   ├── Validator.java          ← validaciones y SHA-256
│   ├── PacientesController.java ← /api/pacientes/, historial canciones
│   ├── ExportController.java   ← /api/export/* CSV
│   └── SessionController.java  ← /api/session/activa
├── sensor/src/
│   └── sensor.cpp              ← threads, mutex, serial, señales SO
├── frontend/login-app/src/
│   ├── App.jsx                 ← rutas
│   ├── Home.jsx                ← dashboard paciente
│   ├── HomeMedico.jsx          ← dashboard médico
│   ├── Waves.jsx               ← contenido educativo (Facts Waves)
│   ├── PanelClinico.jsx        ← panel médico con datos reales
│   ├── Graphics.jsx            ← monitor tiempo real + historial canciones
│   └── components/loginSignup/ ← login y registro
└── database/
└── baseBrainwaves.sql

---

## Endpoints del backend (puerto 8080)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/register | Registro de usuario |
| GET | /api/brain/status | Estado actual del sensor |
| GET | /api/brain/recommendation | Onda, estado y canción recomendada |
| GET | /api/brain/stream | SSE en tiempo real |
| GET | /api/music/recommendation | Recomendación via Last.fm |
| GET | /api/music/historial?id=X | Historial de canciones del paciente |
| GET | /api/pacientes | Lista de pacientes con última lectura |
| GET | /api/pacientes/historial?id=X | Últimas 20 lecturas EEG |
| POST | /api/session/activa | Registrar usuario activo en el sensor |
| DELETE | /api/session/activa | Cerrar sesión activa |
| GET | /api/export/pacientes | Exportar pacientes CSV |
| GET | /api/export/lecturas | Exportar lecturas CSV |

---

## Conceptos de Sistemas Operativos implementados

- **Threads** — `std::thread` para lector serial y escritor de archivo
- **Mutex** — `std::mutex` + `std::lock_guard` para proteger la cola compartida
- **IPC** — volumen Docker compartido como canal entre contenedores
- **Señales del SO** — `SIGINT` y `SIGTERM` para cierre limpio
- **`std::atomic`** — flag thread-safe de parada
- **`AtomicInteger`** — `usuarioActivoId` compartido entre hilos SSE
- **Variables de ambiente** — configuración externalizada con `System.getenv()`
- **Buffer** — `std::queue` como buffer productor-consumidor

---

## Credenciales por defecto

- Médico: `doctor@brainwaves.com` / `Doctor123`
- Cuentas `@brainwaves.com` → rol médico automático
