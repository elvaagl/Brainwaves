#include <iostream>
#include <fstream> // Para manejar archivos
#include <unistd.h> // Para la función sleep (pausa)
#include <cstdlib>  // Para generar números aleatorios
#include <ctime>    // Para la semilla del tiempo

int main() {
    std::ofstream archivo;
    std::srand(std::time(0)); // Inicializar semilla aleatoria

    std::cout << "Iniciando simulador de EEG... Presiona Ctrl+C para detener." << std::endl;

    while (true) {
        // Abrimos el archivo en modo "append" (añadir al final)
        archivo.open("datos_eeg.txt", std::ios::app);
        
        if (archivo.is_open()) {
            int valor = std::rand() % 1024; // Simula un valor de 0 a 1023 (10 bits)
            archivo << valor << std::endl;
            archivo.close();
            
            std::cout << "Dato capturado: " << valor << std::endl;
        }

        usleep(500000); // Pausa de 0.5 segundos (500,000 microsegundos)
    }

    return 0;
}