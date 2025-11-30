import inquirer from 'inquirer';
import bcrypt from 'bcryptjs';
import chalk from 'chalk';
import ora from 'ora';
import { session } from './session.js';
import * as UsuarioRepository from '../repositories/postgres/usuario.repository.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarCaja, validarEmail } from './utils/helpers.js';
import { ICONOS, TITULO } from './utils/colores.js';


export async function pantallaAuth() {
    limpiarPantalla();
    
    mostrarCaja(
        chalk.cyan.bold('🔥 Sistema climatico 💧 '),
        { borderColor: 'cyan', padding: 1 }
    );
    
    const { opcion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'opcion',
            message: 'Selecciona una opción:',
            choices: [
                new inquirer.Separator(),
                { name: `Iniciar Sesión`, value: 'login' },
                { name: `Registrarse`, value: 'registro' },
                new inquirer.Separator(),
                { name: `Salir`, value: 'salir' }
            ]
        }
    ]);

    switch (opcion) {
        case 'login':
            return await login();
        case 'registro':
            return await registro();
        case 'salir':
            process.exit(0);
    }
}

/**
 * Proceso de login
 */
async function login() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.usuario} INICIAR SESIÓN\n`));

    const credenciales = await inquirer.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (input) => {
                if (!input) return 'El email es requerido';
                if (!validarEmail(input)) return 'Por favor ingresa un email válido';
                return true;
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Contraseña:',
            mask: '*',
            validate: (input) => input ? true : 'La contraseña es requerida'
        }
    ]);

    const spinner = ora('Verificando credenciales...').start();

    try {
        // Buscar usuario por email
        const usuario = await UsuarioRepository.buscarPorEmail(credenciales.email);
        
        if (!usuario) {
            spinner.fail('Usuario no encontrado');
            await pausar();
            return await pantallaAuth();
        }

        if (!usuario.isActive) {
            spinner.fail('Esta cuenta ha sido desactivada');
            await pausar();
            return await pantallaAuth();
        }

        // Verificar contraseña con bcrypt
        const passwordValido = await bcrypt.compare(credenciales.password, usuario.contraseña);
        
        if (!passwordValido) {
            spinner.fail('Contraseña incorrecta');
            await pausar();
            return await pantallaAuth();
        }

        // Login exitoso - guardar en sesión
        const usuarioCompleto = await UsuarioRepository.buscarPorId(usuario.usuario_id);
        session.login(usuarioCompleto);
        
        spinner.succeed(`¡Bienvenido, ${usuario.nombre}!`);
        
        return true; // Indica que el login fue exitoso
        
    } catch (error) {
        spinner.fail('Error al iniciar sesión');
        mostrarError(error.message);
        await pausar();
        return await pantallaAuth();
    }
}

/**
 * Proceso de registro
 */
async function registro() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.exito} REGISTRO DE USUARIO\n`));

    const datos = await inquirer.prompt([
        {
            type: 'input',
            name: 'nombre',
            message: 'Nombre completo:',
            validate: (input) => {
                if (!input) return 'El nombre es requerido';
                if (input.length < 2) return 'El nombre debe tener al menos 2 caracteres';
                return true;
            }
        },
        {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (input) => {
                if (!input) return 'El email es requerido';
                if (!validarEmail(input)) return 'Por favor ingresa un email válido';
                return true;
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Contraseña:',
            mask: '*',
            validate: (input) => {
                if (!input) return 'La contraseña es requerida';
                if (input.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
                return true;
            }
        },
        {
            type: 'password',
            name: 'confirmarPassword',
            message: 'Confirmar contraseña:',
            mask: '*',
            validate: (input, answers) => {
                if (!input) return 'Debes confirmar la contraseña';
                if (input !== answers.password) return 'Las contraseñas no coinciden';
                return true;
            }
        }
    ]);

    const spinner = ora('Creando cuenta...').start();

    try {
        // Verificar si el email ya existe
        const existente = await UsuarioRepository.buscarPorEmail(datos.email);
        if (existente) {
            spinner.fail('Este email ya está registrado');
            await pausar();
            return await pantallaAuth();
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(datos.password, salt);

        // Crear usuario
        const nuevoId = await UsuarioRepository.crearUsuarios({
            nombre: datos.nombre,
            mail: datos.email,
            password: passwordHash,
            rol_descripcion: 'usuario' // Rol por defecto
        });

        spinner.succeed('¡Cuenta creada exitosamente!');
        mostrarExito(`Tu ID de usuario es: ${nuevoId}`);
        console.log(chalk.dim('Ahora puedes iniciar sesión con tus credenciales.\n'));
        
        await pausar();
        return await pantallaAuth();

    } catch (error) {
        spinner.fail('Error al crear la cuenta');
        mostrarError(error.message);
        await pausar();
        return await pantallaAuth();
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
