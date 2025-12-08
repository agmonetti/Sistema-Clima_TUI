import 'dotenv/config';
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';
import boxen from 'boxen';
import { connectMongo } from '../config/mongo.js';
import { connectPostgres } from '../config/postgres.js';
import { connectRedis } from '../config/redis.js';
import { pantallaAuth } from './auth.js';
import { menuPrincipal } from './menus/principal.js';
import { session } from './session.js';
import mongoose from 'mongoose';
import pool from '../config/postgres.js';
import redisClient from '../config/redis.js';

const variablesRequeridas = [
    'PG_HOST', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE',
    'MONGO_HOST', 'MONGO_USER', 'MONGO_PASSWORD',
    'REDIS_HOST',
    'JWT_SECRET'
];

const faltantes = variablesRequeridas.filter(key => !process.env[key]);

if (faltantes.length > 0) {
    console.error('Faltan variables de entorno requeridas:');
    console.error(faltantes.map(f => `   - ${f}`).join('\n'));
    process.exit(1);
}

function mostrarBanner() {
    clear();
    
    console.log(
        chalk.cyan(
            figlet.textSync('CLIMA TUI', {
                font: 'Standard',
                horizontalLayout: 'default',
                verticalLayout: 'default'
            })
        )
    );
    
    console.log(
        boxen(
            chalk.white.bold('🌤️  Sistema de Monitoreo del clima\n') +
            chalk.dim('Interfaz de Terminal Interactiva (TUI)\n\n') +
            chalk.cyan('Versión: 1.0.0'),
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                textAlignment: 'center'
            }
        )
    );
}

async function conectarBaseDatos() {
    console.log(chalk.dim('\nConectando a servicios...\n'));
    
    // MongoDB
    const spinnerMongo = ora('Conectando a MongoDB...').start();
    try {
        await connectMongo();
        spinnerMongo.succeed('MongoDB conectado');
    } catch (error) {
        spinnerMongo.fail(`MongoDB error: ${error.message}`);
        throw error;
    }
    
    // PostgreSQL
    const spinnerPostgres = ora('Conectando a PostgreSQL...').start();
    try {
        await connectPostgres();
        spinnerPostgres.succeed('PostgreSQL conectado');
    } catch (error) {
        spinnerPostgres.fail(`PostgreSQL error: ${error.message}`);
        throw error;
    }
    
    // Redis
    const spinnerRedis = ora('Conectando a Redis...').start();
    try {
        await connectRedis();
        spinnerRedis.succeed('Redis conectado');
    } catch (error) {
        spinnerRedis.fail(`Redis error: ${error.message}`);
        throw error;
    }
    
    console.log(chalk.green('\n✓ Todos los servicios conectados correctamente\n'));
}


async function main() {
    try {
        // Mostrar banner
        mostrarBanner();
        
        // Conectar a bases de datos
        await conectarBaseDatos();
        
        // Loop principal
        while (true) {
            // Si no hay sesion, mostrar pantalla de auth
            if (!session.estaLogueado()) {
                const loginExitoso = await pantallaAuth();
                
                if (!loginExitoso) {
                    continue; // Volver a mostrar auth
                }
            }
            
            // Si hay sesión, mostrar menú principal
            if (session.estaLogueado()) {
                await menuPrincipal();
            }
        }
        
    } catch (error) {
        console.error(chalk.red('\nError fatal:'), error.message);
        process.exit(1);
    }
}


async function cerrarServicios() {
    console.log('\n'); 
    const spinner = ora('Deteniendo aplicación').start();

    try {
        const promesasCierre = [];
        if (redisClient.isOpen) {
            promesasCierre.push(redisClient.quit());
        }
        promesasCierre.push(mongoose.disconnect());
        promesasCierre.push(pool.end());
        await Promise.all(promesasCierre);
        spinner.succeed('Servicios desconectados');
        process.exit(0);

    } catch (error) {
        spinner.fail('Error al detener la aplicación');
        console.error(error);
        process.exit(1);
    }
}

process.on('SIGINT', cerrarServicios);  // ctrl + c
process.on('SIGTERM', cerrarServicios); //  'docker stop'
main();
