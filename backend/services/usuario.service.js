import * as UsuarioRepository from '../repositories/postgres/usuario.repository.js';

export async function borrarUsuario(id) {
    const usuario = await UsuarioRepository.buscarPorId(id);
    
    if (!usuario) {
        throw new Error('El usuario no existe');
    }

    if (usuario.rol === 'admin') {
        throw new Error('ERROR: No se puede eliminar a un admin.');
    }

    const fueBorrado = await UsuarioRepository.eliminarUsuario(id);
    
    if (!fueBorrado) {
        throw new Error('No se pudo eliminar el usuario.');
    }
    
    return true;
};
export async function eliminarPropiaCuenta(id) {

        const fueBorrado = await UsuarioRepository.eliminarUsuario(id);
        
        if (!fueBorrado) {
            throw new Error('No se pudo eliminar la cuenta. Tal vez ya no existe.');
        }
        
        return true;
    }


export async function obtenerTodos() {
    return await UsuarioRepository.obtenerTodos();
}

export async function buscarPorId(id) {
    return await UsuarioRepository.buscarPorId(id);
}
export async function revivirUsuario(id) {
    const revivido = await UsuarioRepository.revivirUsuario(id);
    
    if (!revivido) {
        throw new Error('No se pudo revivir el usuario.');
    }
    
    return true;
}
