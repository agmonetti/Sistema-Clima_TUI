import * as MedicionRepository from '../repositories/mongo/medicion.repository.js';
import * as CacheRepository from '../repositories/redis/cache.repository.js';


export async function procesarMedicion(datos) {
    const medicionParaGuardar = {
        ...datos, 
        timestamp: datos.timestamp || new Date()
    };

    // guardamos en el historico primero.
    // Si esto falla, detenemos todo el flujo.
    const medicionGuardada = await MedicionRepository.crearMedicion(medicionParaGuardar);

    //actualizamos el estado de redis, si es que la ingesta se concreto
    try {
        await CacheRepository.actualizarEstadoSensor(
            datos.sensor_id, 
            { 
                temperatura: datos.temperatura, 
                humedad: datos.humedad 
            }
        );
    } catch (error) {
        // Solo registramos el error, pero NO detenemos el flujo.
        console.warn(`Advertencia: No se pudo actualizar caché para sensor ${datos.sensor_id}`, error.message);
    }

    return medicionGuardada;
}