/**
 * Menú de cuenta corriente y facturación
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as TransaccionService from '../../services/transaccion.service.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarCaja } from '../utils/helpers.js';
import { crearTablaHistorial } from '../utils/tablas.js';
import { ICONOS, TITULO, colorearSaldo } from '../utils/colores.js';

/**
 * Menú principal de transacciones
 */
export async function menuTransacciones() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.cuenta} MI CUENTA\n`));

        const usuario = session.getUser();
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(`  ${ICONOS.usuario} Usuario: ${chalk.bold(usuario.nombre)}`);
        console.log(`  ${ICONOS.saldo} Saldo actual: ${colorearSaldo(usuario.saldoActual)}`);
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                     new inquirer.Separator(),
                    { name: `← Volver al menu principal`, value: 'volver' },
                    new inquirer.Separator(),
                    { name: `- Cargar dinero`, value: 'cargar' },
                   
                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'cargar':
                await cargarDinero();
                break;
        }
    }
}/**
 * Cargar dinero a la cuenta
 */
async function cargarDinero() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.exito} CARGAR DINERO\n`));

    const usuario = session.getUser();
    console.log(chalk.dim(`Saldo actual: ${colorearSaldo(usuario.saldoActual)}\n`));

    const { montoInput } = await inquirer.prompt([
        {
            type: 'input',
            name: 'montoInput',
            message: 'Ingresa el monto a cargar ($) o 0 para cancelar:',
            validate: (input) => input && input.trim() !== '' ? true : 'El monto es requerido'
        }
    ]);

    if (montoInput === '0') return;

    const monto = parseFloat(montoInput);

    if (isNaN(monto) || monto <= 0) {
        console.log(chalk.red(`\nError: "${montoInput}" no es un monto valido\n`));
        await pausar();
        return;
    }

     if (monto > 10000) {
        console.log(chalk.red('\nError: El monto excede el limite permitido por unica operacion.\n'));
        await pausar();
        return;
    }

    
    const { confirmar } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmar',
            message: `¿Confirmas la carga de ${colorearSaldo(monto)}?`,
            default: true
        }
    ]);

    if (!confirmar) {
        mostrarInfo('Operacion cancelada');
        await pausar();
        return;
    }

    const spinner = ora('Procesando recarga...').start();

    try {
        const nuevoSaldo = await TransaccionService.cargarDinero(usuario.id, monto);
        
        // Actualizar sesión
        session.actualizarSaldo(nuevoSaldo);
        
        spinner.succeed('Recarga exitosa');
        
        console.log('\n');
        mostrarCaja(
            `${ICONOS.exito} RECARGA COMPLETA\n\n` +
            `Monto cargado: ${chalk.green('$' + monto.toFixed(2))}\n` +
            `Nuevo saldo: ${colorearSaldo(nuevoSaldo)}`,
            { borderColor: 'green', padding: 1 }
        );

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar dinero');
        mostrarError(error.message);
        await pausar();
    }
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
