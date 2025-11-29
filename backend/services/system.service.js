import pool from '../config/postgres.js';
import mongoose from 'mongoose';
import redisClient from '../config/redis.js';


export async function verificarSaludSistema() {

    let pgStatus = 'UNKNOWN';
    let pgLatency = 0;
    let pgError = null;
    const startPg = Date.now();

    try {
        await pool.query('SELECT 1');
        pgStatus = 'ONLINE';
        pgLatency = Date.now() - startPg;
    } catch (error) {
        pgStatus = 'OFFLINE';
        pgError = error.message;
    }

    let mongoStatus = 'UNKNOWN';
    let mongoLatency = 0;
    let mongoError = null;
    const startMongo = Date.now();

    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            mongoStatus = 'ONLINE';
            mongoLatency = Date.now() - startMongo;
        } else {
            throw new Error(`Mongoose desconectado (State: ${mongoose.connection.readyState})`);
        }
    } catch (error) {
        mongoStatus = 'OFFLINE';
        mongoError = error.message;
    }

    let redisStatus = 'UNKNOWN';
    let redisLatency = 0;
    let redisError = null;
    const startRedis = Date.now();

    try {
        await redisClient.ping(); 
        redisStatus = 'ONLINE';
        redisLatency = Date.now() - startRedis;
    } catch (error) {
        redisStatus = 'OFFLINE';
        redisError = error.message;
    }

    return {
        postgres: { 
            name: 'PostgreSQL (Transaccional)', 
            status: pgStatus, 
            latency: pgLatency, 
            error: pgError 
        },
        mongo: { 
            name: 'MongoDB (Documental)', 
            status: mongoStatus, 
            latency: mongoLatency, 
            error: mongoError 
        },
        redis: { 
            name: 'Redis (Caché)', 
            status: redisStatus, 
            latency: redisLatency, 
            error: redisError 
        }
    };
}