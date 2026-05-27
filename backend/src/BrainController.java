import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * BrainController.java
 * Responsabilidad: endpoints de actividad cerebral, música y SSE
 * GET /api/brain/status
 * GET /api/brain/recommendation
 * GET /api/brain/stream  (SSE)
 * GET /api/music/recommendation
 */
public class BrainController {

    private static void log(String msg) {
        System.out.println("[" + LocalDateTime.now() + "] [BrainController] " + msg);
    }

    public static void registrar(HttpServer server, Connection conn, AtomicInteger usuarioActivoId) {

        // GET /api/brain/status
        server.createContext("/api/brain/status", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            int valor = leerUltimoValor(conn);
            String semaforo, diagnostico, colorSugerido;
            if (valor == 0)        { semaforo = "⚪"; diagnostico = "Sin señal";     colorSugerido = "#999999"; }
            else if (valor < 1975) { semaforo = "🟢"; diagnostico = "Relajado";      colorSugerido = "#4caf50"; }
            else if (valor < 1993) { semaforo = "🟡"; diagnostico = "Atención";       colorSugerido = "#ff9800"; }
            else                   { semaforo = "🔴"; diagnostico = "Actividad Alta"; colorSugerido = "#ba7e7e"; }
            sendJson(exchange, 200, "{\"valor\":" + valor
                + ",\"semaforo\":\"" + semaforo + "\""
                + ",\"diagnostico\":\"" + diagnostico + "\""
                + ",\"color_sugerido\":\"" + colorSugerido + "\"}");
        });

        // GET /api/brain/recommendation
        server.createContext("/api/brain/recommendation", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            int valor = leerUltimoValor(conn);
            String[] rec = buildRecomendacion(valor);
            // rec: [onda, estado, cancion, youtubeUrl, color]
            sendJson(exchange, 200, "{\"valor\":" + valor
                + ",\"onda\":\"" + rec[0] + "\",\"estado\":\"" + rec[1] + "\""
                + ",\"cancion\":\"" + rec[2] + "\",\"youtubeUrl\":\"" + rec[3] + "\""
                + ",\"color\":\"" + rec[4] + "\"}");
        });

        // GET /api/music/recommendation (Last.fm)
        server.createContext("/api/music/recommendation", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            try {
                String apiKey = System.getenv().getOrDefault("LASTFM_API_KEY", "");
                int valor = leerUltimoValor(conn);
                String tag, estado;
                if (valor < 200)       { tag = "sleep";      estado = "Sueño profundo"; }
                else if (valor < 400)  { tag = "meditation"; estado = "Meditación"; }
                else if (valor < 1975) { tag = "ambient";    estado = "Relajado"; }
                else if (valor < 1993) { tag = "focus";      estado = "Concentrado"; }
                else                   { tag = "calm";        estado = "Estrés alto"; }

                String lastfmUrl = "https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks"
                    + "&tag=" + tag + "&api_key=" + apiKey + "&format=json&limit=5";
                URL url = new URL(lastfmUrl);
                HttpURLConnection conn2 = (HttpURLConnection) url.openConnection();
                conn2.setRequestMethod("GET");
                conn2.setRequestProperty("User-Agent", "BrainwavesApp/1.0");
                String body = new String(conn2.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

                String trackName = extractJson(body, "name");
                String artistName = "";
                int artistIdx = body.indexOf("\"artist\":{");
                if (artistIdx != -1) artistName = extractJson(body.substring(artistIdx), "name");
                String youtubeUrl = "https://www.youtube.com/results?search_query="
                    + trackName.replace(" ", "+") + "+" + artistName.replace(" ", "+");

                sendJson(exchange, 200, "{\"valor\":" + valor
                    + ",\"estado\":\"" + estado + "\",\"tag\":\"" + tag + "\""
                    + ",\"cancion\":\"" + trackName + "\",\"artista\":\"" + artistName + "\""
                    + ",\"url\":\"" + youtubeUrl + "\"}");
            } catch (Exception e) {
                log("ERROR Last.fm: " + e.getMessage());
                sendJson(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        });

        // GET /api/brain/stream (SSE)
        server.createContext("/api/brain/stream", (exchange) -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendCors(exchange); return; }
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "text/event-stream");
            exchange.getResponseHeaders().add("Cache-Control", "no-cache");
            exchange.getResponseHeaders().add("Connection", "keep-alive");
            exchange.sendResponseHeaders(200, 0);
            log("Cliente SSE conectado.");

            new Thread(() -> {
                try {
                    OutputStream os = exchange.getResponseBody();
                    String ultimaCancionGuardada = "";
                    int ticksSinCambio = 0;

                    while (true) {
                        int valor = leerUltimoValor(conn);
                        String[] rec = buildRecomendacionSSE(valor);
                        // rec: [onda, estado, semaforo, colorSugerido, color, cancion, youtubeUrl]

                        // Guardar canción en historial si cambió o cada 60 ticks
                        int uid = usuarioActivoId.get();
                        String cancion = rec[5];
                        if (uid > 0 && !cancion.isEmpty()) {
                            ticksSinCambio++;
                            if (!cancion.equals(ultimaCancionGuardada) || ticksSinCambio >= 60) {
                                try {
                                    String[] partes = cancion.split(" - ", 2);
                                    String nombreCancion = partes[0].trim();
                                    String artista = partes.length > 1 ? partes[1].trim() : "";
                                    PreparedStatement ps = conn.prepareStatement(
                                        "INSERT INTO historial_canciones (usuario_id, cancion, artista, youtube_url, onda, valor_eeg) " +
                                        "VALUES (?, ?, ?, ?, ?, ?)"
                                    );
                                    ps.setInt(1, uid);
                                    ps.setString(2, nombreCancion);
                                    ps.setString(3, artista);
                                    ps.setString(4, rec[6]);
                                    ps.setString(5, rec[0]);
                                    ps.setInt(6, valor);
                                    ps.executeUpdate();
                                    ps.close();
                                    ultimaCancionGuardada = cancion;
                                    ticksSinCambio = 0;
                                    log("Canción guardada: " + cancion + " (uid=" + uid + ")");
                                } catch (SQLException e) {
                                    log("Error guardando canción: " + e.getMessage());
                                }
                            }
                        }

                        String json = "{\"valor\":" + valor
                            + ",\"semaforo\":\"" + rec[2] + "\""
                            + ",\"diagnostico\":\"" + rec[1] + "\""
                            + ",\"color_sugerido\":\"" + rec[3] + "\""
                            + ",\"onda\":\"" + rec[0] + "\""
                            + ",\"estado\":\"" + rec[1] + "\""
                            + ",\"color\":\"" + rec[4] + "\""
                            + ",\"cancion\":\"" + rec[5] + "\""
                            + ",\"url\":\"" + rec[6] + "\"}";

                        os.write(("data: " + json + "\n\n").getBytes(StandardCharsets.UTF_8));
                        os.flush();
                        Thread.sleep(1000);
                    }
                } catch (Exception e) {
                    log("Cliente SSE desconectado.");
                }
            }).start();
        });

        log("Endpoints /api/brain/* y /api/music/* registrados.");
    }

    // ── Helpers de clasificación (static para que ExportController los use) ──

    public static String clasificarOnda(int valor) {
        if (valor < 200)       return "Delta";
        else if (valor < 400)  return "Theta";
        else if (valor < 1975) return "Alpha";
        else if (valor < 1993) return "Beta";
        else                   return "Gamma";
    }

    public static String clasificarDiagnostico(int valor) {
        if (valor == 0)        return "Sin señal";
        else if (valor < 200)  return "Sueño profundo";
        else if (valor < 400)  return "Meditación";
        else if (valor < 1975) return "Relajado";
        else if (valor < 1993) return "Concentrado";
        else                   return "Actividad alta";
    }

    // Devuelve [onda, estado, cancion, youtubeUrl, color]
    private static String[] buildRecomendacion(int valor) {
        if (valor < 200)       return new String[]{"Delta","Sueño profundo","Rain and Thunder Sleep Sounds - Relaxing Nature","https://www.youtube.com/results?search_query=rain+thunder+sleep+sounds","#9b8ea8"};
        else if (valor < 400)  return new String[]{"Theta","Meditación","Weightless - Marconi Union","https://www.youtube.com/results?search_query=weightless+marconi+union","#7eaaba"};
        else if (valor < 1975) return new String[]{"Alpha","Relajado","F Song - Strawberry Guy","https://www.youtube.com/results?search_query=f+song+strawberry+guy","#ffc0cb"};
        else if (valor < 1993) return new String[]{"Beta","Concentrado","Just Dream - Dirty South","https://www.youtube.com/results?search_query=just+dream+dirty+south","#f4a460"};
        else                   return new String[]{"Gamma","Estrés alto","Younger - Seinabo Sey","https://www.youtube.com/results?search_query=younger+seinabo+sey","#ba7e7e"};
    }

    // Devuelve [onda, estado, semaforo, colorSugerido, color, cancion, youtubeUrl]
    private static String[] buildRecomendacionSSE(int valor) {
        if (valor == 0)        return new String[]{"Alpha","Sin señal","⚪","#999999","#ffc0cb","",""};
        else if (valor < 200)  return new String[]{"Delta","Sueño profundo","🟢","#4caf50","#9b8ea8","Rain and Thunder Sleep Sounds","https://www.youtube.com/results?search_query=rain+thunder+sleep+sounds"};
        else if (valor < 400)  return new String[]{"Theta","Meditación","🟢","#4caf50","#7eaaba","Weightless - Marconi Union","https://www.youtube.com/results?search_query=weightless+marconi+union"};
        else if (valor < 1975) return new String[]{"Alpha","Relajado","🟢","#4caf50","#ffc0cb","F Song - Strawberry Guy","https://www.youtube.com/results?search_query=f+song+strawberry+guy"};
        else if (valor < 1993) return new String[]{"Beta","Concentrado","🟡","#ff9800","#f4a460","Just Dream - Dirty South","https://www.youtube.com/results?search_query=just+dream+dirty+south"};
        else                   return new String[]{"Gamma","Actividad alta","🔴","#ba7e7e","#ba7e7e","Younger - Seinabo Sey","https://www.youtube.com/results?search_query=younger+seinabo+sey"};
    }

    private static int leerUltimoValor(Connection conn) {
        try {
            Statement st = conn.createStatement();
            ResultSet rs = st.executeQuery("SELECT valor FROM lecturas ORDER BY id DESC LIMIT 1");
            int v = rs.next() ? rs.getInt("valor") : 0;
            rs.close(); st.close();
            return v;
        } catch (SQLException e) { return 0; }
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
        if (start == -1) return "";
        start += search.length();
        int end = json.indexOf("\"", start);
        return end == -1 ? "" : json.substring(start, end);
    }
}