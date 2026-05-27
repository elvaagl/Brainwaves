import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;

/**
 * ExportController.java
 * Responsabilidad: exportación de datos en formato CSV
 * GET /api/export/pacientes
 * GET /api/export/lecturas
 */
public class ExportController {

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [ExportController] " + msg);
    }

    public static void registrar(HttpServer server, Connection conn) {

        // GET /api/export/pacientes
        server.createContext("/api/export/pacientes", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) { exchange.sendResponseHeaders(405, -1); return; }

            StringBuilder csv = new StringBuilder();
            csv.append("ID,Nombre,Email,Rol,Fecha Registro\n");
            try {
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(
                    "SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY id ASC"
                );
                while (rs.next()) {
                    csv.append(rs.getInt("id")).append(",");
                    csv.append(escapeCsv(rs.getString("nombre"))).append(",");
                    csv.append(escapeCsv(rs.getString("email"))).append(",");
                    csv.append(escapeCsv(rs.getString("rol"))).append(",");
                    String fecha = rs.getString("fecha_registro");
                    csv.append(fecha != null ? escapeCsv(fecha) : "").append("\n");
                }
                rs.close(); st.close();
            } catch (SQLException e) {
                sendJson(exchange, 500, "{\"error\":\"Error al exportar pacientes\"}"); return;
            }
            sendCsv(exchange, 200, csv.toString(), "pacientes.csv");
        });

        // GET /api/export/lecturas
        server.createContext("/api/export/lecturas", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) { exchange.sendResponseHeaders(405, -1); return; }

            StringBuilder csv = new StringBuilder();
            csv.append("ID,Valor EEG,Onda,Diagnóstico,Timestamp\n");
            try {
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(
                    "SELECT id, valor, fecha FROM lecturas ORDER BY id DESC LIMIT 500"
                );
                while (rs.next()) {
                    int valor = rs.getInt("valor");
                    String ts = rs.getString("fecha");
                    csv.append(rs.getInt("id")).append(",");
                    csv.append(valor).append(",");
                    csv.append(BrainController.clasificarOnda(valor)).append(",");
                    csv.append(BrainController.clasificarDiagnostico(valor)).append(",");
                    csv.append(ts != null ? escapeCsv(ts) : "").append("\n");
                }
                rs.close(); st.close();
            } catch (SQLException e) {
                sendJson(exchange, 500, "{\"error\":\"Error al exportar lecturas\"}"); return;
            }
            sendCsv(exchange, 200, csv.toString(), "lecturas.csv");
        });

        log("Endpoints /api/export/* registrados.");
    }

    static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n"))
            return "\"" + value.replace("\"", "\"\"") + "\"";
        return value;
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody(); os.write(bytes); os.close();
    }

    private static void sendCsv(HttpExchange exchange, int status, String body, String filename) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Content-Type", "text/csv; charset=utf-8");
        exchange.getResponseHeaders().add("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody(); os.write(bytes); os.close();
    }

    private static void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.sendResponseHeaders(204, -1);
    }
}