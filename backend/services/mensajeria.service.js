import { MensajeriaRepository } from '../repositories/mongo/mensajeria.repository.js';

export const MensajeriaService = {
    async iniciarChatPrivado(miId, otroId) {
    
        if (miId == otroId) throw new Error("No puedes hablar solo"); // (Aquí falla con 400)
        // 1. Verificar si ya existe
        const existente = await MensajeriaRepository.buscarPrivada(miId, otroId);
        if (existente) return existente;


        // 2. Si no, crear
        return await MensajeriaRepository.crearConversacion([miId, otroId], null, false);
    },

    async enviarMensaje(conversacionId, emisorId, texto) {
        if (!texto) throw new Error("Mensaje vacío");
    
        return await MensajeriaRepository.guardarMensaje({
            conversacion_id: conversacionId,
            emisor_id: emisorId,
            texto: texto
        });
    },

    async listarChats(usuarioId) {
        return await MensajeriaRepository.obtenerMisConversaciones(usuarioId);
    },

    async verHistorial(conversacionId) {
        return await MensajeriaRepository.obtenerMensajes(conversacionId);
    }
};