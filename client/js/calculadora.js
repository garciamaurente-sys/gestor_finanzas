document.addEventListener('DOMContentLoaded', () => {
    calcularSueldoReal();

    document.getElementById('btn-simular').addEventListener('click', simularDistribucion);
});

async function calcularSueldoReal() {
    try {
        const respuesta = await fetch('/dashboard');
        const movimientos = await respuesta.json();

        let totalSueldos = 0;
        movimientos.forEach(mov => {
            if (mov.categoria === 'sueldos' || (mov.tipo === 'ingreso' && mov.categoria !== 'mudanza' && mov.categoria !== 'ahorro_personal')) {
                totalSueldos += parseFloat(mov.monto);
            }
        });

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

