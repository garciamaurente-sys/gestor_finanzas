document.addEventListener('DOMContentLoaded', () => {
    calcularSueldoReal();

    document.getElementById('btn-simular').addEventListener('click', simularDistribucion);
});

async function calcularSueldoReal() {
    try {
        // 1. Obtenemos el token guardado en el navegador
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No hay sesión activa. Falta el token.');
            return;
        }

        // 2. Le pasamos el token en los headers de la petición
        const respuesta = await fetch('/dashboard', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        // 3. Verificamos que la respuesta del servidor sea exitosa (código 200)
        if (!respuesta.ok) {
            throw new Error(`Error en la petición: ${respuesta.status}`);
        }

        const movimientos = await respuesta.json();

        let totalSueldos = 0;

        // 4. Nos aseguramos de que lo que llegó sea realmente un Array antes de hacer forEach
        if (Array.isArray(movimientos)) {
            movimientos.forEach(mov => {
                if (mov.categoria === 'sueldos' || (mov.tipo === 'ingreso' && mov.categoria !== 'mudanza' && mov.categoria !== 'ahorro_personal')) {
                    totalSueldos += parseFloat(mov.monto);
                }
            });
        }

        document.getElementById('sueldo-real-monto').innerText = `$U ${totalSueldos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;

        renderizarTarjetas(totalSueldos, 'distribucion-real');

    } catch (error) {
        console.error('Error al calcular sueldo real:', error);
    }
}

function simularDistribucion() {
    const monto = parseFloat(document.getElementById('monto-simulado').value);
    if (!monto || monto <= 0) {
        alert("Por favor, ingresá un monto válido para simular.");
        return;
    }
    renderizarTarjetas(monto, 'distribucion-simulada');
}

function renderizarTarjetas(montoTotal, contenedorId) {
    const contenedor = document.getElementById(contenedorId);

    const necesidades = montoTotal * 0.50;
    const gustos = montoTotal * 0.30;
    const mudanza = montoTotal * 0.10;
    const ahorro = montoTotal * 0.10;

    contenedor.innerHTML = `
        <div class="tarjeta" style="border-top: 4px solid #3b82f6;">
            <h3>🏠 Necesidades (50%)</h3>
            <p>$U ${necesidades.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</p>
            <small style="color: var(--texto-secundario);">Alquiler, comida, cuentas</small>
        </div>
        <div class="tarjeta" style="border-top: 4px solid #f59e0b;">
            <h3>🎉 Gustos/Deseos (30%)</h3>
            <p>$U ${gustos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</p>
            <small style="color: var(--texto-secundario);">Salidas, ropa, juegos</small>
        </div>
        <div class="tarjeta" style="border-top: 4px solid #10b981;">
            <h3>🧳 Fondo Mudanza (10%)</h3>
            <p>$U ${mudanza.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</p>
            <small style="color: var(--texto-secundario);">Destinado al apartamento</small>
        </div>
        <div class="tarjeta" style="border-top: 4px solid #6366f1;">
            <h3>💰 Ahorro Personal (10%)</h3>
            <p>$U ${ahorro.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</p>
            <small style="color: var(--texto-secundario);">Fondo de reserva propio</small>
        </div>
    `;
}