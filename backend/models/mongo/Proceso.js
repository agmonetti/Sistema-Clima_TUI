import mongoose, { Schema } from "mongoose";

const ProcesoSchema = new Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    costo: { type: Number, required: true },

    complejidad:{
        type: String,
        required: true,
        enum: ['BAJA', 'MEDIA', 'ALTA'],
        default: 'BAJA'
    },
    
    codigo: {type: String, required: true,unique: true,
        enum: [
            'INFORME_MAXIMAS_MINIMAS', 
            'INFORME_PROMEDIOS', 
            'BUSCAR_ALERTAS', 
            'CONSULTAR_DATOS', 
            'ANALISIS_DESVIACION',
            'CHECK_SALUD',
            'REPORTE_PERIODICO'
        ]
    }
});

export default mongoose.model('Proceso', ProcesoSchema, 'proceso');