import mongoose, { Schema } from "mongoose";

const mensajeSchema = new Schema({
    conversacion_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Conversacion', 
        required: true 
    },
    
    emisor_id: { type: Number, required: true },
    
    texto: { type: String, required: true },
    
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Mensaje', mensajeSchema, 'mensajes');