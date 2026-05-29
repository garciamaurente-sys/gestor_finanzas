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
                    // Alerta de éxito con SweetAlert2
                    Swal.fire({
                        icon: 'success',
                        title: '¡Registro exitoso!',
                        text: 'Ya podés iniciar sesión con tu nueva cuenta.',
                        confirmButtonText: 'Ir a Login',
                        confirmButtonColor: '#6366f1'
                    }).then(() => {
                        window.location.href = 'login.html';
                    });
                } else {
                    // Alerta de error (por ejemplo: email duplicado)
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: datos.error || 'No se pudo realizar el registro.',
                        confirmButtonColor: '#6366f1'
                    });
                }
            } catch (error) {
                // Error de red
                console.error('Error de conexión:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'Hubo un problema al conectar con el servidor. Intentá más tarde.',
                    confirmButtonColor: '#6366f1'
                });
            }
        });
    }
});