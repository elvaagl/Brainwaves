import java.io.*;
import java.net.InetSocketAddress;
import java.sql.*;
import java.time.LocalDateTime;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;

public class LectorEEG {

    private static void registrar(String mensaje) {
        System.out.println("[" + LocalDateTime.now() + "] " + mensaje);
    }

    public static void main(String[] args) {
        String url = "jdbc:mariadb://localhost:3306/brainwaves_bd";
        String user = "linuxdummy";
        String pass = "linux";

        try {
            Connection conn = DriverManager.getConnection(url, user, pass);
            registrar("Conectado a MariaDB.");

            iniciarServidorWeb(conn);

            RandomAccessFile lector = new RandomAccessFile("datos_eeg.txt", "r");
            long ultimaPosicion = 0;

            while (true) {
                if (lector.length() > ultimaPosicion) {
                    lector.seek(ultimaPosicion);
                    String linea = lector.readLine();
                    if (linea != null && !linea.trim().isEmpty()) {
                        int valor = Integer.parseInt(linea.trim());
                        
                        // Guardar en BD
                        PreparedStatement stmt = conn.prepareStatement("INSERT INTO lecturas (valor) VALUES (?)");
                        stmt.setInt(1, valor);
                        stmt.executeUpdate();
                        registrar("Dato guardado: " + valor);
                    }
                    ultimaPosicion = lector.getFilePointer();
                }
                Thread.sleep(100);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // EL MINI SERVIDOR (Funcionalidad Extra)
    public static void iniciarServidorWeb(Connection conn) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/brain/status", (exchange) -> {
            int ultimoValor = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT valor FROM lecturas ORDER BY id DESC LIMIT 1")) {
                if (rs.next()) ultimoValor = rs.getInt("valor");
            } catch (SQLException e) { e.printStackTrace(); }

            // Lógica extra: Diagnóstico
            String diag = (ultimoValor > 600) ? "Actividad Alta" : "Relajado";
            String col = (ultimoValor > 600) ? "#ba7e7e" : "#ffc0cb";

            String json = "{\"valor\":" + ultimoValor + ", \"diagnostico\":\"" + diag + "\", \"color_sugerido\":\"" + col + "\"}";

            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, json.length());
            OutputStream os = exchange.getResponseBody();
            os.write(json.getBytes());
            os.close();
        });
        server.start();
        registrar("Servidor Web activo en puerto 8080");
    }
}