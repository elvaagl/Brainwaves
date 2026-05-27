import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;

/**
 * PacientesController.java
 * Responsabilidad: endpoints de pacientes e historial de canciones
 * GET /api/pacientes               — lista con última lectura
 * GET /api/pacientes/historial?id= — últimas 20 lecturas EEG
 * GET /api/music/historial?id=     — historial de canciones
 */
public class PacientesController {

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [PacientesController] " + msg);
    }

    public static void registrar(HttpServer server, Connection conn) {

        // GET /api/pacientes
        server.createContext("/api/pacientes", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            String path = exchange.getRequestURI().getPath();
            if (path.contains("historial")) { exchange.sendResponseHeaders(404, -1); return; }

            try {
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(
                    "SELECT u.id, u.nombre, u.email, " +
                    "  (SELECT valor FROM lecturas WHERE usuario_id = u.id ORDER BY id DESC LIMIT 1) AS ultimo_valor, " +
                    "  (SELECT fecha FROM lecturas WHERE usuario_id = u.id ORDER BY id DESC LIMIT 1) AS ultima_fecha " +
                    "FROM usuarios u WHERE u.rol = 'paciente' ORDER BY u.nombre ASC"
                );
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    int valor = rs.getInt("ultimo_valor");
                    String fecha = rs.getString("ultima_fecha");
                    json.append("{")
                        .append("\"id\":").append(rs.getInt("id")).append(",")
                        .append("\"nombre\":\"").append(escapeJson(rs.getString("nombre"))).append("\",")
                        .append("\"email\":\"").append(escapeJson(rs.getString("email"))).append("\",")
                        .append("\"valor\":").append(valor).append(",")
                        .append("\"onda\":\"").append(BrainController.clasificarOnda(valor)).append("\",")
                        .append("\"diagnostico\":\"").append(BrainController.clasificarDiagnostico(valor)).append("\",")
                        .append("\"ultimaLectura\":\"").append(fecha != null ? fecha : "").append("\",")
                        .append("\"alerta\":").append(valor >= 2000)
                        .append("}");
                    first = false;
                }
                json.append("]");
                rs.close(); st.close();
                sendJson(exchange, 200, json.toString());
            } catch (SQLException e) {
                sendJson(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        });

        // GET /api/pacientes/historial?id=X
        server.createContext("/api/pacientes/historial", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            String idStr = getQueryParam(exchange, "id");
            if (idStr.isEmpty()) { sendJson(exchange, 400, "{\"error\":\"Falta id\"}"); return; }
            try {
                PreparedStatement ps = conn.prepareStatement(
                    "SELECT valor, fecha FROM lecturas WHERE usuario_id = ? ORDER BY id DESC LIMIT 20"
                );
                ps.setInt(1, Integer.parseInt(idStr));
                ResultSet rs = ps.executeQuery();
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    int valor = rs.getInt("valor");
                    String ts = rs.getString("fecha");
                    json.append("{")
                        .append("\"valor\":").append(valor).append(",")
                        .append("\"onda\":\"").append(BrainController.clasificarOnda(valor)).append("\",")
                        .append("\"diagnostico\":\"").append(BrainController.clasificarDiagnostico(valor)).append("\",")
                        .append("\"ts\":\"").append(ts != null ? ts : "").append("\"")
                        .append("}");
                    first = false;
                }
                json.append("]");
                rs.close(); ps.close();
                sendJson(exchange, 200, json.toString());
            } catch (Exception e) {
                sendJson(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        });

        // GET /api/music/historial?id=X
        server.createContext("/api/music/historial", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            String idStr = getQueryParam(exchange, "id");
            if (idStr.isEmpty()) { sendJson(exchange, 400, "{\"error\":\"Falta id\"}"); return; }
            try {
                PreparedStatement ps = conn.prepareStatement(
                    "SELECT cancion, artista, youtube_url, onda, valor_eeg, fecha " +
                    "FROM historial_canciones WHERE usuario_id = ? ORDER BY id DESC LIMIT 20"
                );
                ps.setInt(1, Integer.parseInt(idStr));
                ResultSet rs = ps.executeQuery();
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("{")
                        .append("\"cancion\":\"").append(escapeJson(rs.getString("cancion"))).append("\",")
                        .append("\"artista\":\"").append(escapeJson(rs.getString("artista"))).append("\",")
                        .append("\"url\":\"").append(escapeJson(rs.getString("youtube_url"))).append("\",")
                        .append("\"onda\":\"").append(escapeJson(rs.getString("onda"))).append("\",")
                        .append("\"valor\":").append(rs.getInt("valor_eeg")).append(",")
                        .append("\"fecha\":\"").append(rs.getString("fecha")).append("\"")
                        .append("}");
                    first = false;
                }
                json.append("]");
                rs.close(); ps.close();
                sendJson(exchange, 200, json.toString());
            } catch (Exception e) {
                sendJson(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        });

        log("Endpoints /api/pacientes/* y /api/music/historial registrados.");
    }

    private static String getQueryParam(HttpExchange exchange, String param) {
        String query = exchange.getRequestURI().getQuery();
        if (query == null) return "";
        for (String p : query.split("&")) {
            if (p.startsWith(param + "=")) return p.substring(param.length() + 1);
        }
        return "";
    }

    static String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody(); os.write(bytes); os.close();
    }

    private static void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.sendResponseHeaders(204, -1);
    }
}