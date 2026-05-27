import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

public class LectorEEG {

    private static final AtomicInteger usuarioActivoId = new AtomicInteger(0);

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [LectorEEG] " + msg);
    }

    public static void main(String[] args) throws Exception {
        String dbUrl    = "jdbc:mariadb://" + System.getenv().getOrDefault("DB_HOST", "localhost") + ":3306/brainwaves_bd";
        String dbUser   = System.getenv().getOrDefault("DB_USER", "linuxdummy");
        String dbPass   = System.getenv().getOrDefault("DB_PASS", "linux");
        String pipePath = System.getenv().getOrDefault("PIPE_PATH", "/data/datos_eeg.txt");

        Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
        log("Conectado a MariaDB.");

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        AuthService.registrarEndpoints(server, conn);
        BrainController.registrar(server, conn, usuarioActivoId);
        PacientesController.registrar(server, conn);
        ExportController.registrar(server, conn);
        SessionController.registrar(server, usuarioActivoId);
        server.start();
        log("Servidor HTTP activo en puerto 8080.");

        new Thread(() -> leerArchivo(conn, pipePath)).start();

        Thread.currentThread().join();
    }

    private static void leerArchivo(Connection conn, String pipePath) {
        log("Monitoreando archivo: " + pipePath);
        long ultimaPosicion = 0;

        while (true) {
            try {
                File archivo = new File(pipePath);
                if (!archivo.exists()) {
                    Thread.sleep(1000);
                    continue;
                }

                RandomAccessFile raf = new RandomAccessFile(archivo, "r");
                long tamanio = raf.length();

                if (tamanio > ultimaPosicion) {
                    raf.seek(ultimaPosicion);
                    String linea;
                    while ((linea = raf.readLine()) != null) {
                        linea = linea.trim();
                        if (!linea.isEmpty() && !linea.equals("!")) {
                            try {
                                int valor = Integer.parseInt(linea);
                                int uid = usuarioActivoId.get();
                                PreparedStatement ps;
                                if (uid > 0) {
                                    ps = conn.prepareStatement(
                                        "INSERT INTO lecturas (valor, usuario_id) VALUES (?, ?)"
                                    );
                                    ps.setInt(1, valor);
                                    ps.setInt(2, uid);
                                } else {
                                    ps = conn.prepareStatement(
                                        "INSERT INTO lecturas (valor) VALUES (?)"
                                    );
                                    ps.setInt(1, valor);
                                }
                                ps.executeUpdate();
                                log("Dato guardado: " + valor);
                            } catch (NumberFormatException ignored) {
                            } catch (SQLException e) {
                                log("Error BD: " + e.getMessage());
                            }
                        }
                    }
                    ultimaPosicion = raf.getFilePointer();
                }
                raf.close();
                Thread.sleep(500);

            } catch (Exception e) {
                log("Error leyendo archivo: " + e.getMessage());
                try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
            }
        }
    }
}
