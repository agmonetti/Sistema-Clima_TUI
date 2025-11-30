/**
 * Menu de mensajeria / chat
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { MensajeriaService } from '../../services/mensajeria.service.js';
import * as UsuarioRepository from '../../repositories/postgres/usuario.repository.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarSeparador } from '../utils/helpers.js';
import { crearTablaConversaciones } from '../utils/tablas.js';
import { ICONOS, TITULO } from '../utils/colores.js';

/**
 * Menu principal de mensajeria
 */
export async function menuMensajeria() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.mensaje}  MENSAJERIA\n`));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opcion:',
                choices: [
                    new inquirer.Separator(),
                    { name: `← Volver al menu principal`, value: 'volver' },
                    new inquirer.Separator(),
                    { name: `- Ver mis conversaciones`, value: 'listar' },
                    { name: `- Iniciar chat privado`, value: 'privado' },
                    { name: `- Crear grupo`, value: 'grupo' },
                    { name: `- Ver mensajes de una conversacion`, value: 'ver' },
                    { name: `- Enviar mensaje`, value: 'enviar' },
                    
                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'listar':
                await listarConversaciones();
                break;
            case 'privado':
                await iniciarChatPrivado();
                break;
            case 'grupo':
                await crearGrupo();
                break;
            case 'ver':
                await verMensajes();
                break;
            case 'enviar':
                await enviarMensaje();
                break;
        }
    }
}

/**
 * Listar conversaciones del usuario
 */
async function listarConversaciones() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.mensaje} MIS CONVERSACIONES\n`));

    const spinner = ora('Cargando conversaciones...').start();

    try {
        const usuario = session.getUser();
        const conversaciones = await MensajeriaService.listarChats(usuario.id);
        
        if (!conversaciones || conversaciones.length === 0) {
            spinner.fail('No tienes conversaciones');
        } else {
            spinner.succeed(`${conversaciones.length} conversaciones`);
            console.log('\n' + crearTablaConversaciones(conversaciones));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar conversaciones');
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Iniciar un chat privado con otro usuario
 */
async function iniciarChatPrivado() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.usuario} INICIAR CHAT PRIVADO\n`));
    console.log((chalk.dim(`\n ↑ Para desplazarse ↓ \n`)));
    const spinner = ora('Cargando usuarios...').start();

    try {
        const usuarios = await UsuarioRepository.obtenerTodos();
        const miId = session.getUserId();
        
        // Filtrar el usuario actual
        const otrosUsuarios = usuarios.filter(u => u.usuario_id !== miId && u.isActive);
        
        if (otrosUsuarios.length === 0) {
            spinner.fail('No hay otros usuarios disponibles');
            await pausar();
            return;
        }
        
        spinner.succeed(`${otrosUsuarios.length} usuarios disponibles`);

        const { otroUsuarioId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'otroUsuarioId',
                message: 'Selecciona un usuario:',
                pageSize: 10,
                choices: [
                    new inquirer.Separator(),
                    {name:'Volver al menu anterior' , value:'volver'},
                    new inquirer.Separator(),
                    ...otrosUsuarios.map(u => ({
                    name: `${u.nombre} (${u.mail}) - ${u.rol}`,
                    value: u.usuario_id
                    })),
                ]
            }
        ]);
        if (otroUsuarioId === 'volver') return;

        const spinnerChat = ora('Iniciando chat...').start();
        const conversacion = await MensajeriaService.iniciarChatPrivado(miId, otroUsuarioId);
        
        spinnerChat.succeed('Chat iniciado exitosamente');
        mostrarExito(`ID de conversacion: ${conversacion._id}`);
        
        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Crear un grupo de chat
 */
async function crearGrupo() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.mensaje} CREAR GRUPO\n`));

    const spinner = ora('Cargando usuarios...').start();

    try {
        const usuarios = await UsuarioRepository.obtenerTodos();
        const miId = session.getUserId();

        
        // Filtrar el usuario actual
        const otrosUsuarios = usuarios.filter(u => u.usuario_id !== miId && u.isActive);
        
        if (otrosUsuarios.length < 2) {
            spinner.fail('Se necesitan al menos 2 usuarios adicionales para crear un grupo');
            await pausar();
            return;
        }
        
        spinner.succeed(`${otrosUsuarios.length} usuarios disponibles`);
            console.log('\n')
    console.log((chalk.dim(`\n Como la idea es crear un grupo se debe:
    - Seleccionar al menos 2 usuarios con "ESPACIO"
    - Luego presionar "ENTER" para continuar
    
    En caso de que se quiera regresar:
    - Seleccionar la opcion "Volver al menu anterior" con "ESPACIO"
    - Luego presionar "ENTER" para volver       
        \n`)));
        const { participantes } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'participantes',
                message: 'Selecciona los participantes (minimo 2):',
                loop: false, 
                pageSize: 12,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al manu anterior', value: 'volver' },
                    new inquirer.Separator(),
                    ...otrosUsuarios.map(u => ({
                        name: `${u.nombre} (${u.mail})`,
                        value: u.usuario_id
                    }))
                ],
                validate: (input) => {
                    // Si eligio volver (aunque haya seleccionado otros), dejamos pasar
                    if (input.includes('volver')) return true;
                    if (input.length < 2) return 'Debes seleccionar al menos 2 participantes con ESPACIO';
                    return true;
                }
            }
        ]);

        
        if (participantes.includes('volver')) return;

        const { nombreGrupo } = await inquirer.prompt([
            {
                type: 'input',
                name: 'nombreGrupo',
                message: 'Nombre del grupo:',
                validate: (input) => input ? true : 'El nombre es requerido'
            }
        ]);

        const spinnerGrupo = ora('Creando grupo...').start();
        const grupo = await MensajeriaService.crearGrupo(miId, participantes, nombreGrupo);
        
        spinnerGrupo.succeed('Grupo creado exitosamente');
        mostrarExito(`ID del grupo: ${grupo._id}`);
        
        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Ver mensajes de una conversacion
 */
async function verMensajes() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.info} VER MENSAJES\n`));

    const spinner = ora('Cargando conversaciones...').start();

    try {
        const usuario = session.getUser();
        const conversaciones = await MensajeriaService.listarChats(usuario.id);
        const todosLosUsuarios = await UsuarioRepository.obtenerTodos();
        
        if (!conversaciones || conversaciones.length === 0) {
            spinner.fail('No tienes conversaciones');
            await pausar();
            return;
        }
        
        spinner.succeed(`${conversaciones.length} conversaciones`);

        const { conversacionId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'conversacionId',
                message: 'Selecciona una conversacion:',
                loop: false,
                pageSize: 12,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al menu anterior', value: 'volver' },
                    new inquirer.Separator(),
                    new inquirer.Separator('── Chats ──'),
                    ...conversaciones.map(c => {
                        let etiqueta = '';
                        
                        if (c.esGrupal) {
                            etiqueta = `👥 Grupo: ${c.nombre}`;
                        } else {
                            const otroId = c.miembros.find(m => m.toString() !== usuario.id.toString());
                            const datosOtro = todosLosUsuarios.find(u => u.usuario_id.toString() === otroId?.toString());
                            const nombreOtro = datosOtro ? datosOtro.nombre : `Usuario ${otroId}`;
                            etiqueta = `👤 ${nombreOtro}`;
                        }

                        return {
                            name: etiqueta,
                            value: c._id.toString()
                        };
                    })
                ]
            }
        ]);

        if (conversacionId === 'volver') return;

        const spinnerMsg = ora('Cargando mensajes...').start();
        const mensajes = await MensajeriaService.verHistorial(conversacionId);
        
        if (!mensajes || mensajes.length === 0) {
            spinnerMsg.fail('No hay mensajes en esta conversacion');
        } else {
            spinnerMsg.succeed(`${mensajes.length} mensajes`);
            console.log('\n');
            mostrarSeparador();
            
            mensajes.forEach(msg => {
                const esPropio = msg.emisor_id?.toString() === usuario.id?.toString();
                const fecha = new Date(msg.timestamp).toLocaleString();
                
                // Buscamos el nombre del emisor tambien para el historial
                const datosEmisor = todosLosUsuarios.find(u => u.usuario_id.toString() === msg.emisor_id.toString());
                const nombreEmisor = datosEmisor ? datosEmisor.nombre : `ID ${msg.emisor_id}`;

                const prefijo = esPropio ? chalk.green('Tu') : chalk.cyan(nombreEmisor);
                
                console.log(`${chalk.dim(fecha)} - ${prefijo}:`);
                console.log(`  ${msg.texto}\n`);
            });
            
            mostrarSeparador();
        }

        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Enviar mensaje a una conversacion
 */
async function enviarMensaje() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.exito} ENVIAR MENSAJE\n`));

    const spinner = ora('Cargando conversaciones...').start();

    try {
        const usuario = session.getUser();
        const conversaciones = await MensajeriaService.listarChats(usuario.id);
        const todosLosUsuarios = await UsuarioRepository.obtenerTodos();
        if (!conversaciones || conversaciones.length === 0) {
            spinner.fail('No tienes conversaciones. Inicia un chat primero.');
            await pausar();
            return;
        }
        
        spinner.succeed(`${conversaciones.length} conversaciones`);

        const { conversacionId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'conversacionId',
                message: 'Seleccionar una conversacion:',
                pageSize: 10,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al menu anterior', value: 'volver' },
                    new inquirer.Separator(),
                    new inquirer.Separator('── Chats ──'),
                    ...conversaciones.map(c => {
                        let etiqueta = '';
                        if (c.esGrupal) {
                            etiqueta = `👥 Grupo: ${c.nombre}`;
                        } else {
                            const otroId = c.miembros.find(m => m.toString() !== usuario.id.toString());
                            const datosOtro = todosLosUsuarios.find(u => u.usuario_id.toString() === otroId?.toString());
                            const nombreOtro = datosOtro ? datosOtro.nombre : `Usuario ${otroId}`;
                            etiqueta = `👤 ${nombreOtro}`;
                        }
                        return {
                            name: etiqueta,
                            value: c._id.toString()
                        };
                    })
                ]
            }
        ]);

        if (conversacionId === 'volver') return;

        
        const { texto } = await inquirer.prompt([
            {
                type: 'input',
                name: 'texto',
                message: 'Escribe tu mensaje (o escribe 0 para cancelar):',
                validate: (input) => {
                    if (input === '0') return true; 
                    if (!input || input.trim() === '') return 'El mensaje no puede estar vacio';
                    return true;
                }
            }
        ]);

        if (texto === '0') return; // Cancelamos envio

        const spinnerEnvio = ora('Enviando mensaje...').start();
        await MensajeriaService.enviarMensaje(conversacionId, usuario.id, texto);
        
        spinnerEnvio.succeed('Mensaje enviado');
        
        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}
/**
 * Funcion auxiliar para pausar
 */
async function pausar() {
    await inquirer.prompt([{
        type: 'input',
        name: 'pausa',
        message: chalk.dim('Presiona Enter para continuar...')
    }]);
}
