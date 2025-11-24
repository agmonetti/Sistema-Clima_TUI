import pool from '../../config/postgres.js'; 

//Create - Crear usuario
export async function crearUsuarios({nombre,mail,password,rol_descripcion = 'usuario'}) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciamos la transacción
        
        // 1. Insertar en Usuario y obtener el usuario_id generado
        const insertUsuarioText = `
            INSERT INTO "Usuario" (nombre, mail, rol_id)
            VALUES ($1, $2, (SELECT rol_id FROM "Rol" WHERE descripcion = $3))
            RETURNING usuario_id
        `;
        const resUsuario = await client.query(insertUsuarioText, [nombre, mail, rol_descripcion]);
        const nuevoUsuarioId = resUsuario.rows[0].usuario_id;
        
        // 2. Insertar en Usuario_Credencial
        const insertCredencialSQL = `
            INSERT INTO "Usuario_Credencial" (usuario_id, contraseña)
            VALUES ($1, $2)
        `;
        await client.query(insertCredencialSQL, [nuevoUsuarioId, password]);
        
        // 3. Insertar en Cuentas_Corrientes con saldo inicial de 0
        const insertCuentaText = `
            INSERT INTO "Cuentas_Corrientes" (usuario_id, "saldoActual")
            VALUES ($1, $2)
        `;
        await client.query(insertCuentaText, [nuevoUsuarioId, 0]);
        await client.query('COMMIT'); // Confirmamos la transacción
        return nuevoUsuarioId; // Devolvemos el ID del nuevo usuario

    } catch (error) {
        await client.query('ROLLBACK'); // Revertimos la transacción en caso de error
        console.error('Error en transacción crearUsuario:', error.message);
        throw error; // Re-lanzamos el error para manejarlo afuera
    } finally {
        client.release(); // Liberamos el cliente de vuelta al pool
    }


}

/**
 * READ - Buscar por Email
 */
export async function buscarPorEmail(email) {
    const SQL = `
        SELECT u.usuario_id, u.nombre, u.mail, u."isActive", uc.contraseña, r.descripcion AS rol
        FROM "Usuario" u
        JOIN "Usuario_Credencial" uc ON u.usuario_id = uc.usuario_id
        JOIN "Rol" r ON u.rol_id = r.rol_id
        WHERE u.mail = $1
    `;
    
    const resultado = await pool.query(SQL, [email]);
    return resultado.rows[0]; // Retorna el usuario o undefined
}

// READ - Buscar por Id

export async function buscarPorId(id) {
    const SQL = `
        SELECT u.usuario_id, u.nombre, u.mail, r.descripcion AS rol, cc."saldoActual"
        FROM "Usuario" u
        JOIN "Rol" r ON u.rol_id = r.rol_id
        LEFT JOIN "Cuentas_Corrientes" cc ON u.usuario_id = cc.usuario_id
        WHERE u.usuario_id = $1
    `;
    const resultado = await pool.query(SQL, [id]);
    return resultado.rows[0];
}

//  READ - Buscar todos los usuarios 
export async function obtenerTodos() {
    const SQL = `
        SELECT 
            u.usuario_id, 
            u.nombre, 
            u.mail, 
            u."isActive", 
            r.descripcion AS rol
        FROM "Usuario" u
        JOIN "Rol" r ON u.rol_id = r.rol_id
        ORDER BY u.usuario_id ASC;
    `;
    
    const resultado = await pool.query(SQL);
    return resultado.rows; 
}

//update de usuarios
export async function actualizarUsuario(id, { nombre, mail, rol_id, isActive }) {

    const SQL = `
        UPDATE "Usuario"
        SET 
            nombre = COALESCE($2, nombre),
            mail = COALESCE($3, mail),
            rol_id = COALESCE($4, rol_id),
            "isActive" = COALESCE($5, "isActive")
        WHERE usuario_id = $1
        RETURNING *;
    `;

    const values = [id, nombre, mail, rol_id, isActive];
    
    const resultado = await pool.query(SQL, values);
    return resultado.rows[0];
}

//update de contrsaeña
export async function actualizarPassword(id, nuevaPasswordHash) {
    const SQL = `
        UPDATE "Usuario_Credencial"
        SET contraseña = $2
        WHERE usuario_id = $1
    `;
    
    const resultado = await pool.query(SQL, [id, nuevaPasswordHash]);
    return resultado.rowCount > 0; // True si se actualizó
}


// Delete
export async function eliminarUsuario(id) {
    const SQL = 'UPDATE "Usuario" SET "isActive" = FALSE WHERE usuario_id = $1';
    const resultado = await pool.query(SQL, [id]);
    return resultado.rowCount > 0; // Devuelve true si borró algo
}

export async function revivirUsuario(id) {
    const SQL = 'UPDATE "Usuario" SET "isActive" = TRUE WHERE usuario_id = $1';
    const resultado = await pool.query(SQL, [id]);
    return resultado.rowCount > 0;
}