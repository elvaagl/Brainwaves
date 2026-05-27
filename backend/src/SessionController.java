import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * SessionController.java
 * Responsabilidad: gestionar la sesión activa del usuario
 * POST /api/session/activa  — registra qué usuario está usando el sensor
 * DELETE /api/session/activa — cierra la sesión
 */
public class SessionController {

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [SessionController] " + msg);
    }

    public static void registrar(HttpServer server, AtomicInteger usuarioActivoId) {

        server.createContext("/api/session/activa", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendCors(exchange); return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                try {
                    String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    String idStr = extractJson(body, "usuario_id");
                    if (!idStr.isEmpty()) {
                        usuarioActivoId.set(Integer.parseInt(idStr));
                        log("Sesión activa: usuario_id=" + idStr);
                    }
                    sendJson(exchange, 200, "{\"success\":true}");
                } catch (Exception e) {
                    sendJson(exchange, 400, "{\"error\":\"Body inválido\"}");
                }
                return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("DELETE")) {
                int uid = usuarioActivoId.getAndSet(0);
                log("Sesión cerrada. Era usuario_id=" + uid);
                sendJson(exchange, 200, "{\"success\":true}");
                return;
            }

            exchange.sendResponseHeaders(405, -1);
        });

        log("Endpoints /api/session/activa registrados.");
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

    private static String extractJson(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) {
            // Intentar como número (sin comillas)
            search = "\"" + key + "\":";
            start = json.indexOf(search);
            if (start == -1) return "";
            start += search.length();
            int end = json.indexOf("}", start);
            String val = json.substring(start, end == -1 ? json.length() : end).trim()
                .replaceAll("[^0-9]", "");
            return val;
        }
        start += search.length();
        int end = json.indexOf("\"", start);
        return end == -1 ? "" : json.substring(start, end);
    }
}