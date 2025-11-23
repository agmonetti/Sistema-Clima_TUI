
import * as UsuarioService from '../services/usuario.service.js';

export const UsuarioController = {
    async deleteUser(req, res){
    try {
        const { id } = req.params; // El ID viene en la URL: /usuarios/15

        await UsuarioService.borrarUsuario(id);

        res.status(200).json({ 
            message: 'Usuario eliminado correctamente' 
        });

    } catch (error) {
        res.status(404).json({ error: error.message });
    }
},


async getUsers(req, res) {
    try {
        const usuarios = await UsuarioService.obtenerTodos();
        res.status(200).json(usuarios);   
    
    } catch (error) {
        // Error interno del servidor
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios.' });
    }
},

async buscarPorId(req, res) {
        try {
            // El ID se extrae de la URL: /usuarios/id/:id
            const { id } = req.params; 
            const usuario = await UsuarioService.buscarPorId(id);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Devolvemos solo la información pública (sin contraseña)
            const { contraseña, ...usuarioPublico } = usuario; 
            res.json(usuarioPublico);

        } catch (error) {
            console.error("Error al buscar usuario por ID:", error);
            res.status(500).json({ error: error.message });
        }
    }
};