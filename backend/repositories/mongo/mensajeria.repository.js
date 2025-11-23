import Conversacion from '../../models/mongo/Conversacion.js';
import Mensaje from '../../models/mongo/Mensaje.js';

export const MensajeriaRepository = {
    // crear grupo
    async crearConversacion(miembros, nombre = null, esGrupal = false) {
        const nueva = new Conversacion({ miembros, nombre, esGrupal });
        return await nueva.save();
    },

    async buscarPrivada(id1, id2) {
        return await Conversacion.findOne({
            esGrupal: false,
            miembros: { $all: [id1, id2], $size: 2 }
        });
    },

    async obtenerMisConversaciones(usuarioId) {
        return await Conversacion.find({ miembros: usuarioId })
            .sort({ ultimaActualizacion: -1 });
    },

    async guardarMensaje(datos) {
        const msg = new Mensaje(datos);
        const guardado = await msg.save();
        
        await Conversacion.findByIdAndUpdate(datos.conversacion_id, {
            ultimaActualizacion: new Date()
        });
        
        return guardado;
    },
    async obtenerMensajes(conversacionId) {
        return await Mensaje.find({ conversacion_id: conversacionId })
            .sort({ timestamp: 1 }); 
    }
};