const form = document.getElementById('formulario-movimientos');
const cerrarMesBtn = document.getElementById('btn-cerrar-mes');
const listaUL = document.getElementById('lista-movimientos');

// --- 1. GUARDIA DE SEGURIDAD AL CARGAR ---
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-UY');
}

// --- FUNCIONES DE AYUDA ---
// Esta función revisa si el token expiró (si el servidor devuelve 401 o 403)
function manejarErrorAuth(respuesta) {
    if (respuesta.status === 401 || respuesta.status === 403) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

async function cargarDashboard() {
    try {
        const respuesta = await fetch('/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (manejarErrorAuth(respuesta)) return;

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
    const body = {
        monto: document.getElementById('monto').value,
        tipo: document.getElementById('tipo').value,
        categoria: document.getElementById('categoria').value,
        descripcion: document.getElementById('descripcion').value,
        frecuencia: document.getElementById('frecuencia').value
    };

    try {
        const respuesta = await fetch('/movimientos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (manejarErrorAuth(respuesta)) return;

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
    const confirmar = confirm(`¿Estás seguro de cerrar el mes de ${mesAnioActual}?`);

    if (!confirmar) return;

    try {
        const respuesta = await fetch('/dashboard/cerrar-mes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mes_anio: mesAnioActual })
        });

        if (manejarErrorAuth(respuesta)) return;

        if (respuesta.ok) {
            alert('Mes cerrado con éxito.');
            cargarDashboard();
        } else {
            alert(`No se pudo cerrar.`);
        }
    } catch (error) {
        console.error('Error al cerrar mes:', error);
    }
}

window.eliminarMovimiento = async function(id) {
    const confirmar = confirm('¿Borrar este registro?');
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`/movimientos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (manejarErrorAuth(respuesta)) return;

        if (respuesta.ok) {
            cargarDashboard();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();

    if (form) form.addEventListener('submit', guardarMovimiento);
    if (cerrarMesBtn) cerrarMesBtn.addEventListener('click', cerrarMes);

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
});