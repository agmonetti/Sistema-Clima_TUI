import client from '../../config/redis.js';

// la última medición de un sensor en Redis. Si no se actualiza, expira.

export async function actualizarEstadoSensor(sensorId, { temperatura, humedad }) {
    const key = `sensor:estado:${sensorId}`;
    const timestamp = Date.now();

    try {
        // HSET: permite guardar múltiples campos en la clave
        await client.hSet(key, {
            ultima_t: temperatura.toString(),
            ultima_h: humedad.toString(),
            last_seen: timestamp.toString()
        });

        // EXPIRE: Reinicia el contador de vida a 5 minutos
        await client.expire(key, 300); 
        
    } catch (error) {
        console.error(`Error guardando en Redis (Sensor ${sensorId}):`, error);
    }
}

//obtener estado sensor.
export async function obtenerEstadoSensor(sensorId) {
    const key = `sensor:estado:${sensorId}`;

    try {
        const datos = await client.hGetAll(key);
        
        // Si el objeto está vacío (Redis devuelve {} si no existe), retornamos null
        if (Object.keys(datos).length === 0) {
            return null; 
        }

        return {
            temperatura: parseFloat(datos.ultima_t),
            humedad: parseFloat(datos.ultima_h),
            last_seen: new Date(parseInt(datos.last_seen))
        };

    } catch (error) {
        throw new Error(`Error leyendo Redis: ${error.message}`);
    }
}