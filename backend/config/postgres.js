import pg from 'pg';

const { Pool } = pg;

// usamos las variables de entorno
const config = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  max: 10, // Máximo de conexiones simultáneas
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar una conexión inactiva
};

const pool = new Pool(config);

export const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    client.release(); 
  } catch (error) {
    process.exit(1);
  }
};

export default pool;