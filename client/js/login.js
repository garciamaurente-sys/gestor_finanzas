document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardamos el token
                    localStorage.setItem('token', data.token);

                    // Alerta bonita de éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Iniciando sesión...',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = '/'; // Redirigimos al inicio/dashboard
                    });
                } else {
                    // Alerta bonita de error
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Credenciales incorrectas.',
                        confirmButtonColor: '#6366f1'
                    });
                }
            } catch (error) {
                console.error("Error al conectar con el servidor:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'Hubo un problema. Intentá más tarde.',
                    confirmButtonColor: '#6366f1'
                });
            }
        });
    }
});