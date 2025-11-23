const auth = {
    // --- LOGIN ---
    async login(email, password) {
        const res = await api.post('/auth/login', { mail: email, password });
        
        if (res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('usuario', JSON.stringify(res.user));
            this.redirigirPorRol(res.user.rol);
            return true;
        } else {
            throw new Error(res.error || 'Credenciales inválidas');
        }
    },

    // --- REGISTRO ---
    async register(nombre, email, password) {
        const res = await api.post('/auth/register', { nombre, mail: email, password });
        if (res.data || res.message) return true;
        throw new Error(res.error || 'Error al registrarse');
    },

    // --- LOGOUT ---
    logout() {
        localStorage.clear();
        window.location.href = 'index.html';
    },

    // --- PROTECCIÓN DE RUTAS ---
    verificarAcceso(rolRequerido) {
        const token = localStorage.getItem('token');
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

        if (!token || !usuario.rol) {
            window.location.href = 'index.html';
            return;
        }

        // Si el rol no coincide, lo mandamos a su lugar
        if (rolRequerido && usuario.rol !== rolRequerido) {
            alert("Acceso no autorizado. Redirigiendo a tu panel.");
            this.redirigirPorRol(usuario.rol);
        }

        // Pintar nombre en el Navbar (si existe el elemento)
        const navUser = document.getElementById('nav-usuario');
        if(navUser) navUser.textContent = `${usuario.nombre} (${usuario.rol})`;
    },

    redirigirPorRol(rol) {
        if (rol === 'admin') window.location.href = 'admin.html';
        else if (rol === 'tecnico') window.location.href = 'tecnico.html';
        else window.location.href = 'cliente.html';
    }
};