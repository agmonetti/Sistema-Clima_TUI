class SessionManager {
    constructor() {
        this.usuario = null;
    }

    login(usuario) {
        this.usuario = {
            id: usuario.usuario_id || usuario.id,
            nombre: usuario.nombre,
            mail: usuario.mail,
            rol: usuario.rol,
            saldoActual: usuario.saldoActual || 0
        };
    }

    logout() {
        this.usuario = null;
    }

    estaLogueado() {
        return this.usuario !== null;
    }

    getUser() {
        return this.usuario;
    }

    getUserId() {
        return this.usuario?.id || null;
    }


    getRol() {
        return this.usuario?.rol || null;
    }

    hasRole(roles) {
        if (!this.usuario) return false;
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        return rolesArray.includes(this.usuario.rol);
    }

    actualizarSaldo(nuevoSaldo) {
        if (this.usuario) {
            this.usuario.saldoActual = nuevoSaldo;
        }
    }
}
//patron singleton
export const session = new SessionManager();
