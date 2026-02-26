import java.sql.Connection;
import java.sql.DriverManager;

public class PruebaConexion {
    public static void main(String[] args) {
        
        String url = "jdbc:mariadb://localhost:3306/brainwaves_bd";
        String usuario = "linuxdummy";
        String clave = "linux";

        try {

            Class.forName("org.mariadb.jdbc.Driver");
            
            Connection conn = DriverManager.getConnection(url, usuario, clave);
            
            if (conn != null) {
                System.out.println("Conectado :)");
                conn.close();
            }
        } catch (Exception e) {
            System.out.println("aaa voy a llorar");
            e.printStackTrace();
        }
    }
}