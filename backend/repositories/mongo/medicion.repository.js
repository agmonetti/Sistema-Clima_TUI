import Medicion from '../../models/mongo/Medicion.js';
import mongoose from 'mongoose';
import Sensor from '../../models/mongo/Sensor.js';

// 1- insertar datos
export async function crearMedicion(datos) {
    try {
        // Mongoose simplifica todo: .create() valida y guarda.
        const nuevaMedicion = await Medicion.create(datos);
        return nuevaMedicion;
    } catch (error) {
        throw new Error(`Error al guardar medición: ${error.message}`);
    }
}

export async function obtenerEstadoSensor(sensorId) {
    try {
        const sensor = await Sensor.findById(sensorId, 'nombre configuracion.estado_sensor');
        if (!sensor) {
            throw new Error('Sensor no encontrado');
        }
        return {
            sensor: sensor.nombre,
            estado: sensor.configuracion.estado_sensor 
        };
    } catch (error) {
        throw new Error(`Error obteniendo estado del sensor: ${error.message}`);
    }
}

//2- obtener el reporte de un sensor en un rango de fechas
export async function obtenerReporteRango(sensorId, fechaInicio, fechaFin) {
    try {
        const reporte = await Medicion.aggregate([
            {
                // filtramos por sensor y por rango de fechas
                $match: {
                    sensor_id: new mongoose.Types.ObjectId(String(sensorId)), 
                    timestamp: { 
                        $gte: new Date(fechaInicio), 
                        $lte: new Date(fechaFin)    
                    }
                }
            },
            {
                //  _id: null, agrupamos todo en un solo resultado
                $group: {
                    _id: null, 
                    tempPromedio: { $avg: "$temperatura" },
                    tempMaxima: { $max: "$temperatura" },   
                    tempMinima: { $min: "$temperatura" },
                    stdDev: { $stdDevPop: "$temperatura" }, // Desviación estándar poblacional   
                    cantMediciones: { $sum: 1 }             
                }
            }
        ]);

        // Mongo devuelve un array. Si está vacío, retornamos null.
        return reporte.length > 0 ? reporte[0] : null;

    } catch (error) {
        throw new Error(`Error generando reporte: ${error.message}`);
    }
}

//3- sirve para obtener las ultimas n mediciones de un sensor
export async function obtenerUltimasMediciones(sensorId, limite = 20) {
    try {
        const historial = await Medicion.find({ sensor_id: sensorId })
            .sort({ timestamp: -1 })
            .limit(limite);
            
        return historial;
    } catch (error) {
        throw new Error(`Error obteniendo historial: ${error.message}`);
    }
}

//4- buscar alertas de temperatura
export async function buscarAlertas({ sensorIds, variable = 'temperatura',umbral, operador = 'mayor', fechaInicio, fechaFin, limite = 50 }) {
    try {

        const camposValidos = ['temperatura', 'humedad'];
        if (!camposValidos.includes(variable)) {
            throw new Error(`Variable no valida. Existen: ${camposValidos.join(' o ')}`);
        }

        //filtro para que entienda mongo
        let queryValor = {};
        if (operador === 'mayor') {
            queryValor = { $gt: umbral }; 
        } else {
            queryValor = { $lt: umbral }; 
        }

        //filtro de fecha 
        let queryFecha = {};
        if (fechaInicio && fechaFin) {
            queryFecha = { 
                $gte: new Date(fechaInicio), 
                $lte: new Date(fechaFin) 
            };
        } else {
            // si no se pasa como parametro, ultimas 24 horas
            const haceUnDia = new Date();
            haceUnDia.setDate(haceUnDia.getDate() - 1);
            queryFecha = { $gte: haceUnDia };
        }

        // recibimos un array, si es un solo sensor lo convertimos a array
        const idsParaBuscar = Array.isArray(sensorIds) ? sensorIds : [sensorIds];

        //le decimos a mong que use esa variable
        const queryMongo = {
            sensor_id: { $in: idsParaBuscar },
            timestamp: queryFecha,
            [variable]: queryValor 
        };


        const alertas = await Medicion.find(queryMongo) 
            .sort({ timestamp: -1 })
            .limit(limite)
            .populate('sensor_id', 'nombre ubicacion')  
            .lean();

        return alertas;

    } catch (error) {
        throw new Error(`Error buscando alertas en Mongo: ${error.message}`);
    }
}
export async function listarSensores(ciudad) {
    try {
        const filtro = {};
        if (ciudad) {
            filtro['ubicacion.ciudad'] = ciudad;
        }
        const limite = ciudad ? 100 : 20;

       return await Sensor.find(filtro, 'nombre ubicacion configuracion.tipo_sensor _id')
            .limit(limite)
            .lean();
    } catch (error) {
        throw new Error(`Error listando sensores: ${error.message}`);
    }
}
// NUEVA FUNCIÓN: Obtener lista de ciudades únicas para el combo
export async function listarCiudades() {
    try {
        return await Sensor.distinct('ubicacion.ciudad');
    } catch (error) {
        throw new Error(`Error obteniendo ciudades: ${error.message}`);
    }
}