import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;

/**
 * AuthService.java
 * Responsabilidad: endpoints de autenticación (register, login)
 * Rol asignado automáticamente por dominio de email:
 *   - @brainwaves.com → medico
 *   - cualquier otro  → paciente
 */
public class AuthService {

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [AuthService] " + msg);
    }

    /**
     * Detecta el rol según el dominio del email.
     * @brainwaves.com → "medico" | cualquier otro → "paciente"
     */
    private static String detectarRol(String email) {
        if (email != null && email.toLowerCase().endsWith("@brainwaves.com")) {
            return "medico";
        }
        return "paciente";
    }

    public static void registrarEndpoints(HttpServer server, Connection conn) {

        // ── Registro ──────────────────────────────────────────
        server.createContext("/api/auth/register", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendCors(exchange); return;
            }
            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                exchange.sendResponseHeaders(405, -1); return;
            }

            String body     = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String nombre   = extractJson(body, "nombre");
            String email    = extractJson(body, "email");
            String password = extractJson(body, "password");

            // Validaciones
            if (!Validator.nombreValido(nombre)) {
                sendJson(exchange, 400, "{\"success\":false, \"message\":\"El nombre es requerido\"}");
                return;
            }
            if (!Validator.emailValido(email)) {
                sendJson(exchange, 400, "{\"success\":false, \"message\":\"Correo electrónico inválido\"}");
                return;
            }
            String errorPass = Validator.validarPassword(password);
            if (errorPass != null) {
                sendJson(exchange, 400, "{\"success\":false, \"message\":\"" + errorPass + "\"}");
                return;
            }

            String passwordHash = Validator.hashPassword(password);
            // Rol detectado automáticamente por dominio
            String rol = detectarRol(email);

            String response; int status;
            try {
                PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)"
                );
                ps.setString(1, nombre);
                ps.setString(2, email);
                ps.setString(3, passwordHash);
                ps.setString(4, rol);
                ps.executeUpdate();

                // Informar al frontend qué tipo de cuenta se creó
                String tipoStr = rol.equals("medico") ? "Cuenta médica creada" : "Usuario registrado";
                response = "{\"success\":true, \"message\":\"" + tipoStr + "\", \"rol\":\"" + rol + "\"}";
                status = 201;
                log("Nuevo usuario: " + email + " | rol: " + rol);
            } catch (SQLException e) {
                response = "{\"success\":false, \"message\":\"Email ya registrado\"}";
                status = 409;
            }
            sendJson(exchange, status, response);
        });

        // ── Login ─────────────────────────────────────────────
        server.createContext("/api/auth/login", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendCors(exchange); return;
            }
            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                exchange.sendResponseHeaders(405, -1); return;
            }

            String body     = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String email    = extractJson(body, "email");
            String password = extractJson(body, "password");

            if (!Validator.emailValido(email)) {
                sendJson(exchange, 400, "{\"success\":false, \"message\":\"Correo electrónico inválido\"}");
                return;
            }

            String passwordHash = Validator.hashPassword(password);

            String response; int status;
            try {
                PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, nombre, rol FROM usuarios WHERE email=? AND password=?"
                );
                ps.setString(1, email);
                ps.setString(2, passwordHash);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    String nombre = rs.getString("nombre");
                    int    id     = rs.getInt("id");
                    String rol    = rs.getString("rol");
                    response = "{\"success\":true, \"nombre\":\"" + nombre + "\", \"id\":" + id + ", \"rol\":\"" + rol + "\"}";
                    status = 200;
                    log("Login exitoso: " + email + " | rol: " + rol);
                } else {
                    response = "{\"success\":false, \"message\":\"Credenciales incorrectas\"}";
                    status = 401;
                }
            } catch (SQLException e) {
                response = "{\"success\":false, \"message\":\"Error en servidor\"}";
                status = 500;
            }
            sendJson(exchange, status, response);
        });

        log("Endpoints auth registrados.");
    }

    private static void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.sendResponseHeaders(204, -1);
    }

    static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String extractJson(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return "";
        start += search.length();
        int end = json.indexOf("\"", start);
        return end == -1 ? "" : json.substring(start, end);
    }
}