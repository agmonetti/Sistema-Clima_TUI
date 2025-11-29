import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { verificarSaludSistema } from '../../services/system.service.js';
import { limpiarPantalla, mostrarCaja, pausar } from '../utils/helpers.js';
import { ICONOS, TITULO } from '../utils/colores.js';

export async function mostrarEstadoSistema() {
    limpiarPantalla();
    console.log(TITULO(`\nMONITOR DE SALUD DEL SISTEMA\n`));

    const spinner = ora('Analizando sistemas...').start();

    try {
        const estado = await verificarSaludSistema();
        
        spinner.stop();

        // tabla
        const table = new Table({
            head: [chalk.cyan('Servicio'), chalk.cyan('Estado'), chalk.cyan('Latencia'), chalk.cyan('Detalle')],
            colWidths: [30, 15, 15, 30]
        });

        const procesarFila = (info) => {
            let statusColor;
            let latenciaColor = chalk.white(`${info.latency} ms`);
            let detalleTexto = '';

            if (info.status === 'ONLINE') {
                statusColor = chalk.green.bold('🟢 ONLINE');
                detalleTexto = chalk.green('Funcionando correctamente');
                // Colorear latencia si es alta
                if (info.latency > 100) latenciaColor = chalk.yellow(`${info.latency} ms`);
                if (info.latency > 500) latenciaColor = chalk.red(`${info.latency} ms`);


            } else if (info.status === 'OFFLINE') {
                statusColor = chalk.red.bold('🔴 OFFLINE');
                latenciaColor = chalk.dim('-');
                detalleTexto = chalk.red(info.error || 'Bases de datos caidas');
            }
            else {
                // Caso UNKNOWN (Defensivo)
                statusColor = chalk.yellow('🟡 UNKNOWN');
                latenciaColor = chalk.dim('-');
                detalleTexto = chalk.yellow('Verificando...');
            }
            return [
                chalk.bold(info.name),
                statusColor,
                latenciaColor,
                detalleTexto
            ];
        };

        table.push(procesarFila(estado.postgres));
        table.push(procesarFila(estado.mongo));
        table.push(procesarFila(estado.redis));

        // Mostrar resultado
        console.log(table.toString());

    } catch (error) {
        spinner.fail('Error crítico al ejecutar diagnóstico');
        console.error(error);
    }

    await pausar(inquirer);
}