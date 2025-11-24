import mongoose, { Schema } from "mongoose";

const ProcesoSchema = new Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    costo: { type: Number, required: true },
    
    codigo: {type: String, required: true,unique: true,
        enum: [
            'INFORME_MAXIMAS_MINIMAS', 
            'INFORME_PROMEDIOS', 
            'BUSCAR_ALERTAS', 
            'CONSULTAR_DATOS', 
            'ANALISIS_DESVIACION',
            'CHECK_SALUD'
        ]
    }
});

export default mongoose.model('Proceso', ProcesoSchema, 'proceso');