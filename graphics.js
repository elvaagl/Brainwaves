const ctx = document.getElementById('liveChart').getContext('2d');

// 1. Mantenemos la configuración visual que ya tenías
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(15).fill(''),
        datasets: [{
            label: 'Señal del Sensor',
            data: [],
            borderColor: '#ff4d6d',
            backgroundColor: 'rgba(255, 77, 109, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { min: 0, max: 1024, grid: { display: false } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

// 2. Nueva función REAL conectada al Backend
async function updateChart() {
    try {
        // Llamada al Controller de Java
        const response = await fetch('http://localhost:8080/api/brain/status');
        
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        
        const data = await response.json();

        // data.valor viene de la tabla 'lecturas'
        const value = data.valor;
        // data.diagnostico es tu FUNCIONALIDAD EXTRA del AnalisisService
        const diagnostico = data.diagnostico;
        const color = data.color_sugerido;

        // Actualizar los elementos HTML con datos REALES
        document.getElementById('live-value').innerText = value;
        
        const badge = document.getElementById('status-badge');
        badge.innerText = diagnostico;
        
        // Aplicamos el color que el Backend decidió (Funcionalidad Extra)
        badge.style.backgroundColor = color;
        badge.style.color = "white"; // Para que resalte sobre el color sugerido

        // Actualizar la gráfica con el dato de MariaDB
        chart.data.datasets[0].data.push(value);
        
        // Mantener solo los últimos 15 puntos para que la gráfica avance
        if (chart.data.datasets[0].data.length > 15) {
            chart.data.datasets[0].data.shift();
        }
        
        chart.update();

    } catch (error) {
        console.error("Error conectando con el Backend Java:", error);
        document.getElementById('status-badge').innerText = "Sin conexión al servidor";
    }
}

// 3. Consultar al Backend cada segundo
setInterval(updateChart, 1000);