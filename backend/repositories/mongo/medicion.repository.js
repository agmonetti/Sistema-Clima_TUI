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
export async function obtenerReporteRango(sensorId, fechaInicio, fechaFin, variable ='temperatura') {
   try {
        // 1. Definimos qué campos vamos a calcular según la variable
        let groupStage = {
            _id: null,
            cantMediciones: { $sum: 1 }
        };

        // Lógica para agregar campos al grupo dinámicamente
        const agregarCampos = (tipo) => {
            if (tipo === 'temperatura' || tipo === 'ambas') {
                groupStage.tempPromedio = { $avg: "$temperatura" };
                groupStage.tempMaxima = { $max: "$temperatura" };
                groupStage.tempMinima = { $min: "$temperatura" };
                groupStage.tempStdDev = { $stdDevPop: "$temperatura" };
            }
            if (tipo === 'humedad' || tipo === 'ambas') {
                groupStage.humPromedio = { $avg: "$humedad" };
                groupStage.humMaxima = { $max: "$humedad" };
                groupStage.humMinima = { $min: "$humedad" };
                groupStage.humStdDev = { $stdDevPop: "$humedad" };
            }
        };

        agregarCampos(variable);

        const reporte = await Medicion.aggregate([
            {
                $match: {
                    sensor_id: new mongoose.Types.ObjectId(String(sensorId)), 
                    timestamp: { 
                        $gte: new Date(fechaInicio), 
                        $lte: new Date(fechaFin)    
                    }
                }
            },
            {
                $group: groupStage 
            },
            // Proyecto final para redondear
            {
                $project: {
                    _id: 0,
                    cantMediciones: 1,
                    // Usamos $ifNull para que no falle si pedimos solo una variable
                    tempPromedio: { $round: [{ $ifNull: ["$tempPromedio", 0] }, 2] },
                    tempMaxima: { $ifNull: ["$tempMaxima", null] }, 
                    tempMinima: { $ifNull: ["$tempMinima", null] },
                    tempStdDev: { $round: [{ $ifNull: ["$tempDesviacion", 0] }, 2] },
                    
                    humPromedio: { $round: [{ $ifNull: ["$humPromedio", 0] }, 2] },
                    humMaxima: { $ifNull: ["$humMaxima", null] },
                    humMinima: { $ifNull: ["$humMinima", null] },
                    humStdDev: { $round: [{ $ifNull: ["$humDesviacion", 0] }, 2] }
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
        const limite = 100;

       return await Sensor.find(filtro, 'nombre ubicacion configuracion.tipo_sensor _id')
            .limit(limite)
            .lean();
    } catch (error) {
        throw new Error(`Error listando sensores: ${error.message}`);
    }
}

export async function listarCiudades() {
    try {
        const ciudades = await Sensor.distinct('ubicacion.ciudad');
        return ciudades.sort(); 
    } catch (error) {
        throw new Error(`Error listando ciudades: ${error.message}`);
    }
}

export async function generarReportePeriodico({ ciudad, anio, tipoReporte, mes }) {
    try {
        
        let fechaInicio, fechaFin;

        if(mes){ // equivale a !null
            // Mes específico
            fechaInicio = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0));
            fechaFin = new Date(Date.UTC(anio, mes, 0, 23, 59, 59, 999));
        } else {
            // Todo el año
            fechaInicio = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
            fechaFin = new Date(Date.UTC(anio, 11, 31, 23, 59, 59, 999));
        }

        let groupById = { ciudad: '$datos_sensor.ubicacion.ciudad' };
        
        if (tipoReporte === 'mensual') {
            groupById.mes = { $month: '$timestamp' };
        } else {
            groupById.mes = "ANUAL"; 
        }

        const reporte = await Medicion.aggregate([
            // 1. Filtramos por la fecha primero para reducir la cantidad de documentos a procesar
            { 
                $match: { 
                    timestamp: { $gte: fechaInicio, $lte: fechaFin } 
                } 
            },
            
            // 2.  Unimos cada medición con los datos de su sensor para saber la ciudad
            {
                $lookup: {
                    from: 'sensores',       // Nombre de la colección destino
                    localField: 'sensor_id',// Campo en Medicion
                    foreignField: '_id',    // Campo en Sensor
                    as: 'datos_sensor'      // Nombre del array resultante
                }
            },
            
            // 3. como el lookup devuelve un array, lo separamos
            { $unwind: '$datos_sensor' },

            // 4.  Ahora que tenemos los datos del sensor, filtramos por la ciudad pedida
            {
                $match: {
                    'datos_sensor.ubicacion.ciudad': { $regex: new RegExp(ciudad, 'i') }
                }
            },

            // 5.  Agrupamos por MES para sacar el promedio
            {
                $group: {
                    _id: groupById,
                    tempPromedio: { $avg: '$temperatura' },
                    humPromedio: { $avg: '$humedad' },
                    tempMax: { $max: '$temperatura' },
                    tempMin: { $min: '$temperatura' },
                    cantMediciones: { $sum: 1 }
                }
            },

            // 6. ordenamos
            { $sort: { '_id.mes': 1 } },

            // 7. organizamos
            {
                $project: {
                    _id: 0,
                    mes: '$_id.mes',
                    ciudad: '$_id.ciudad',
                    tempPromedio: { $round: ['$tempPromedio', 2] }, 
                    humPromedio: { $round: ['$humPromedio', 2] },
                    tempMax: 1,
                    tempMin: 1,
                    cantMediciones: 1
                }
            }
        ]);

        const MESES = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]

        return reporte.map(r => {
            let etiquetaPeriodo = '';
            
            if (typeof r.mes === 'number') {
                etiquetaPeriodo = MESES[r.mes - 1] || 'FALLA.';
            } 
            
            else if (r.mes === 'ANUAL') {
                etiquetaPeriodo = `Año ${anio}`;
            }

            return {
                PERIODO: etiquetaPeriodo,
                CIUDAD: r.ciudad,
                TEMP_PROM: r.tempPromedio + '°C',
                HUM_PROM: r.humPromedio + '%',
                MAX: r.tempMax + '°C',
                MIN: r.tempMin + '°C',
                CANT: r.cantMediciones
            };
        });

    } catch (error) {
        throw new Error(`Error en reporte periodico: ${error.message}`);
    }
}