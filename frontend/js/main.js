document.addEventListener('DOMContentLoaded', () => {
    
    // 1. VERIFICACIÓN AUTOMÁTICA AL ENTRAR AL LOGIN
    // Si ya estoy logueado, no debería ver el login, debería ir a mi panel.
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');

    if (token && usuarioStr) {
        try {
            const usuario = JSON.parse(usuarioStr);
            // Usamos la función de redirección que SÍ existe en el nuevo auth.js
            auth.redirigirPorRol(usuario.rol);
        } catch (e) {
            console.error("Error al leer usuario", e);
            auth.logout(); // Si hay error, limpiamos todo
        }
    }

    // ==========================================
    // NAVEGACIÓN VISUAL (LOGIN <-> REGISTRO)
    // ==========================================
    const btnIrRegistro = document.getElementById('btn-ir-registro');
    if(btnIrRegistro) {
        btnIrRegistro.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('vista-login').classList.add('d-none');
            document.getElementById('vista-registro').classList.remove('d-none');
        });
    }

    const btnIrLogin = document.getElementById('btn-ir-login');
    if(btnIrLogin) {
        btnIrLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('vista-registro').classList.add('d-none');
            document.getElementById('vista-login').classList.remove('d-none');
        });
    }

    // ==========================================
    // LÓGICA DEL FORMULARIO DE REGISTRO
    // ==========================================
    const registerForm = document.getElementById('form-registro');
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('reg-nombre').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;
            
            const errorDiv = document.getElementById('error-registro');
            const exitoDiv = document.getElementById('exito-registro');

            errorDiv.classList.add('d-none');
            exitoDiv.classList.add('d-none');

            try {
                await auth.register(nombre, email, pass);
                
                exitoDiv.textContent = "¡Cuenta creada con éxito! Redirigiendo al login...";
                exitoDiv.classList.remove('d-none');
                registerForm.reset();

                setTimeout(() => {
                    document.getElementById('vista-registro').classList.add('d-none');
                    document.getElementById('vista-login').classList.remove('d-none');
                    exitoDiv.classList.add('d-none'); 
                }, 1500);

            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('d-none');
            }
        });
    }

    // ==========================================
    // LÓGICA DEL FORMULARIO DE LOGIN
    // ==========================================
    const loginForm = document.getElementById('form-login');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-login');
            
            errorDiv.classList.add('d-none');

            try {
                // auth.login ya se encarga de redirigir si tiene éxito
                await auth.login(email, pass);
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('d-none');
            }
        });
    }
});