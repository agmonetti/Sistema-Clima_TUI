import Proceso from '../../models/mongo/Proceso.js';

export async function obtenerProcesoPorId(id) {
    try {
        const proceso = await Proceso.findById(id);
        
        if (!proceso) {
            throw new Error('El proceso solicitado no existe en el catalogo');
        }
        
        return proceso;
    } catch (error) {
        throw new Error(`Error al buscar el proceso: ${error.message}`);
    }
}

export async function listarProcesos() {
    try {
        const procesos = await Proceso.find({}).lean();
        
        return procesos;
    } catch (error) {
        throw new Error(`Error al listar procesos: ${error.message}`);
    }
}