import pool from '../../config/postgres.js';

// 1 -  proceso de crear solicutd

export async function crearSolicitudConFactura({ usuarioId, procesoIdMongo, costo }) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // 🛑 INICIO TRANSACCIÓN

        // verificamos quetiene saldo y es suficiente
        const saldoQuery = `
            SELECT "saldoActual" FROM "Cuentas_Corrientes" 
            WHERE usuario_id = $1 FOR UPDATE
        `;
        const resSaldo = await client.query(saldoQuery, [usuarioId]);
        
        if (resSaldo.rows.length === 0) {
            throw new Error('El usuario no tiene cuenta corriente activa');
        }

        const saldoActual = parseFloat(resSaldo.rows[0].saldoActual);

        if (saldoActual < costo) {
            throw new Error(`Saldo insuficiente. Tienes $${saldoActual}, se requiere $${costo}`);
        }

        // creamos la solcitud del proceso
        const insertSolicitud = `
            INSERT INTO "Solicitud_Proceso" (usuario_id, proceso_id, "isCompleted")
            VALUES ($1, $2, FALSE)
            RETURNING solicitud_id
        `;
        const resSol = await client.query(insertSolicitud, [usuarioId, procesoIdMongo]);
        const solicitudId = resSol.rows[0].solicitud_id;

        // se crea la factura
        const insertFactura = `
            INSERT INTO "Facturas" (usuario_id, solicitud_id, "estadoFactura")
            VALUES ($1, $2, 'pagada') 
            RETURNING factura_id
        `;
        await client.query(insertFactura, [usuarioId, solicitudId]);

        // se actualzia el saldo
        const updateSaldo = `
            UPDATE "Cuentas_Corrientes"
            SET "saldoActual" = "saldoActual" - $1
            WHERE usuario_id = $2
            RETURNING "saldoActual"
        `;
        const resNuevoSaldo = await client.query(updateSaldo, [costo, usuarioId]);

        await client.query('COMMIT'); 
        
        return {
            solicitud_id: solicitudId,
            nuevo_saldo: resNuevoSaldo.rows[0].saldoActual
        };

    } catch (error) {
        await client.query('ROLLBACK'); 
        throw error;
    } finally {
        client.release(); // liberamos la conexion
    }
}

// 2- rembolso en caso de que falle la solicitud del prose
export async function reembolsarSolicitud(solicitudId, usuarioId, costo, motivoError) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // devolvemos el dinero
        const updateSaldo = `
            UPDATE "Cuentas_Corrientes"
            SET "saldoActual" = "saldoActual" + $1
            WHERE usuario_id = $2
        `;
        await client.query(updateSaldo, [costo, usuarioId]);

        // guardamos el error en el historial
        const updateHistorial = `
            INSERT INTO "Historial_Ejecucion_Procesos" (solicitud_id, resultado, "isCompleted")
            VALUES ($1, $2, FALSE)
        `;
        //guardamos el error para revisarlo a futuro
        await client.query(updateHistorial, [solicitudId, `ERROR SISTEMA: ${motivoError}. REEMBOLSADO.`]);

        await client.query('COMMIT');
        console.log(`Reembolso ejecutado correctamente para solicitud ${solicitudId}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR CRiTICO: Fallo el reembolso', solicitudId, error);
    } finally {
        client.release();
    }
}

// 3- el usuario consulta el historial de sus procesos
export async function obtenerHistorialUsuario(usuarioId) {
    const SQL = `
        SELECT 
            sp.solicitud_id, 
            sp.proceso_id AS proceso_mongo_id, 
            sp."fechaSolicitud", 
            sp."isCompleted",
            f.factura_id,
            f."estadoFactura",
            h.resultado
        FROM "Solicitud_Proceso" sp
        LEFT JOIN "Facturas" f ON sp.solicitud_id = f.solicitud_id
        LEFT JOIN "Historial_Ejecucion_Procesos" h ON sp.solicitud_id = h.solicitud_id
        WHERE sp.usuario_id = $1
        ORDER BY sp."fechaSolicitud" ASC
    `;
    
    const result = await pool.query(SQL, [usuarioId]);
    return result.rows;
}

//funcion para obtener el saldo actual
export async function obtenerSaldo(usuarioId) {
    const query = `
        SELECT "saldoActual" 
        FROM "Cuentas_Corrientes" 
        WHERE usuario_id = $1
    `;
    const result = await pool.query(query, [usuarioId]);
    // Si no tiene cuenta, retornamos 0
    return result.rows[0] ? parseFloat(result.rows[0].saldoActual) : 0;
}

//funcion para recargar el salod
export async function recargarSaldo(usuarioId, monto) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Actualizar el saldo (Sumar)
        const updateQuery = `
            UPDATE "Cuentas_Corrientes"
            SET "saldoActual" = "saldoActual" + $1
            WHERE usuario_id = $2
            RETURNING "saldoActual"
        `;
        const resUpdate = await client.query(updateQuery, [monto, usuarioId]);
        
        if (resUpdate.rowCount === 0) {
            throw new Error("Usuario sin cuenta corriente activa.");
        }
        
        const nuevoSaldo = resUpdate.rows[0].saldoActual;

        // 2. Registrar el movimiento (Auditoría)
        const insertMovimiento = `
            INSERT INTO "Movimientos_CC" (cuenta_id, monto, "fechaMovimiento")
            VALUES (
                (SELECT cuenta_id FROM "Cuentas_Corrientes" WHERE usuario_id = $1),
                $2,
                NOW()
            )
        `;
        await client.query(insertMovimiento, [usuarioId, monto]);

        await client.query('COMMIT');
        return nuevoSaldo;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// 4- guardar el resultado exitoso de un proceso
export async function guardarResultadoExitoso(solicitudId, resultadoObj) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Marcar la solicitud principal como completada
        await client.query(
            'UPDATE "Solicitud_Proceso" SET "isCompleted" = TRUE WHERE solicitud_id = $1', 
            [solicitudId]
        );

        // 2. Insertar el registro en el historial con el JSON del resultado
        // Convertimos el objeto JS a String para guardarlo en la columna TEXT
        const resultadoStr = JSON.stringify(resultadoObj);
        
        const insertHistorial = `
            INSERT INTO "Historial_Ejecucion_Procesos" (solicitud_id, resultado, "isCompleted")
            VALUES ($1, $2, TRUE)
        `;
        await client.query(insertHistorial, [solicitudId, resultadoStr]);

        await client.query('COMMIT');
        console.log(`✅ Resultado guardado para solicitud #${solicitudId}`);

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Error guardando resultado: ${error.message}`);
    } finally {
        client.release();
    }
}
export async function obtenerSolicitudPorId(solicitudId) {
    const SQL = `
        SELECT 
            sp.solicitud_id, 
            sp.proceso_id, 
            sp."fechaSolicitud", 
            sp."isCompleted",
            h.resultado,
            f.factura_id,
            f."estadoFactura"
        FROM "Solicitud_Proceso" sp
        LEFT JOIN "Historial_Ejecucion_Procesos" h ON sp.solicitud_id = h.solicitud_id
        LEFT JOIN "Facturas" f ON sp.solicitud_id = f.solicitud_id
        WHERE sp.solicitud_id = $1
    `;
    
    const result = await pool.query(SQL, [solicitudId]);
    return result.rows[0];
}

export async function obtenerSolicitudesPendientes() {
    const SQL = `
        SELECT 
            sp.solicitud_id, 
            sp.fechaSolicitud, 
            u.nombre as usuario_nombre,
            u.mail as usuario_mail,
            p.nombre as proceso_nombre,
            p.costo,
            sp.proceso_id
        FROM "Solicitud_Proceso" sp
        JOIN "Usuario" u ON sp.usuario_id = u.usuario_id
        WHERE sp."isCompleted" = FALSE
        ORDER BY sp."fechaSolicitud" ASC
    `;
    
    const SQL_SIMPLE = `
        SELECT 
            sp.solicitud_id, 
            sp."fechaSolicitud", 
            u.nombre as usuario_nombre,
            u.mail as usuario_mail,  -- <--- AGREGAR ESTA LÍNEA
            sp.proceso_id as proceso_id_mongo
        FROM "Solicitud_Proceso" sp
        JOIN "Usuario" u ON sp.usuario_id = u.usuario_id
        WHERE sp."isCompleted" = FALSE
        ORDER BY sp."fechaSolicitud" ASC
    `;

    const result = await pool.query(SQL_SIMPLE);
    return result.rows;
}