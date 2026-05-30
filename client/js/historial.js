document.addEventListener('DOMContentLoaded', cargarHistorial);

async function cargarHistorial() {
    try {
        // 1. Obtenemos el token guardado
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No hay sesión activa. Falta el token.');
            // Opcional: podrías redirigir al login acá si no hay token
            // window.location.href = '/login.html';
            return;
        }

        // 2. Hacemos el fetch agregando los Headers con el Bearer Token
        const respuesta = await fetch('/historial', { // <-- Ojo: verificá si tu ruta es /historial o /api/historial
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        // 3. Verificamos que la respuesta no sea un error 404 HTML
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const movimientosAnteriores = await respuesta.json();

        const contenedor = document.getElementById('contenedor-historiales');
        const mensajeVacio = document.getElementById('mensaje-vacio');

        contenedor.innerHTML = '';

        // 4. Verificación de seguridad por si no es un array
        if (!Array.isArray(movimientosAnteriores) || movimientosAnteriores.length === 0) {
            if (mensajeVacio) mensajeVacio.style.display = 'block';
            return;
        }

        if (mensajeVacio) mensajeVacio.style.display = 'none';

        const mesesAgrupados = {};
        movimientosAnteriores.forEach(mov => {
            if (!mesesAgrupados[mov.mes_anio]) {
                mesesAgrupados[mov.mes_anio] = [];
            }
            mesesAgrupados[mov.mes_anio].push(mov);
        });

        for (const mes in mesesAgrupados) {
            const listaMovimientos = mesesAgrupados[mes];

            let ingresos = 0;
            let egresos = 0;
            let mudanza = 0;
            let ahorro = 0;

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
                <h3 style="color: var(--color-azul); border-bottom: 2px solid var(--bg-principal); padding-bottom: 8px; margin-bottom: 15px; text-transform: capitalize;">
                    📅 ${mes}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; font-size: 13px;">
                    <div><strong>Ingresos base:</strong> <span style="color: var(--color-verde); font-weight:bold;">$U ${ingresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div><strong>Gastos totales:</strong> <span style="color: var(--color-rojo); font-weight:bold;">$U ${egresos.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div><strong>Consolidado Mudanza:</strong> <span style="color: #10b981; font-weight:bold;">$U ${mudanza.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                    <div><strong>Consolidado Ahorro:</strong> <span style="color: #6366f1; font-weight:bold;">$U ${ahorro.toLocaleString('es-UY', {minimumFractionDigits: 2})}</span></div>
                </div>
                <details style="cursor: pointer; font-size: 13px; color: var(--texto-secundario);">
                    <summary style="font-weight: 600; color: var(--texto-principal);">Ver desglose de movimientos</summary>
                    <ul style="list-style: none; margin-top: 10px; padding-left: 0; display: flex; flex-direction: column; gap: 5px;">
                        ${listaMovimientos.map(mov => `
                            <li style="display: flex; justify-content: space-between; background: var(--bg-principal); padding: 8px; border-radius: 5px;">
                                <span><strong>${mov.descripcion}</strong> (${mov.categoria.toUpperCase()})</span>
                                <span style="font-weight: bold; color: ${mov.tipo === 'ingreso' ? 'var(--color-verde)' : 'var(--color-rojo)'}">
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
        console.error('Error al cargar historial de meses:', error);
        // Opcional: mostrar un mensaje en el HTML si hay error
        const contenedor = document.getElementById('contenedor-historiales');
        if(contenedor) contenedor.innerHTML = '<p style="color: red; text-align: center;">Error de conexión. Intente iniciar sesión nuevamente.</p>';
    }
}