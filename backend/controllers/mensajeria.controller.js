import { MensajeriaService } from '../services/mensajeria.service.js';

export const MensajeriaController = {
    // POST /api/mensajeria/privado
    async iniciarPrivado(req, res) {
        try {
            const { destinatarioId } = req.body;
            const chat = await MensajeriaService.iniciarChatPrivado(req.user.id, destinatarioId);
            res.json(chat);
        } catch (error) {
            // ------------------------------------
            res.status(400).json({ error: error.message });
        }
    },

    // GET /api/mensajeria
    async misChats(req, res) {
        try {
            const chats = await MensajeriaService.listarChats(req.user.id);
            res.json(chats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/mensajeria/:id/enviar
    async enviar(req, res) {
        try {
            const { texto } = req.body;
            const { id } = req.params; // ID conversación
            const msg = await MensajeriaService.enviarMensaje(id, req.user.id, texto);
            res.json(msg);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // GET /api/mensajeria/:id/mensajes
    async historial(req, res) {
        try {
            const msgs = await MensajeriaService.verHistorial(req.params.id);
            res.json(msgs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


};