/**
 * Funciones auxiliares para la TUI
 */
import chalk from 'chalk';
import boxen from 'boxen';
import clear from 'clear';
import { ICONOS, ERROR, EXITO, INFO, ADVERTENCIA } from './colores.js';

/**
 * Limpia la pantalla
 */
export function limpiarPantalla() {
    clear();
}

/**
 * Muestra un mensaje en una caja decorativa
 */
export function mostrarCaja(mensaje, opciones = {}) {
    const defaultOpciones = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
    };
    console.log(boxen(mensaje, { ...defaultOpciones, ...opciones }));
}

/**
 * Muestra un mensaje de éxito
 */
export function mostrarExito(mensaje) {
    console.log(EXITO(`${ICONOS.exito} ${mensaje}`));
}

/**
 * Muestra un mensaje de error
 */
export function mostrarError(mensaje) {
    console.log(ERROR(`${mensaje}`));
}

/**
 * Muestra un mensaje informativo
 */
export function mostrarInfo(mensaje) {
    console.log(INFO(`${ICONOS.info} ${mensaje}`));
}

/**
 * Muestra una advertencia
 */
export function mostrarAdvertencia(mensaje) {
    console.log(ADVERTENCIA(`${ICONOS.advertencia} ${mensaje}`));
}

/**
 * Pausa la ejecución hasta que el usuario presione Enter
 */
export async function pausar(inquirer) {
    await inquirer.prompt([{
        type: 'input',
        name: 'pausa',
        message: chalk.dim('Presiona Enter para continuar...')
    }]);
}

/**
 * Muestra un separador visual
 */
export function mostrarSeparador() {
    console.log(chalk.dim('─'.repeat(60)));
}

export function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    // Convertimos a objeto Date si es string
    const d = new Date(fecha);
    
    // Forzamos la zona horaria de Buenos Aires
    return d.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Valida un email
 */
export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncarTexto(texto, maxLength = 30) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
}

/**
 * Muestra información del usuario logueado
 */
export function mostrarInfoUsuario(usuario) {
    if (!usuario) return;
    
    const info = [
        `${ICONOS.usuario} Usuario: ${chalk.bold(usuario.nombre)}`,
        `${ICONOS.info} Rol: ${chalk.bold(usuario.rol)}`,
        `${ICONOS.saldo} Saldo: ${chalk.bold('$' + (usuario.saldoActual || 0))}`
    ].join('  |  ');
    
    console.log(chalk.dim('─'.repeat(70)));
    console.log(info);
    console.log(chalk.dim('─'.repeat(70)));
}
