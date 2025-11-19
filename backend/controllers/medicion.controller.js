import * as IngestaService from '../services/ingesta.service.js';

/**
 * Endpoint: POST /api/medicion/ingesta
 * Responsabilidad: Recibir datos del sensor, validar formato y responder HTTP.
 */
export const registrarMedicion = async (req, res) => {
    try {
        const datos = req.body; // obtenemos los datos formato JSON

        console.log('[Controller] Recibida medición:', datos);

        // validacion basica
        if (!datos.sensor_id || datos.temperatura === undefined) {
            return res.status(400).json({ 
                error: 'Datos incompletos. Se requiere sensor_id y temperatura.' 
            });
        }

        // delegamos al servicio que se encarga de insertar los datos
        const resultado = await IngestaService.procesarMedicion(datos);


        res.status(201).json({
            message: 'Medición registrada correctamente',
            data: {
                id: resultado._id,
                timestamp: resultado.timestamp
            }
        });

    } catch (error) {
        console.error('Error en el controlador de medición:', error.message);
        
        res.status(500).json({ 
            error: 'Error interno del servidor al procesar la medición.' 
        });
    }
};