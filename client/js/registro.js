// Esperamos a que el DOM cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Obtenemos los valores de los inputs
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Enviamos los datos al backend
                const respuesta = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });

                const datos = await respuesta.json();

                // Verificamos la respuesta
                if (respuesta.ok) {
                    alert('¡Usuario registrado con éxito!');
                    window.location.href = 'login.html'; // Redirigimos al Login
                } else {
                    // Si el servidor envía un error (ej: email duplicado)
                    alert('Error: ' + (datos.error || 'No se pudo realizar el registro'));
                }
            } catch (error) {
                // Si hay un error de red o el servidor está caído
                console.error('Error de conexión:', error);
                alert('Hubo un problema de conexión con el servidor. Intentá más tarde.');
            }
        });
    }
});