document.addEventListener('DOMContentLoaded', cargarHistorial);

async function cargarHistorial() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Ahora apunta a /api/historial
        const respuesta = await fetch('/api/historial', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const movimientosAnteriores = await respuesta.json();
        const contenedor = document.getElementById('contenedor-historiales');
        const mensajeVacio = document.getElementById('mensaje-vacio');

        contenedor.innerHTML = '';

        if (!Array.isArray(movimientosAnteriores) || movimientosAnteriores.length === 0) {
            if (mensajeVacio) mensajeVacio.style.display = 'block';
            return;
        }

        if (mensajeVacio) mensajeVacio.style.display = 'none';

        const mesesAgrupados = {};
        movimientosAnteriores.forEach(mov => {
            if (!mesesAgrupados[mov.mes_anio]) mesesAgrupados[mov.mes_anio] = [];
            mesesAgrupados[mov.mes_anio].push(mov);
        });

        for (const mes in mesesAgrupados) {
            const listaMovimientos = mesesAgrupados[mes];
            let ingresos = 0, egresos = 0, mudanza = 0, ahorro = 0;

            listaMovimientos.forEach(mov => {
                const monto = parseFloat(mov.monto);
                if (mov.categoria === 'mudanza') mudanza += monto;
                else if (mov.categoria === 'ahorro_personal') ahorro += monto;
                else if (mov.tipo === 'ingreso' || mov.categoria === 'sueldos') ingresos += monto;
                else if (mov.tipo === 'egreso') egresos += monto;
            });

            const bloqueMes = document.createElement('div');
            bloqueMes.className = 'tarjeta-mes';
            bloqueMes.style.cssText = "background: var(--bg-tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 20px; margin-bottom: 20px;";

            bloqueMes.innerHTML = `
                <h3 style="color: var(--color-azul); border-bottom: 2px solid var(--bg-principal); padding-bottom: 8px; margin-bottom: 15px; text-transform: capitalize;">📅 ${mes}</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; font-size: 13px;">
                    <div><strong>Ingresos:</strong> $U ${ingresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</div>
                    <div><strong>Gastos:</strong> $U ${egresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</div>
                </div>
                <details style="cursor: pointer; font-size: 13px; color: var(--texto-secundario);">
                    <summary>Ver movimientos</summary>
                    <ul style="list-style: none; padding-left: 0; margin-top: 10px;">
                        ${listaMovimientos.map(mov => `
                            <li style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #eee;">
                                <span>${mov.descripcion}</span>
                                <span>$U ${parseFloat(mov.monto).toLocaleString('es-UY')}</span>
                            </li>
                        `).join('')}
                    </ul>
                </details>
            `;
            contenedor.appendChild(bloqueMes);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}