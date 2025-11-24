// CAMBIO CLAVE: Importamos todo el módulo con un alias
import * as MensajeriaRepository from '../repositories/mongo/mensajeria.repository.js';
import * as UsuarioService from './usuario.service.js';

export const MensajeriaService = {
    async iniciarChatPrivado(miId, otroId) {
        if (miId == otroId) throw new Error("No puedes hablar solo");

        // 1. Verificar si ya existe
        const existente = await MensajeriaRepository.buscarPrivada(miId, otroId);
        if (existente) return existente;

        // 2. Si no, crear
        return await MensajeriaRepository.crearConversacion([miId, otroId], null, false);
    },

    async crearGrupo(creadorId, participantesIds, nombreGrupo) {
        // Validar que haya al menos 2 participantes adicionales (total 3+ con el creador)
        if (!participantesIds || participantesIds.length < 2) {
            throw new Error("Un grupo debe tener al menos 3 participantes");
        }

        // Remover duplicados y asegurar que el creador esté incluido
        const miembrosUnicos = [...new Set([creadorId, ...participantesIds])];
        
        if (miembrosUnicos.length < 3) {
            throw new Error("Un grupo debe tener al menos 3 participantes diferentes");
        }

        // Validar nombre del grupo
        if (!nombreGrupo || nombreGrupo.trim() === '') {
            throw new Error("El grupo debe tener un nombre");
        }

        // Validar que todos los participantes existan en la base de datos
        for (const participanteId of miembrosUnicos) {
            const usuario = await UsuarioService.buscarPorId(participanteId);
            if (!usuario) {
                throw new Error(`El usuario con ID ${participanteId} no existe`);
            }
        }

        return await MensajeriaRepository.crearConversacion(miembrosUnicos, nombreGrupo.trim(), true);
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