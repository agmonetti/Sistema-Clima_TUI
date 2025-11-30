import * as ProcesoRepository from '../repositories/mongo/proceso.repository.js';
import * as TransaccionRepository from '../repositories/postgres/transaccion.repository.js';
import * as MedicionRepository from '../repositories/mongo/medicion.repository.js';
import redisClient from '../config/redis.js'; 

// creamos el ticket y lo guardamos en la cola
export async function solicitarProceso({ usuarioId, procesoId, parametros }) {
    
    console.log(`Buscando proceso ${procesoId}...`);
    const proceso = await ProcesoRepository.obtenerProcesoPorId(procesoId);
    
    if (!proceso) {
        throw new Error('El proceso solicitado no existe.');
    }

    // 1. Cobro y creacion ticket en estado PENDIENTE 
    const ticket = await TransaccionRepository.crearSolicitudConFactura({
        usuarioId,
        procesoIdMongo: procesoId,
        costo: proceso.costo
    });

    console.log(`Cobrado. Solicitud #${ticket.solicitud_id}. Encolando para aprobación...`);

    // 2. Guardamos los parámetros en Redis temporalmente 
    const paramsKey = `PARAMS_SOLICITUD:${ticket.solicitud_id}`;
    await redisClient.setEx(paramsKey, 604800, JSON.stringify(parametros));

    return {
        status: 'pending',
        mensaje: 'Solicitud recibida. Esperando aprobación técnica.',
        ticket: {
            solicitud_id: ticket.solicitud_id,
            servicio: proceso.nombre,
            costo: proceso.costo,
            estado: 'PENDIENTE ⏳'
        }
    };
}

// lista de procesos pendientes
export async function listarPendientesParaTecnico() {
    const pendientesSQL = await TransaccionRepository.obtenerSolicitudesPendientes();

    // SQL tiene el ID del proceso, Mongo tiene el Nombre, juntamos todo
    const listaCompleta = await Promise.all(pendientesSQL.map(async (p) => {
        try {
            const procesoMongo = await ProcesoRepository.obtenerProcesoPorId(p.proceso_id_mongo);
            return { 
                ...p, 
                nombre_proceso: procesoMongo.nombre, 
                codigo_proceso: procesoMongo.codigo,
                complejidad: procesoMongo.complejidad || 'DESCONOCIDA'
            };
        } catch (e) {
            return { ...p, 
                        nombre_proceso: 'Proceso Desconocido',
                        codigo_proceso: 'UNKNOWN',
                        complejidad: '?' 
                };
        }
    }));

    return listaCompleta;
}

//aprobar y ejecutar el proceso
export async function aprobarEjecucion(solicitudId) {

    // 1. Recuperamos la info de la solicitud de Postgres
    const solicitud = await TransaccionRepository.obtenerSolicitudPorId(solicitudId);
    
    if (!solicitud) throw new Error("Solicitud no encontrada");
    if (solicitud.isCompleted) throw new Error("La solicitud ya fue procesada");

    // 2. Recuperamos los parametros guardados en Redis
    const paramsKey = `PARAMS_SOLICITUD:${solicitudId}`;
    const paramsRaw = await redisClient.get(paramsKey);
    
    if (!paramsRaw) throw new Error("Error: Se perdieron los parametros de la solicitud.");
    const parametros = JSON.parse(paramsRaw);

    // 3. Recuperamos el proceso de Mongo
    const proceso = await ProcesoRepository.obtenerProcesoPorId(solicitud.proceso_id);

    let resultadoDelProceso = null;
    let vinoDeCache = false;

    try {
        // Generamos la clave de cache para el resultado ya que sabemos que se puede ejecutar
        const cacheKey = `CACHE:${proceso.codigo}:${JSON.stringify(parametros)}`;
        const datosEnCache = await redisClient.get(cacheKey);

        if (datosEnCache) {
            console.log("Cache: Consulta EXISTENTE, ejecutada desde Redis.");
            resultadoDelProceso = JSON.parse(datosEnCache);
            vinoDeCache = true;
        } else {
            console.log("Mongo: Consulta NUEVA, ejecutada desde MongoDB");
            
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

                case 'CHECK_SALUD':
                    const salud = await MedicionRepository.obtenerEstadoSensor(parametros.sensorId);
                    resultadoDelProceso = { "Sensor": salud.sensor, "Estado Actual": salud.estado ? salud.estado.toUpperCase() : 'DESCONOCIDO' };
                    break;
                case 'REPORTE_PERIODICO':
                    if (!parametros?.ciudad || !parametros?.anio) throw new Error('Faltan: ciudad, anio');
                        resultadoDelProceso = await MedicionRepository.generarReportePeriodico({
                            ciudad: parametros.ciudad,
                            anio: parametros.anio,
                            tipoReporte: parametros.tipoReporte || 'mensual',
                            mes: parametros.mes

                        });
                    break;
            }

            // Guardar resultado en REDIS
            if (resultadoDelProceso) {
                await redisClient.setEx(cacheKey, 600, JSON.stringify(resultadoDelProceso));
            }
        
        }
    }
        catch (logicError) {
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


        // 4. metadatos, guarado en historial y limpieza
        if (resultadoDelProceso) {
            if (Array.isArray(resultadoDelProceso)) {
                resultadoDelProceso = {
                    datos: resultadoDelProceso,
                    _esArrayOriginalmente: true
                };
            }

            // Inyectamos los metadatos
            resultadoDelProceso._metadatos = {
                sensorNombre: parametros.sensorNombre || 'ID: ' + parametros.sensorId,
                fechaInicio: parametros.fechaInicio,
                fechaFin: parametros.fechaFin,
                umbral: parametros.umbral,
                variable: parametros.variable,
                origen: vinoDeCache ? 'Redis Cache' : 'MongoDB',
                fechaEjecucion: new Date()
            };

            // Guardar en Historial y Marcar como Completado
            await TransaccionRepository.guardarResultadoExitoso(solicitudId, resultadoDelProceso);
            
            // Borramos los parámetros temporales, ya no sirven
            await redisClient.del(paramsKey);
        }

        return { status: 'ok', data: resultadoDelProceso };

    }


export async function obtenerHistorial(usuarioId) {
    return await TransaccionRepository.obtenerHistorialUsuario(usuarioId);
}

export async function getSaldo(usuarioId) {
    return await TransaccionRepository.obtenerSaldo(usuarioId);
}

export async function cargarDinero(usuarioId, monto) {
    if (!monto || monto <= 0) throw new Error("El monto a recargar debe ser positivo");
    return await TransaccionRepository.recargarSaldo(usuarioId, monto);
}

export async function obtenerDetalleSolicitud(solicitudId) {
    const solicitud = await TransaccionRepository.obtenerSolicitudPorId(solicitudId);
    
    if (!solicitud) return null;
    try {
        if (solicitud.proceso_id) {
            const procesoMongo = await ProcesoRepository.obtenerProcesoPorId(solicitud.proceso_id);
            solicitud.nombre_proceso = procesoMongo ? procesoMongo.nombre : 'Proceso no encontrado';
            solicitud.codigo_proceso = procesoMongo ? procesoMongo.codigo : 'UNKNOWN';
        }
    } catch (error) {
        solicitud.nombre_proceso = 'Error recuperando el nombre';
    }
    if (solicitud.resultado) {
        try {
            solicitud.resultado = JSON.parse(solicitud.resultado);
        } catch (e) {
            console.error("Error parseando JSON de historial:", e);
        }
    }
    
    return solicitud;
}