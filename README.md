# Monitor de Ondas Cerebrales - Brainwaves Project

Este proyecto es un sistema de monitoreo en tiempo real que integra la captura de datos (simulada por C++), el almacenamiento y procesamiento en Java, y una interfaz visual moderna.

## Requisitos Previos
* **Java JDK 17** o superior.
* **MariaDB** o MySQL instalado y corriendo.
* **Conector JDBC de MariaDB** (`mariadb-java-client.jar`) en la raíz del proyecto.
* Un navegador web (se recomienda **Firefox**).

---

## Instrucciones de Inicialización

### 1. Configuración de la Base de Datos (SQL)
Antes de iniciar los programas, es necesario preparar el almacén de datos:
1.  Abra su terminal de MariaDB o su gestor visual (como MySQL Workbench).
2.  Ejecute el contenido del archivo `init_db.sql` que se encuentra en este repositorio.
3.  Esto creará la base de datos `brainwaves_bd` y las tablas necesarias para el funcionamiento y la **funcionalidad extra** (análisis de estados).

### 2. Inicialización del Backend (Java)
El backend cumple una doble función: lee los datos del sensor y actúa como servidor API para la web.
1.  Abra una terminal en la carpeta raíz del proyecto.
2.  Compile el código fuente:
    ```bash
    javac LectorEEG.java
    ```
3.  Ejecute el programa vinculando el conector de la base de datos:
    * **En Linux/M**
        ```bash
        java -cp .:mariadb-java-client.jar LectorEEG
        ```
   
4.  Verificará que aparece el mensaje: `--> Servidor Web listo en http://localhost:8080/api/brain/status`.

### 3. Inicialización del Frontend (Web)
La interfaz es estática y no requiere un servidor de node.js o similar.
1.  Localice el archivo `pagina1.html`o`waves.html`o`graphics.html` en la carpeta del proyecto.
2.  Haga clic derecho y seleccione **"Abrir con Firefox"** (o su navegador preferido).
3.  La gráfica comenzará a recibir los datos automáticamente desde el servidor Java mediante peticiones asíncronas (Fetch API).

---

## Componentes del Proyecto
* **Frontend:** `pagina1.html`, `stylesHome.css`, `home.js`, `waves.html`, `stylesFacts.css`, `facts.js`, `graphics.html`, `stylesGraphics.css`, `graphics.js` .
* **Backend:** `LectorEEG.java` .
* **Base de Datos:** MariaDB (Tablas de lecturas y registros).

## Funcionalidad Extra
Se ha implementado una **Lógica de Análisis de Datos** directamente en el Backend. El servidor Java no solo entrega el valor bruto del sensor, sino que procesa el nivel de intensidad en tiempo real, clasificándolo en estados (ej. "Relajado", "Actividad Alta") y asignando colores dinámicos que el Frontend interpreta automáticamente.
