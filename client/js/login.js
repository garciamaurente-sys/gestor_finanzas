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
                    localStorage.setItem('token', data.token);

                    // Solo SweetAlert, nada de alert() nativo
                    Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Iniciando sesión...',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = '/';
                    });

                } else {
                    // Aquí mostramos el mensaje que viene del backend
                    Swal.fire({
                        icon: 'error',
                        title: 'Acceso denegado',
                        text: data.error || 'Correo o contraseña incorrectos.',
                        confirmButtonColor: '#6366f1'
                    });
                }
            } catch (error) {
                console.error("Error al conectar:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error de conexión. Intentá más tarde.',
                    confirmButtonColor: '#6366f1'
                });
            }
        });
    }
});