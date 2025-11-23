import mongoose, { Schema } from "mongoose";

const conversacionSchema = new Schema({
    nombre: { type: String, default: null }, 
    esGrupal: { type: Boolean, default: false },
    
    miembros: [{ type: Number, required: true }], 
    
    ultimaActualizacion: { type: Date, default: Date.now }
});

export default mongoose.model('Conversacion', conversacionSchema, 'conversaciones');
