document.addEventListener('DOMContentLoaded', cargarHistorial);

async function cargarHistorial() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

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
            bloqueMes.className = 'card-historial';

            bloqueMes.innerHTML = `
                <h3 style="font-size: 16px; margin-bottom: 5px;">📅 ${mes}</h3>

                <div class="grid-historial">
                    <div class="item-resumen-historial"><small>Ingreso</small><span style="color:var(--color-verde)">$U ${ingresos.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Gastos</small><span style="color:var(--color-rojo)">$U ${egresos.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Mudanza</small><span style="color:var(--color-azul)">$U ${mudanza.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Ahorro</small><span style="color:var(--color-azul)">$U ${ahorro.toLocaleString('es-UY')}</span></div>
                </div>

                <details class="historial-details">
                    <summary>Ver detalle de movimientos</summary>
                    <ul style="list-style: none;">
                        ${listaMovimientos.map(mov => `
                            <li class="historial-item">
                                <span>${mov.descripcion}</span>
                                <span style="font-weight: 600;">$U ${parseFloat(mov.monto).toLocaleString('es-UY')}</span>
                            </li>
                        `).join('')}
                    </ul>
                </details>
            `;
            contenedor.appendChild(bloqueMes);
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}