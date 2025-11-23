// La lógica aquí debe ser agnóstica a la estructura de la página (no debe haber vista-login, etc.)
const logic = {
    
    // --- LÓGICA DE ADMIN: GESTIÓN DE USUARIOS ---

    async cargarUsuarios() {
        // Esta función sólo se llama desde admin.html, el contenedor existe
        const contenedor = document.getElementById('tabla-usuarios-container');
        contenedor.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div> Cargando...</div>';

        try {
            const res = await api.get('/usuarios'); 
            
            // Si hay un error 403 o 500, el servidor ya envió el error.
            if (res.error) throw new Error(res.error); 
            
            // ... (código para construir la tabla de usuarios con botones eliminar/contactar)
            
            let html = `
                <table class="table table-hover table-sm">
                    <thead>
                        <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
            `;

            res.forEach(u => {
                html += `
                    <tr>
                        <td>${u.usuario_id}</td>
                        <td>${u.nombre}</td>
                        <td>${u.mail}</td>
                        <td>${u.rol}</td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="logic.contactarUsuario(${u.usuario_id})">💬</button>
                            <button class="btn btn-danger btn-sm" 
                                onclick="logic.eliminarUsuario(${u.usuario_id})"
                                ${u.rol === 'admin' ? 'disabled' : ''}>
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            contenedor.innerHTML = html;

        } catch (error) {
            contenedor.innerHTML = `<div class="alert alert-danger p-2">Error: ${error.message}</div>`;
        }
    },

    async eliminarUsuario(id) {
        if (!confirm(`¿Seguro que deseas eliminar al usuario ID ${id}?`)) return;
        
        try {
            await api.delete(`/usuarios/${id}`);
            alert('Usuario eliminado correctamente');
            this.cargarUsuarios(); // Recargar tabla
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    },

    // --- LÓGICA DE CLIENTE: BILLETERA (SALDO) ---

    async obtenerSaldo() {
        // Obtener el saldo desde el backend
        const display = document.getElementById('display-saldo');
        const navSaldo = document.getElementById('nav-saldo');

        // Mostramos cargando para UX
        display.textContent = '...';
        navSaldo.textContent = 'Cargando...';

        try {
            // Asumiendo que /transaccion/saldo devuelve { saldo: 123.45 }
            const res = await api.get('/transaccion/saldo'); 
            
            if (res.saldo !== undefined) {
                const saldoFormato = parseFloat(res.saldo).toFixed(2);
                display.textContent = `$${saldoFormato}`;
                navSaldo.textContent = `Saldo: $${saldoFormato}`;
            } else {
                 display.textContent = `Error`;
            }
        } catch (error) {
            display.textContent = '$0.00 (Fallo)';
            navSaldo.textContent = 'Saldo: Error';
            console.error("Fallo al obtener saldo:", error);
            // Aquí hay un error, el backend no tiene la ruta /transaccion/saldo lista.
        }
    },

    async recargarSaldo(e) {
        // Función de recarga de saldo que implementaremos en la siguiente feature
        e.preventDefault();
        alert("Funcionalidad de recarga no implementada aún en el backend. ¡Vamos a codearla!");
    },
    
    // --- LÓGICA DE MENSAJERÍA (Se llama desde chat.js, la dejamos en el mismo archivo) ---
    async contactarUsuario(usuarioId) {
        alert("Iniciando chat con usuario: " + usuarioId);
        // Aquí se llamaría a chatWidget.iniciarChat, pero eso está en otro script.
        // Por ahora, solo alertamos.
    },
};