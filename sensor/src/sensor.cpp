#include <iostream>
#include <fstream>
#include <unistd.h>
#include <cstdlib>
#include <ctime>
#include <fcntl.h>
#include <termios.h>
#include <string>
#include <cstring>
#include <thread>
#include <mutex>
#include <queue>
#include <atomic>
#include <csignal>

// ─── Sincronización entre threads ─────────────────────────────────────────────
std::queue<int>  colaValores;   // Buffer compartido entre threads
std::mutex       mtx;           // Protege la cola (igual que en clase)
std::atomic<bool> corriendo(true); // Flag para detener los threads limpiamente

// ─── Manejo de señales del SO (SIGINT = Ctrl+C, SIGTERM = docker stop) ────────
void manejarSenal(int sig) {
    std::cout << "\n[SEÑAL " << sig << "] Cerrando sensor limpiamente..." << std::endl;
    corriendo = false;
}

// ─── Configurar puerto serial ─────────────────────────────────────────────────
int configurarSerial(const char* puerto) {
    int fd = open(puerto, O_RDWR | O_NOCTTY | O_SYNC);
    if (fd < 0) {
        std::cerr << "Error abriendo puerto serial: " << puerto << std::endl;
        return -1;
    }

    struct termios tty;
    memset(&tty, 0, sizeof tty);
    if (tcgetattr(fd, &tty) != 0) {
        std::cerr << "Error en tcgetattr" << std::endl;
        return -1;
    }

    // 115200 baudios — mismo que el sketch de ESP32
    cfsetospeed(&tty, B115200);
    cfsetispeed(&tty, B115200);

    tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8;
    tty.c_iflag &= ~IGNBRK;
    tty.c_lflag = 0;
    tty.c_oflag = 0;
    tty.c_cc[VMIN]  = 1;
    tty.c_cc[VTIME] = 5;
    tty.c_iflag &= ~(IXON | IXOFF | IXANY);
    tty.c_cflag |= (CLOCAL | CREAD);
    tty.c_cflag &= ~(PARENB | PARODD);
    tty.c_cflag &= ~CSTOPB;
    tty.c_cflag &= ~CRTSCTS;

    if (tcsetattr(fd, TCSANOW, &tty) != 0) {
        std::cerr << "Error en tcsetattr" << std::endl;
        return -1;
    }

    return fd;
}

// ─── THREAD 1: Lector Serial ──────────────────────────────────────────────────
// Lee bytes del puerto serial y mete valores a la cola compartida
void threadLectorSerial(int fd) {
    std::cout << "[Thread Lector] Iniciado — leyendo ESP32..." << std::endl;
    std::string linea = "";

    while (corriendo) {
        char c;
        int n = read(fd, &c, 1);
        if (n > 0) {
            if (c == '\n') {
                // Limpiar \r si existe
                if (!linea.empty() && linea.back() == '\r') {
                    linea.pop_back();
                }

                // Ignorar electrodos desconectados
                if (linea != "!" && !linea.empty()) {
                    try {
                        int valor = std::stoi(linea);

                        // lock_guard protege la cola — igual que mutex en clase
                        std::lock_guard<std::mutex> bloquear(mtx);
                        colaValores.push(valor);

                    } catch (...) {
                        // Ignorar líneas que no sean números
                    }
                }
                linea = "";
            } else {
                linea += c;
            }
        }
    }
    std::cout << "[Thread Lector] Terminado." << std::endl;
}

// ─── THREAD 2: Escritor de Archivo ───────────────────────────────────────────
// Saca valores de la cola y los escribe al archivo compartido con el backend
void threadEscritorArchivo() {
    std::cout << "[Thread Escritor] Iniciado — escribiendo a /data/datos_eeg.txt..." << std::endl;

    while (corriendo) {
        int valor = -1;

        {
            // lock_guard protege la cola al leer
            std::lock_guard<std::mutex> bloquear(mtx);
            if (!colaValores.empty()) {
                valor = colaValores.front();
                colaValores.pop();
            }
        }

        if (valor != -1) {
            std::ofstream archivo("/data/datos_eeg.txt", std::ios::app);
            if (archivo.is_open()) {
                archivo << valor << std::endl;
                archivo.close();
                std::cout << "[Thread Escritor] Dato guardado: " << valor << std::endl;
            }
        } else {
            // Sin datos, esperar un poco antes de revisar de nuevo
            usleep(10000); // 10ms
        }
    }
    std::cout << "[Thread Escritor] Terminado." << std::endl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
int main() {
    // Registrar manejadores de señales del SO
    signal(SIGINT,  manejarSenal);  // Ctrl+C
    signal(SIGTERM, manejarSenal);  // docker stop

    const char* puerto = "/dev/ttyUSB0";
    std::cout << "Conectando a ESP32 en " << puerto << "..." << std::endl;

    int fd = -1;
    while (fd < 0 && corriendo) {
        fd = configurarSerial(puerto);
        if (fd < 0) {
            std::cerr << "Reintentando en 3 segundos..." << std::endl;
            sleep(3);
        }
    }

    if (fd < 0) return 1;
    std::cout << "Conectado a ESP32." << std::endl;

    // Lanzar los dos threads
    std::thread lector(threadLectorSerial, fd);
    std::thread escritor(threadEscritorArchivo);

    // Esperar a que terminen (join — igual que en clase)
    lector.join();
    escritor.join();

    close(fd);
    std::cout << "Sensor cerrado correctamente." << std::endl;
    return 0;
}
