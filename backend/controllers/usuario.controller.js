import * as UsuarioService from '../services/usuario.service.js';

// Exportación individual (igual que auth.controller.js)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await UsuarioService.borrarUsuario(id);
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const usuarios = await UsuarioService.obtenerTodos();
        res.status(200).json(usuarios);   
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios.' });
    }
};

export const buscarPorId = async (req, res) => {
    try {
        const { id } = req.params; 
        // Nota: Aquí asumimos que UsuarioService tiene buscarPorId (lo arreglamos en pasos anteriores)
        const usuario = await UsuarioService.buscarPorId(id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const { contraseña, ...usuarioPublico } = usuario; 
        res.json(usuarioPublico);
    } catch (error) {
        console.error("Error al buscar usuario por ID:", error);
        res.status(500).json({ error: error.message });
    }
};

export const revivirUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        await UsuarioService.revivirUsuario(id);
        res.status(200).json({ message: 'Usuario revivido correctamente' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// ... (tus otras funciones) ...

export const darseDeBaja = async (req, res) => {
    try {
        const miId = req.user.id; 
        await UsuarioService.eliminarPropiaCuenta(miId);

        res.status(200).json({ message: 'Cuenta eliminada correctamente' });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

