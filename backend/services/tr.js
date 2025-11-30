import * as ProcesoRepository from '../repositories/mongo/proceso.repository.js';
import * as TransaccionRepository from '../repositories/postgres/transaccion.repository.js';
import * as MedicionRepository from '../repositories/mongo/medicion.repository.js';
import redisClient from '../config/redis.js'; 

export async function solicitarProceso({ usuarioId, procesoId, parametros }) {
    
    // buscamos si el proceso existe
    console.log(`Buscando proceso ${procesoId}...`);
    const proceso = await ProcesoRepository.obtenerProcesoPorId(procesoId);
    
    if (!proceso) {
        throw new Error('El proceso solicitado no existe.');
    }

    // siel usuario no tiene el dinero suficiente no seguimos
    const ticket = await TransaccionRepository.crearSolicitudConFactura({
        usuarioId,
        procesoIdMongo: procesoId,
        costo: proceso.costo
    });

    console.log(`Cobrado. Solicitud #${ticket.solicitud_id}. Ejecutando lógica...`);

    // ejecutamos el proceso solicitado
    let resultadoDelProceso = null;
    let vinoDeCache = false; 
    try {
        // Generamos una clave única para esta consulta: "PROCESO_ID:SENSOR_ID:FECHAS"
        const cacheKey = `CACHE:${proceso.codigo}:${JSON.stringify(parametros)}`;
        
        // Preguntamos a Redis si ya tiene la respuesta
        const datosEnCache = await redisClient.get(cacheKey);

        if (datosEnCache) {
            console.log("cache con misma consulta: Devolviendo datos desde Redis.");
            resultadoDelProceso = JSON.parse(datosEnCache);
            vinoDeCache = true; 
        
        } else {
            console.log("cache vacia: Consultando a MongoDB...");
            
            switch (proceso.codigo) {
                case 'INFORME_MAXIMAS_MINIMAS':
                    if (!parametros?.sensorId || !parametros?.fechaInicio || !parametros?.fechaFin) {
                        throw new Error('Faltan parámetros: sensorId, fechaInicio, fechaFin');
                    }
                    const rawMaxMin = await MedicionRepository.obtenerReporteRango(
                        parametros.sensorId,
                        parametros.fechaInicio,
                        parametros.fechaFin
                    );
                    
                    if (rawMaxMin) {
                        resultadoDelProceso = {
                            tempMaxima: rawMaxMin.tempMaxima,
                            tempMinima: rawMaxMin.tempMinima,
                            cantMediciones: rawMaxMin.cantMediciones
                        };
                    }
                    break;

                case 'INFORME_PROMEDIOS':
                    if (!parametros?.sensorId || !parametros?.fechaInicio || !parametros?.fechaFin) {
                        throw new Error('Faltan parámetros: sensorId, fechaInicio, fechaFin');
                    }
                    const rawProm = await MedicionRepository.obtenerReporteRango(
                        parametros.sensorId,
                        parametros.fechaInicio,
                        parametros.fechaFin
                    );

                    if (rawProm) {
                        resultadoDelProceso = {
                            tempPromedio: rawProm.tempPromedio,
                            cantMediciones: rawProm.cantMediciones
                        };
                    }
                    break;

                case 'ANALISIS_DESVIACION':
                    if (!parametros?.sensorId || !parametros?.fechaInicio || !parametros?.fechaFin) {
                        throw new Error('Faltan parámetros: sensorId, fechaInicio, fechaFin');
                    }
                    const rawDesv = await MedicionRepository.obtenerReporteRango(
                        parametros.sensorId,
                        parametros.fechaInicio,
                        parametros.fechaFin
                    );

                    if (rawDesv) {
                        resultadoDelProceso = {
                            stdDev: rawDesv.stdDev, // Solo devolvemos la desviación
                            cantMediciones: rawDesv.cantMediciones
                        };
                    }
                    break;

                case 'CONSULTAR_DATOS':
                    if (!parametros?.sensorId) throw new Error('Falta parámetro: sensorId');
                    resultadoDelProceso = await MedicionRepository.obtenerUltimasMediciones(parametros.sensorId);
                    break;

                case 'BUSCAR_ALERTAS': 
                    if (!parametros?.sensorId || !parametros?.umbral) throw new Error('Faltan: sensorId, umbral');
                    
                    resultadoDelProceso = await MedicionRepository.buscarAlertas({
                        sensorIds: parametros.sensorId, 
                        umbral: parametros.umbral,
                        variable: parametros.variable || 'temperatura',
                        operador: parametros.operador || 'mayor',
                        fechaInicio: parametros.fechaInicio,
                        fechaFin: parametros.fechaFin
                    });
                    break;

                default:
                    //caso de estado de sensor
                    const salud = await MedicionRepository.obtenerEstadoSensor(parametros.sensorId);
                    
                    resultadoDelProceso = {
                        "Sensor ": salud.sensor,
                        "Estado Actual": salud.estado ? salud.estado.toUpperCase() : 'DESCONOCIDO'
                    };
                    break;
            }
            if (resultadoDelProceso) {
                    await redisClient.setEx(cacheKey, 600, JSON.stringify(resultadoDelProceso));
                }
            }
    
    } catch (logicError) {
        // si fallo la ejecucion del proceso, se reembolsa al usuario
        console.error("Falló la ejecución. Iniciando reembolso...", logicError.message);

        await TransaccionRepository.reembolsarSolicitud(
            ticket.solicitud_id,
            usuarioId,
            proceso.costo,
            logicError.message 
        );

        
        throw new Error(`Error en el proceso: ${logicError.message}. Tu saldo ha sido reembolsado.`);
    }
    
    if (resultadoDelProceso) {
        if (Array.isArray(resultadoDelProceso)) {
            resultadoDelProceso = {
                datos: resultadoDelProceso,
                _esArrayOriginalmente: true // Flag para que la TUI sepa cómo leerlo
            };
        }

        // 1. Inyectamos los metadatos
        resultadoDelProceso._metadatos = {
            sensorNombre: parametros.sensorNombre || 'ID: ' + parametros.sensorId,
            fechaInicio: parametros.fechaInicio,
            fechaFin: parametros.fechaFin,
            umbral: parametros.umbral,
            variable: parametros.variable,
            origen: vinoDeCache ? 'Redis Cache' : 'MongoDB'
        };

        // 2. Guardamos en PostgreSQL
        await TransaccionRepository.guardarResultadoExitoso(
            ticket.solicitud_id, 
            resultadoDelProceso
        );
    }
            
    return {
        status: 'success',
        ticket: {
            solicitud_id: ticket.solicitud_id,
            servicio: proceso.nombre,
            costo: proceso.costo
        },
        data: resultadoDelProceso,
        
    };
}
 
export async function obtenerHistorial(usuarioId) {
    return await TransaccionRepository.obtenerHistorialUsuario(usuarioId);
}

export async function getSaldo(usuarioId) {
    return await TransaccionRepository.obtenerSaldo(usuarioId);
}

export async function cargarDinero(usuarioId, monto) {
    // Validación de negocio
    if (!monto || monto <= 0) {
        throw new Error("El monto a recargar debe ser positivo");
    }
    
    // Delegamos al repo
    const nuevoSaldo = await TransaccionRepository.recargarSaldo(usuarioId, monto);
    return nuevoSaldo;

}
export async function obtenerDetalleSolicitud(solicitudId) {
    const solicitud = await TransaccionRepository.obtenerSolicitudPorId(solicitudId);
    if (!solicitud) return null;

    // El resultado viene como texto desde Postgres, hay que parsearlo
    if (solicitud.resultado) {
        try {
            solicitud.resultado = JSON.parse(solicitud.resultado);
        } catch (e) {
            console.error("Error parseando JSON de historial:", e);
        }
    }
    return solicitud;
}