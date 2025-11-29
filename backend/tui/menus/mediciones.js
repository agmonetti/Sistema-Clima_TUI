/**
 * Menú de visualización de mediciones
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as MedicionRepository from '../../repositories/mongo/medicion.repository.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo } from '../utils/helpers.js';
import { crearTablaMediciones } from '../utils/tablas.js';
import { ICONOS, TITULO, colorearTemperatura } from '../utils/colores.js';

/**
 * Menú principal de mediciones
 */
export async function menuMediciones() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.temperatura} MEDICIONES\n`));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                    { name: `${ICONOS.menu} Ver últimas mediciones de un sensor`, value: 'ultimas' },
                    { name: `${ICONOS.info} Ver reporte de rango de fechas`, value: 'reporte' },
                    { name: `${ICONOS.advertencia} Buscar alertas`, value: 'alertas' },
                    new inquirer.Separator(),
                    { name: `${ICONOS.flecha} Volver al menú principal`, value: 'volver' }
                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'ultimas':
                await verUltimasMediciones();
                break;
            case 'reporte':
                await verReporteRango();
                break;
            case 'alertas':
                await buscarAlertas();
                break;
        }
    }
}

/**
 * Ver últimas mediciones de un sensor
 */
async function verUltimasMediciones() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.temperatura} ÚLTIMAS MEDICIONES\n`));

    // Primero listar sensores disponibles
    const spinnerSensores = ora('Cargando sensores...').start();
    
    try {
        const sensores = await MedicionRepository.listarSensores();
        
        if (sensores.length === 0) {
            spinnerSensores.fail('No hay sensores disponibles');
            await pausar();
            return;
        }
        
        spinnerSensores.succeed(`${sensores.length} sensores disponibles`);
        console.log((chalk.dim(`\n ↑ Para desplazarse ↓ \n`)));

        const { sensorId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'sensorId',
                message: 'Selecciona un sensor:',
                loop: false, 
                pageSize: 12, // opciones por pagina
                choices:
                    [
                    new inquirer.Separator(),
                    {name:'Volver al menu anterior' , value:'volver'},
                    new inquirer.Separator(),
                ...sensores.map((s, index) => ({ 
                    name: `${index + 1}. ${s.nombre} - ${s.ubicacion?.ciudad || 'N/A'}`,
                    value: s._id.toString()
                    })),

                ]
            }
        ]);
            if (sensorId === 'volver') return;   

            const { limite } = await inquirer.prompt([
            {
                type: 'number',
                name: 'limite',
                message: 'Cantidad de mediciones a mostrar:',
                default: 10,
                validate: (input) => {
                    if (input < 1) return 'Debe ser al menos 1';
                    if (input > 100) return 'Máximo 100';
                    return true;
                }
            }
        ]);
        

        const spinner = ora('Obteniendo mediciones...').start();
        const mediciones = await MedicionRepository.obtenerUltimasMediciones(sensorId, limite);
        
        if (mediciones.length === 0) {
            spinner.fail('No hay mediciones para este sensor');
        } else {
            spinner.succeed(`${mediciones.length} mediciones encontradas`);
            console.log('\n' + crearTablaMediciones(mediciones));
        }

        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Ver reporte de un rango de fechas
 */
async function verReporteRango() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.info} REPORTE POR RANGO DE FECHAS\n`));

    const spinnerSensores = ora('Cargando sensores...').start();

    try {
        const sensores = await MedicionRepository.listarSensores();
        
        if (sensores.length === 0) {
            spinnerSensores.fail('No hay sensores disponibles');
            await pausar();
            return;
        }
        
        spinnerSensores.succeed(`${sensores.length} sensores disponibles`);
        console.log((chalk.dim(`\n ↑ Para desplazarse ↓ \n`)));

        const { sensorId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'sensorId',
                message: 'Selecciona un sensor:',
                loop: false,
                pageSize: 12,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al menu anterior', value: 'volver' },
                    new inquirer.Separator(),
                    ...sensores.map((s, index) => ({
                        name: `${index + 1}. ${s.nombre} - ${s.ubicacion?.ciudad || 'N/A'}`,
                        value: s._id.toString()
                    }))
                ]
            }
        ]);

        if (sensorId === 'volver') return; 

        // Ahora pedimos las fechas
        const { fechaInicio, fechaFin } = await inquirer.prompt([
            {
                type: 'input',
                name: 'fechaInicio',
                message: 'Fecha inicio (YYYY-MM-DD):',
                default: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                validate: validarFecha
            },
            {
                type: 'input',
                name: 'fechaFin',
                message: 'Fecha fin (YYYY-MM-DD):',
                default: new Date().toISOString().split('T')[0],
                validate: validarFecha
            }
        ]);

        const spinner = ora('Generando reporte...').start();
        const reporte = await MedicionRepository.obtenerReporteRango(sensorId, fechaInicio, fechaFin);

        if (!reporte) {
            spinner.fail('No hay datos en el rango especificado');
        } else {
            spinner.succeed('Reporte generado');
            console.log('\n');
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.bold('  RESUMEN ESTADÍSTICO'));
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(`  Temperatura Máxima:   ${colorearTemperatura(reporte.tempMaxima?.toFixed(2))}`);
            console.log(`  Temperatura Mínima:   ${colorearTemperatura(reporte.tempMinima?.toFixed(2))}`);
            console.log(`  Temperatura Promedio: ${colorearTemperatura(reporte.tempPromedio?.toFixed(2))}`);
            console.log(`  Desviación Estándar:  ${reporte.stdDev?.toFixed(2) || 'N/A'}`);
            console.log(`  Total Mediciones:     ${reporte.cantMediciones}`);
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        }

        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Buscar alertas de temperatura
 */
async function buscarAlertas() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.advertencia} BUSCAR ALERTAS\n`));

    const spinnerSensores = ora('Cargando sensores...').start();

    try {
        const sensores = await MedicionRepository.listarSensores();
        
        if (sensores.length === 0) {
            spinnerSensores.fail('No hay sensores disponibles');
            await pausar();
            return;
        }
        
        spinnerSensores.succeed(`${sensores.length} sensores disponibles`);
         console.log((chalk.dim(`\n ↑ Para desplazarse ↓ \n`)));

        const { sensorId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'sensorId',
                message: 'Selecciona un sensor:',
                loop: false,
                pageSize: 12,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al menu anterior', value: 'volver' },
                    new inquirer.Separator(),
                    ...sensores.map((s, index) => ({
                        name: `${index + 1}. ${s.nombre} - ${s.ubicacion?.ciudad || 'N/A'}`,
                        value: s._id.toString()
                    }))
                ]
            }
        ]);

        if (sensorId === 'volver') return; 

        // Resto de preguntas 
        const { variable, operador, umbral } = await inquirer.prompt([
             {
                type: 'list',
                name: 'variable',
                message: 'Variable a monitorear:',
                choices: [
                    { name: '🌡️ Temperatura', value: 'temperatura' },
                    { name: '💧 Humedad', value: 'humedad' }
                ]
            },
            {
                type: 'list',
                name: 'operador',
                message: 'Condición:',
                choices: [
                    { name: 'Mayor que', value: 'mayor' },
                    { name: 'Menor que', value: 'menor' }
                ]
            },
            {
                type: 'number',
                name: 'umbral',
                message: 'Valor umbral:',
                validate: (input) => !isNaN(input) ? true : 'Debe ser un número'
            }
        ]);

        const spinner = ora('Buscando alertas...').start();
        const alertas = await MedicionRepository.buscarAlertas({
            sensorIds: sensorId,
            variable,
            operador,
            umbral,
            limite: 20
        });

        if (alertas.length === 0) {
            spinner.succeed('No se encontraron alertas');
            mostrarInfo('No hay mediciones que excedan el umbral especificado');
        } else {
            spinner.warn(`${alertas.length} alertas encontradas`);
            console.log('\n' + crearTablaMediciones(alertas));
        }

        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Valida formato de fecha
 */
function validarFecha(input) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(input)) return 'Formato inválido. Usa YYYY-MM-DD';
    const fecha = new Date(input);
    if (isNaN(fecha.getTime())) return 'Fecha inválida';
    return true;
}

/**
 * Función auxiliar para pausar
 */
async function pausar() {
    await inquirer.prompt([{
        type: 'input',
        name: 'pausa',
        message: chalk.dim('Presiona Enter para continuar...')
    }]);
}
