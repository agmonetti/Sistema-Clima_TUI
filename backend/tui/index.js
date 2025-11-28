#!/usr/bin/env node
/**
 * TUI (Text User Interface) - Interfaz de Terminal Interactiva
 * Sistema de Clima - Punto de entrada principal
 * 
 * NO es una API REST - Es una interfaz de consola interactiva
 */
import 'dotenv/config';
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';
import boxen from 'boxen';

// Importar conexiones a bases de datos
import { connectMongo } from '../config/mongo.js';
import { connectPostgres } from '../config/postgres.js';
import { connectRedis } from '../config/redis.js';

// Importar módulos TUI
import { pantallaAuth } from './auth.js';
import { menuPrincipal } from './menus/principal.js';
import { session } from './session.js';

/**
 * Muestra el banner ASCII de bienvenida
 */
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
            chalk.white.bold('🌤️  Sistema de Monitoreo Climático\n') +
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

/**
 * Conecta a todas las bases de datos con spinners de progreso
 */
async function conectarBaseDatos() {
    console.log(chalk.dim('\n📦 Conectando a servicios...\n'));
    
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

/**
 * Loop principal de la aplicación
 */
async function main() {
    try {
        // Mostrar banner
        mostrarBanner();
        
        // Conectar a bases de datos
        await conectarBaseDatos();
        
        // Loop principal
        while (true) {
            // Si no hay sesión, mostrar pantalla de auth
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
        console.error(chalk.red('\n❌ Error fatal:'), error.message);
        process.exit(1);
    }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
    process.exit(0);
});

process.on('SIGTERM', () => {
    process.exit(0);
});

// Iniciar la aplicación
main();
