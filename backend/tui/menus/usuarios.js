/**
 * Menú de gestión de usuarios (solo admin)
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as UsuarioRepository from '../../repositories/postgres/usuario.repository.js';
import * as UsuarioService from '../../services/usuario.service.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarAdvertencia } from '../utils/helpers.js';
import { crearTablaUsuarios } from '../utils/tablas.js';
import { ICONOS, TITULO, colorearRol } from '../utils/colores.js';

/**
 * Menú principal de gestión de usuarios
 */
export async function menuUsuarios() {
    // Verificar que es admin
    if (!session.hasRole('admin')) {
        mostrarError('No tienes permisos para acceder a esta sección');
        await pausar();
        return;
    }

    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.usuario} GESTIÓN DE USUARIOS\n`));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                    { name: `- Ver todos los usuarios`, value: 'listar' },
                    { name: `- Buscar usuario por ID`, value: 'buscar' },
                    { name: `- Desactivar usuario`, value: 'desactivar' },
                    { name: `- Reactivar usuario`, value: 'reactivar' },
                    new inquirer.Separator(),
                    { name: `← Volver al menu principal`, value: 'volver' },
                    new inquirer.Separator()

                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'listar':
                await listarUsuarios();
                break;
            case 'buscar':
                await buscarUsuario();
                break;
            case 'desactivar':
                await desactivarUsuario();
                break;
            case 'reactivar':
                await reactivarUsuario();
                break;
        }
    }
}

/**
 * Lista todos los usuarios
 */
async function listarUsuarios() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.menu} LISTA DE USUARIOS\n`));

    const spinner = ora('Cargando usuarios...').start();

    try {
        const usuarios = await UsuarioService.obtenerTodos();
        
        if (!usuarios || usuarios.length === 0) {
            spinner.fail('No hay usuarios registrados');
        } else {
            spinner.succeed(`${usuarios.length} usuarios registrados`);
            console.log('\n' + crearTablaUsuarios(usuarios));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar usuarios');
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Busca un usuario por ID
 */
async function buscarUsuario() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.info} BUSCAR USUARIO\n`));

    const { userId } = await inquirer.prompt([
        {
            type: 'number',
            name: 'userId',
            message: 'ID del usuario:',
            validate: (input) => {
                if (isNaN(input) || input < 1) return 'Ingresa un ID válido';
                return true;
            }
        }
    ]);

    const spinner = ora('Buscando usuario...').start();

    try {
        const usuario = await UsuarioService.buscarPorId(userId);
        
        if (!usuario) {
            spinner.fail('Usuario no encontrado');
        } else {
            spinner.succeed('Usuario encontrado');
            console.log('\n');
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.bold('  📋 INFORMACION DEL USUARIO'));
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(`  ID:      ${usuario.usuario_id}`);
            console.log(`  Nombre:  ${usuario.nombre}`);
            console.log(`  Email:   ${usuario.mail}`);
            console.log(`  Rol:     ${colorearRol(usuario.rol)}`);
            console.log(`  Saldo:   $${usuario.saldoActual || 0}`);
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al buscar usuario');
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Desactiva un usuario
 */
async function desactivarUsuario() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.advertencia} DESACTIVAR USUARIO\n`));

    // Mostrar lista de usuarios activos
    const spinner = ora('Cargando usuarios activos...').start();

    try {
        const todosUsuarios = await UsuarioService.obtenerTodos();
        const usuariosActivos = todosUsuarios.filter(u => u.isActive && u.rol !== 'admin');
        
        if (usuariosActivos.length === 0) {
            spinner.fail('No hay usuarios activos para desactivar');
            await pausar();
            return;
        }
        
        spinner.succeed(`${usuariosActivos.length} usuarios activos`);

        const { userId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'userId',
                message: 'Selecciona el usuario a desactivar:',
                choices: usuariosActivos.map(u => ({
                    name: `${u.nombre} (${u.mail}) - ${colorearRol(u.rol)}`,
                    value: u.usuario_id
                })),
                pageSize: 10
            }
        ]);

        const usuarioSeleccionado = usuariosActivos.find(u => u.usuario_id === userId);
        
        console.log(chalk.yellow(`\n⚠️ Vas a desactivar: ${usuarioSeleccionado.nombre}`));

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Estás seguro?',
                default: false
            }
        ]);

        if (!confirmar) {
            mostrarInfo('Operación cancelada');
            await pausar();
            return;
        }

        const spinnerDelete = ora('Desactivando usuario...').start();
        await UsuarioService.borrarUsuario(userId);
        spinnerDelete.succeed('Usuario desactivado correctamente');
        
        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Reactiva un usuario desactivado
 */
async function reactivarUsuario() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.exito} REACTIVAR USUARIO\n`));

    const spinner = ora('Cargando usuarios inactivos...').start();

    try {
        const todosUsuarios = await UsuarioService.obtenerTodos();
        const usuariosInactivos = todosUsuarios.filter(u => !u.isActive);
        
        if (usuariosInactivos.length === 0) {
            spinner.fail('No hay usuarios inactivos para reactivar');
            await pausar();
            return;
        }
        
        spinner.succeed(`${usuariosInactivos.length} usuarios inactivos`);

        const { userId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'userId',
                message: 'Selecciona el usuario a reactivar:',
                choices: usuariosInactivos.map(u => ({
                    name: `${u.nombre} (${u.mail}) - ${colorearRol(u.rol)}`,
                    value: u.usuario_id
                })),
                pageSize: 10
            }
        ]);

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Confirmas la reactivación?',
                default: true
            }
        ]);

        if (!confirmar) {
            mostrarInfo('Operación cancelada');
            await pausar();
            return;
        }

        const spinnerReactivar = ora('Reactivando usuario...').start();
        await UsuarioService.revivirUsuario(userId);
        spinnerReactivar.succeed(' ✅ Usuario reactivado correctamente');
        
        await pausar();
    } catch (error) {
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
