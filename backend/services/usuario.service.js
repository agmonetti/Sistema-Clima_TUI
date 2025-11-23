import * as UsuarioRepository from '../repositories/postgres/usuario.repository.js';

export async function borrarUsuario(id) {
    const fueBorrado = await UsuarioRepository.eliminarUsuario(id);
    
    if (!fueBorrado) {
        throw new Error('El usuario no existe o ya fue eliminado');
    }
    
    return true; // Éxito
}


export async function obtenerTodos() {
    const usuarios = await UsuarioRepository.obtenerTodos();
    return usuarios;
}

