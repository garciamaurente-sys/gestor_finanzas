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

            // Creamos el contenedor del mes usando tus clases existentes
            const bloqueMes = document.createElement('div');
            bloqueMes.className = 'seccion-lista'; // Clase para fondo blanco y sombras
            bloqueMes.style.marginBottom = "20px";

            bloqueMes.innerHTML = `
                <h2>📅 ${mes}</h2>

                <div class="dashboard" style="margin-bottom: 20px;">
                    <div class="tarjeta">
                        <h3>Ingresos</h3>
                        <p style="color: var(--color-verde);">$U ${ingresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="tarjeta alerta">
                        <h3>Gastos</h3>
                        <p style="color: var(--color-rojo);">$U ${egresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="tarjeta">
                        <h3>Mudanza</h3>
                        <p style="color: var(--color-azul);">$U ${mudanza.toLocaleString('es-UY', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="tarjeta">
                        <h3>Ahorro</h3>
                        <p style="color: var(--color-azul);">$U ${ahorro.toLocaleString('es-UY', {minimumFractionDigits: 2})}</p>
                    </div>
                </div>

                <details style="cursor: pointer; color: var(--texto-secundario);">
                    <summary>Ver desglose de movimientos</summary>
                    <ul id="lista-movimientos" style="margin-top: 15px;">
                        ${listaMovimientos.map(mov => `
                            <li class="item-movimiento ${mov.tipo}">
                                <div class="item-info">
                                    <span class="item-descripcion">${mov.descripcion}</span>
                                    <span class="item-meta">${mov.categoria.toUpperCase()}</span>
                                </div>
                                <span class="item-monto ${mov.tipo}">
                                    ${mov.tipo === 'ingreso' ? '+' : '-'} $U ${parseFloat(mov.monto).toLocaleString('es-UY')}
                                </span>
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