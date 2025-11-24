// Nota: Si tu servicio exporta un objeto, usa { MensajeriaService }
// Si tu servicio exporta individualmente (como auth), usa * as MensajeriaService
import { MensajeriaService } from '../services/mensajeria.service.js'; 

export const iniciarPrivado = async (req, res) => {
    try {
        const { destinatarioId } = req.body;
        const chat = await MensajeriaService.iniciarChatPrivado(req.user.id, destinatarioId);
        res.json(chat);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const crearGrupo = async (req, res) => {
    try {
        const { participantesIds, nombre } = req.body;
        const grupo = await MensajeriaService.crearGrupo(req.user.id, participantesIds, nombre);
        res.json(grupo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const misChats = async (req, res) => {
    try {
        const chats = await MensajeriaService.listarChats(req.user.id);
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const enviar = async (req, res) => {
    try {
        const { texto } = req.body;
        const { id } = req.params;
        const msg = await MensajeriaService.enviarMensaje(id, req.user.id, texto);
        res.json(msg);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const historial = async (req, res) => {
    try {
        const msgs = await MensajeriaService.verHistorial(req.params.id);
        res.json(msgs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};