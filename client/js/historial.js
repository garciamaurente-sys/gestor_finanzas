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
                <h2 style="margin-bottom: 15px;">📅 ${mes}</h2>

                <div class="grid-historial-resumen">
                    <div class="item-resumen"><small>Ingresos</small><span style="color:var(--color-verde)">$U ${ingresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div class="item-resumen"><small>Gastos</small><span style="color:var(--color-rojo)">$U ${egresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div class="item-resumen"><small>Mudanza</small><span style="color:var(--color-azul)">$U ${mudanza.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div class="item-resumen"><small>Ahorro</small><span style="color:var(--color-azul)">$U ${ahorro.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                </div>

                <details class="details-historial">
                    <summary>Ver detalle de movimientos</summary>
                    <div id="lista-movimientos" style="margin-top: 15px;">
                        ${listaMovimientos.map(mov => `
                            <div class="item-movimiento ${mov.tipo}">
                                <div class="item-info">
                                    <span class="item-descripcion">${mov.descripcion}</span>
                                    <span class="item-meta">${mov.categoria.toUpperCase()}</span>
                                </div>
                                <span class="item-monto ${mov.tipo}">
                                    ${mov.tipo === 'ingreso' ? '+' : '-'} $U ${parseFloat(mov.monto).toLocaleString('es-UY')}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </details>
            `;
            contenedor.appendChild(bloqueMes);
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}