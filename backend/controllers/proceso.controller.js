import * as ProcesoRepository from '../repositories/mongo/proceso.repository.js';

export const listarCatalogo = async (req, res) => {
    try {
        const procesos = await ProcesoRepository.listarProcesos();
        res.json(procesos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
