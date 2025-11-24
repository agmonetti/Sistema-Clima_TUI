import * as IngestaService from '../services/ingesta.service.js';
import * as MedicionRepository from '../repositories/mongo/medicion.repository.js';
//recibe datos del sensor y registra mediciones
 
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
export const listarSensores = async (req, res) => {
    try {
        const { ciudad } = req.query; // Leemos de la URL
        const sensores = await MedicionRepository.listarSensores(ciudad);
        res.json(sensores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Nueva función para el combo de ciudades
export const obtenerCiudades = async (req, res) => {
    try {
        const ciudades = await MedicionRepository.listarCiudades();
        res.json(ciudades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const verHistorialSensor = async (req, res) => {
    try {
        const { sensorId } = req.params;
        const historial = await MedicionRepository.obtenerUltimasMediciones(sensorId);
        res.json(historial);
    } catch (error) {
        console.error('Error historial sensor:', error);
        res.status(500).json({ error: error.message });
    }
};