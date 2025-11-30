import inquirer from 'inquirer';
import chalk from 'chalk';
import { session } from '../session.js';
import { limpiarPantalla, mostrarInfoUsuario, mostrarCaja } from '../utils/helpers.js';
import { ICONOS, TITULO } from '../utils/colores.js';
import { menuSensores } from './sensores.js';
import { menuMediciones } from './mediciones.js';
import { menuProcesos } from './procesos.js';
import { menuMensajeria } from './mensajeria.js';
import { menuUsuarios } from './usuarios.js';
import { menuTransacciones } from './transacciones.js';
import { mostrarEstadoSistema } from './pingBDs.js'; 
import { menuGestionTecnica} from './gestionProcesos.js';

export async function menuPrincipal() {
    const usuario = session.getUser();
    
    while (true) {
        limpiarPantalla();
        
        mostrarCaja(
            chalk.cyan.bold(`${ICONOS.menu} MENÚ PRINCIPAL`),
            { borderColor: 'cyan', padding: 1 }
        );
        
        mostrarInfoUsuario(usuario);
        
        const opciones = obtenerOpcionesPorRol(usuario.rol);
        
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: '¿Qué deseas hacer?',
                choices: opciones,
                pageSize: 14
            }
        ]);

        if (opcion === 'salir') {
            console.log(chalk.cyan(`\n ¡Hasta pronto, ${usuario.nombre}!\n`));
            process.exit(0);
        }

        if (opcion === 'cerrar_sesion') {
            session.logout();
            return; // Vuelve al loop principal que mostrará la pantalla de auth
        }



        // Ejecutar el submenú correspondiente
        await ejecutarOpcion(opcion);
    }
}

/**
 * Obtiene las opciones del menú según el rol del usuario
 */
function obtenerOpcionesPorRol(rol) {
    const opcionesBase = [
        new inquirer.Separator(),
        { name: `${ICONOS.proceso} Procesos`, value: 'procesos' },
        { name: `${ICONOS.mensaje} Mensajería`, value: 'mensajeria' },
        { name: `${ICONOS.dinero} Finanzas`, value: 'transacciones' },
    ];

    // Agregar opciones de administración solo para admin
    if (rol === 'admin') {
        opcionesBase.push(
            new inquirer.Separator(),
            new inquirer.Separator('Opciones de Admin '),
            { name: `${ICONOS.temperatura} Mediciones`, value: 'mediciones' },
            { name: `${ICONOS.usuario} Gestión de Usuarios`, value: 'usuarios' },
            {name: 'Estado sistema', value: 'estado_sistema'}
        );
    }

    if (rol === 'tecnico') {
        opcionesBase.push(
            new inquirer.Separator(),
            new inquirer.Separator('Opciones de Técnico '),
            { name: `${ICONOS.sensor} Sensores`, value: 'sensores' },
            { name: `${ICONOS.temperatura} Mediciones`, value: 'mediciones' },
            {name: 'Estado del Sistema', value: 'estado_sistema'},
            {name: 'Procesos Pendientes', value: 'gestion_pendientes'}
        );
    }

    // Opciones finales para todos
    console.log('\n')
    opcionesBase.push(
        new inquirer.Separator(chalk.dim('──────────')),
        { name: `${ICONOS.salir} Cerrar Sesión`, value: 'cerrar_sesion' },
        { name: `${ICONOS.error} Salir`, value: 'salir' }
    );

    return opcionesBase;
}

/**
 * Ejecuta la opción seleccionada
 */
async function ejecutarOpcion(opcion) {
    switch (opcion) {
        case 'sensores':
            await menuSensores();
            break;
        case 'mediciones':
            await menuMediciones();
            break;
        case 'procesos':
            await menuProcesos();
            break;
        case 'mensajeria':
            await menuMensajeria();
            break;
        case 'transacciones':
            await menuTransacciones();
            break;
        case 'usuarios':
            await menuUsuarios();
            break;
        case 'estado_sistema':
            await mostrarEstadoSistema();
            break;
        case 'gestion_pendientes':
            await menuGestionTecnica();
            break;
            
    }

}
