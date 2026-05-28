const form = document.getElementById('formulario-movimientos');
const cerrarMesBtn = document.getElementById('btn-cerrar-mes');
const listaUL = document.getElementById('lista-movimientos');

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-UY');
}

async function cargarDashboard() {
    try {
        const respuesta = await fetch('/dashboard');
        const movimientos = await respuesta.json();

        let dineroDisponible = 0;
        let gastosMes = 0;
        let fondoMudanza = 0;
        let ahorroPersonal = 0;

        listaUL.innerHTML = '';

        movimientos.forEach((mov) => {
            const montoNum = parseFloat(mov.monto);

            if (mov.categoria === 'mudanza') {
                fondoMudanza += montoNum;
            } else if (mov.categoria === 'ahorro_personal') {
                ahorroPersonal += montoNum;
            } else if (mov.tipo === 'ingreso' || mov.categoria === 'sueldos') {
                dineroDisponible += montoNum;
            } else if (mov.tipo === 'egreso') {
                gastosMes += montoNum;
            }

            const li = document.createElement('li');
            li.className = `item-movimiento ${mov.tipo}`;
            const catTexto = mov.categoria.replace('_', ' ').toUpperCase();

            li.innerHTML = `
                <div class="item-info">
                    <span class="item-descripcion">${mov.descripcion}</span>
                    <span class="item-meta">${catTexto} - ${formatearFecha(mov.fecha)}</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="item-monto ${mov.tipo}">
                        ${mov.tipo === 'ingreso' ? '+' : '-'} $U ${montoNum.toLocaleString('es-UY')}
                    </div>
                    <button onclick="eliminarMovimiento(${mov.id})" style="background: var(--color-rojo); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">❌</button>
                </div>
            `;

            listaUL.appendChild(li);
        });

        dineroDisponible = dineroDisponible - gastosMes - fondoMudanza - ahorroPersonal;

        document.getElementById('total-ingresos').innerText = `$U ${dineroDisponible.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;
        document.getElementById('total-egresos').innerText = `$U ${gastosMes.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;
        document.getElementById('total-mudanza').innerText = `$U ${fondoMudanza.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;
        document.getElementById('total-ahorro').innerText = `$U ${ahorroPersonal.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
    }
}

async function guardarMovimiento(e) {
    e.preventDefault();

    const monto = document.getElementById('monto').value;
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const frecuencia = document.getElementById('frecuencia').value;
    const descripcion = document.getElementById('descripcion').value;

    try {
        const respuesta = await fetch('/movimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto, tipo, categoria, descripcion, frecuencia })
        });

        if (respuesta.ok) {
            form.reset();
            cargarDashboard();
        } else {
            alert('Error al guardar.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cerrarMes() {
    const opciones = { month: 'long', year: 'numeric' };
    const mesAnioActual = new Date().toLocaleDateString('es-UY', opciones);
    const confirmar = confirm(`¿Estás seguro de cerrar el mes de ${mesAnioActual}?
Esto archivará todo en el Historial y dejará el panel en $0.`);

    if (!confirmar) return;

    try {
        const respuesta = await fetch('/dashboard/cerrar-mes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mes_anio: mesAnioActual })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('Mes cerrado con éxito.');
            cargarDashboard();
        } else {
            alert(`No se pudo cerrar: ${resultado.error}`);
        }
    } catch (error) {
        console.error('Error al cerrar mes:', error);
        alert('Hubo un error de conexión.');
    }
}

window.eliminarMovimiento = async function(id) {
    const confirmar = confirm('¿Borrar este registro?');
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`/movimientos/${id}`, { method: 'DELETE' });
        if (respuesta.ok) {
            cargarDashboard();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();

    if (form) {
        form.addEventListener('submit', guardarMovimiento);
    }

    if (cerrarMesBtn) {
        cerrarMesBtn.addEventListener('click', cerrarMes);
    }
});