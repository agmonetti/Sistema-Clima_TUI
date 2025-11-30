import chalk from 'chalk';

// Colores para estados
export const EXITO = chalk.green;
export const ERROR = chalk.red;
export const INFO = chalk.blue;
export const ADVERTENCIA = chalk.yellow;
export const TITULO = chalk.blue.bold;
export const SUBTITULO = chalk.cyan;
export const DESTACADO = chalk.magenta.bold;

// Iconos
export const ICONOS = {
    exito: '✓',
    proceso: '📜',
    error: '✗',
    advertencia: '⚠',
    cuenta: '🔍',
    info: 'ℹ',
    usuario: '👤',
    menu: '📋',
    flecha: '→',
    activo: '●',
    saldo: '💰',
    inactivo: '○',
    mensaje: '✉️'
};

// Funciones de ayuda para colorear según estado
export function colorearEstado(estado) {
    switch (estado?.toLowerCase()) {
        case 'activo':
            return EXITO(estado);
        case 'inactivo':
            return ADVERTENCIA(estado);
        case 'falla':
            return ERROR(estado);
        default:
            return estado;
    }
}

export function colorearTemperatura(temp) {
    if (temp === null || temp === undefined) return 'N/A';
    const numTemp = Number(temp);
    if (numTemp < 0) return chalk.blue.bold(`${numTemp}°C`);
    if (numTemp < 15) return chalk.cyan(`${numTemp}°C`);
    if (numTemp < 25) return chalk.green(`${numTemp}°C`);
    if (numTemp < 35) return chalk.yellow(`${numTemp}°C`);
    return chalk.red.bold(`${numTemp}°C`);
}

export function colorearRol(rol) {
    switch (rol?.toLowerCase()) {
        case 'admin':
            return chalk.red.bold(rol);
        case 'tecnico':
            return chalk.yellow(rol);
        case 'usuario':
            return chalk.green(rol);
        default:
            return rol;
    }
}

export function colorearSaldo(saldo) {
    if (saldo === null || saldo === undefined) return 'N/A';
    const numSaldo = Number(saldo);
    if (numSaldo < 0) return chalk.red(`$${numSaldo}`);
    if (numSaldo === 0) return chalk.yellow(`$${numSaldo}`);
    return chalk.green(`$${numSaldo}`);
}
