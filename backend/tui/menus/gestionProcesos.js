import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as TransaccionService from '../../services/transaccion.service.js';
import { limpiarPantalla, mostrarExito, mostrarError, pausar } from '../utils/helpers.js';
import { ICONOS, TITULO } from '../utils/colores.js';

export async function menuGestionTecnica() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.proceso} GESTIÓN DE SOLICITUDES PENDIENTES\n`));

        const spinner = ora('Buscando trabajo pendiente...').start();
        
        try {
            const pendientes = await TransaccionService.listarPendientesParaTecnico();
            spinner.stop();

            if (pendientes.length === 0) {
                console.log(chalk.green('No hay solicitudes pendientes!'));
                await pausar();
                return;
            }

            // Mostrar lista para aprobar
            const { solicitudId } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'solicitudId',
                    message: `Hay ${pendientes.length} solicitudes esperando. Seleccionar una para EJECUTAR:`,
                    pageSize: 25,
                    loop: false,
                    choices: [
                        new inquirer.Separator(),
                        { name: 'Volver al menu principal', value: 'volver' },
                        new inquirer.Separator(),
                        new inquirer.Separator('Cola de Procesos'),
                        new inquirer.Separator(),
                        ...pendientes.map(p => {
                            let iconoComplejidad = '⚪';
                            if (p.complejidad === 'BAJA') iconoComplejidad = '🟢'; // Rápido
                            if (p.complejidad === 'MEDIA') iconoComplejidad = '🟡'; // Normal
                            if (p.complejidad === 'ALTA') iconoComplejidad = '🔴'; // Lento/Pesado    

                            return {
                                name: `${iconoComplejidad} [${p.complejidad}] Ticket #${p.solicitud_id} | ${p.nombre_proceso} | Cliente: ${p.usuario_nombre}`,
                                value: p.solicitud_id
                            };
                        })
                    ]
                }
            ]);

            if (solicitudId === 'volver') return;

            // Confirmar ejecución
            const seleccionado = pendientes.find(p => p.solicitud_id === solicitudId);
            console.log(chalk.yellow(`\nVas a ejecutar el proceso: ${seleccionado.nombre_proceso}`));
            console.log(chalk.dim(`Cliente: ${seleccionado.usuario_nombre} - Email: (${seleccionado.usuario_mail})`));

            const { confirmar } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirmar',
                message: '¿Aprobar y Ejecutar ahora?',
                default: true
            }]);

            if (confirmar) {
                const spinnerEjec = ora('Procesando datos').start();
                await TransaccionService.aprobarEjecucion(solicitudId);
                spinnerEjec.succeed(`Solicitud #${solicitudId} completada exitosamente.`);
                await pausar(inquirer);
            }

        } catch (error) {
            spinner.fail('Error al gestionar solicitudes');
            mostrarError(error.message);
            await pausar(inquirer);
            return;
        }
    }
}