import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Validator.java
 * Responsabilidad: validaciones de entrada y hashing de contraseñas
 * Single Responsibility Principle — solo valida, no toca BD ni HTTP
 */
public class Validator {

    // ── Validación de email ────────────────────────────────────
    public static boolean emailValido(String email) {
        if (email == null || email.isEmpty()) return false;
        // Debe tener @ y un punto después del @
        int at = email.indexOf('@');
        if (at < 1) return false;
        String dominio = email.substring(at + 1);
        return dominio.contains(".") && dominio.length() > 2;
    }

    // ── Validación de contraseña ───────────────────────────────
    public static String validarPassword(String password) {
        if (password == null || password.length() < 8)
            return "La contraseña debe tener al menos 8 caracteres";
        if (!password.matches(".*[A-Z].*"))
            return "La contraseña debe incluir al menos una mayúscula";
        if (!password.matches(".*[a-z].*"))
            return "La contraseña debe incluir al menos una minúscula";
        if (!password.matches(".*[0-9].*"))
            return "La contraseña debe incluir al menos un número";
        return null; // null = válida
    }

    // ── Validación de nombre ───────────────────────────────────
    public static boolean nombreValido(String nombre) {
        return nombre != null && !nombre.trim().isEmpty() && nombre.length() >= 2;
    }

    // ── Hash SHA-256 ───────────────────────────────────────────
    // Las contraseñas NUNCA se guardan en texto plano
    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error al hashear contraseña", e);
        }
    }
}
