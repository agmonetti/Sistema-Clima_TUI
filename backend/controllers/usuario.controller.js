import * as UsuarioService from '../services/usuario.service.js';

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // El ID viene en la URL: /usuarios/15

        await UsuarioService.borrarUsuario(id);

        res.status(200).json({ 
            message: 'Usuario eliminado correctamente' 
        });

    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const usuarios = await UsuarioService.obtenerTodos();
        res.status(200).json(usuarios);   
    
    } catch (error) {
        // Error interno del servidor
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios.' });
    }
};