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
                <h3 style="font-size: 15px; margin-bottom: 5px;">📅 ${mes}</h3>

                <div class="grid-historial">
                    <div class="item-resumen-historial"><small>Ingreso</small><span style="color:var(--color-verde)">$U ${ingresos.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Gastos</small><span style="color:var(--color-rojo)">$U ${egresos.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Mudanza</small><span style="color:var(--color-azul)">$U ${mudanza.toLocaleString('es-UY')}</span></div>
                    <div class="item-resumen-historial"><small>Ahorro</small><span style="color:var(--color-azul)">$U ${ahorro.toLocaleString('es-UY')}</span></div>
                </div>

                <details style="cursor: pointer; font-size: 11px; color: var(--texto-secundario);">
                    <summary>Ver detalle</summary>
                    <ul style="list-style: none; margin-top: 5px;">
                        ${listaMovimientos.map(mov => `
                            <li style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 2px 0;">
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
        console.error('Error al cargar historial:', error);
    }
}