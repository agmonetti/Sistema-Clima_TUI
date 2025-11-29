/**
 * Menú de gestión de procesos
 * Catálogo, solicitud de procesos y historial
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as ProcesoRepository from '../../repositories/mongo/proceso.repository.js';
import * as TransaccionService from '../../services/transaccion.service.js';
import * as MedicionRepository from '../../repositories/mongo/medicion.repository.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarCaja } from '../utils/helpers.js';
import { crearTablaProcesos, crearTablaHistorial } from '../utils/tablas.js';
import { ICONOS, TITULO, colorearSaldo, colorearTemperatura } from '../utils/colores.js';

/**
 * Menú principal de procesos
 */
export async function menuProcesos() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n${ICONOS.proceso} PROCESOS Y SERVICIOS\n`));

        const usuario = session.getUser();
        console.log(chalk.dim(`Saldo actual: ${colorearSaldo(usuario.saldoActual)}\n`));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                    { name: `${ICONOS.menu} Ver catálogo de procesos`, value: 'catalogo' },
                    { name: `${ICONOS.proceso} Solicitar proceso`, value: 'solicitar' },
                    { name: `${ICONOS.info} Ver mi historial`, value: 'historial' },
                    { name: `${ICONOS.lupa || '🔍'} Ver detalle de solicitud`, value: 'detalle' },
                    new inquirer.Separator(),
                    { name: `${ICONOS.flecha} Volver al menú principal`, value: 'volver' }
                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'catalogo':
                await verCatalogo();
                break;
            case 'solicitar':
                await solicitarProceso();
                break;
            case 'historial':
                await verHistorial();
                break;
            case 'detalle':
                await verDetalleSolicitud();
                break;
        }
    }
}

/**
 * Ver catálogo de procesos disponibles
 */
async function verCatalogo() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.menu} CATÁLOGO DE PROCESOS\n`));

    const spinner = ora('Cargando catálogo...').start();

    try {
        const procesos = await ProcesoRepository.listarProcesos();
        
        if (procesos.length === 0) {
            spinner.fail('No hay procesos disponibles');
        } else {
            spinner.succeed(`${procesos.length} procesos disponibles`);
            console.log('\n' + crearTablaProcesos(procesos));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar catálogo');
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Solicitar un proceso
 */
async function solicitarProceso() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.proceso} SOLICITAR PROCESO\n`));

    const spinner = ora('Cargando procesos disponibles...').start();

    try {
        const procesos = await ProcesoRepository.listarProcesos();
        const sensores = await MedicionRepository.listarSensores();
        
        if (procesos.length === 0) {
            spinner.fail('No hay procesos disponibles');
            await pausar();
            return;
        }
        
        spinner.succeed('Procesos cargados');

        const usuario = session.getUser();
        console.log(chalk.dim(`\nTu saldo actual: ${colorearSaldo(usuario.saldoActual)}\n`));

        // Seleccionar proceso

    
        console.log((chalk.dim(` ↑ Para desplazarse ↓ \n`)));
        

        const { procesoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'procesoId',
                message: 'Selecciona el proceso a ejecutar:',
                pageSize: 10,
                loop: false,
                choices:[
                    new inquirer.Separator(),
                    {name:'Volver al menu anterior' , value:'volver'},
                    new inquirer.Separator(),
                    ...procesos.map((p, index) => ({
                        name: `${index + 1}. ${p.nombre} - $${p.costo} - ${p.descripcion || ''}`,
                        value: p._id.toString()
                    })),
                ]
            }
        ]);
        if (procesoId === 'volver') return;

        const procesoSeleccionado = procesos.find(p => p._id.toString() === procesoId);
        
        // Verificar saldo
        if (usuario.saldoActual < procesoSeleccionado.costo) {
            mostrarError(`Saldo insuficiente. Necesitas $${procesoSeleccionado.costo} y tienes $${usuario.saldoActual}`);
            await pausar();
            return;
        }

        // Obtener parámetros según el proceso
        const parametros = await obtenerParametrosProceso(procesoSeleccionado.codigo, sensores);
        
        
        if (!parametros) {
            mostrarInfo('Operación cancelada');
            await pausar();
            return;
        }

        // Confirmar ejecución
        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: `¿Confirmas ejecutar "${procesoSeleccionado.nombre}" por $${procesoSeleccionado.costo}?`,
                default: true
            }
        ]);

        if (!confirmar) {
            mostrarInfo('Operación cancelada');
            await pausar();
            return;
        }

        // Ejecutar proceso
        const spinnerEjec = ora('Ejecutando proceso...').start();

        const resultado = await TransaccionService.solicitarProceso({
            usuarioId: usuario.id,
            procesoId: procesoId,
            parametros: parametros
        });

        spinnerEjec.succeed('Proceso ejecutado exitosamente');

        // Actualizar saldo en sesión
        const nuevoSaldo = await TransaccionService.getSaldo(usuario.id);
        session.actualizarSaldo(nuevoSaldo);

        // Mostrar resultado
        console.log('\n');
        mostrarCaja(
            chalk.green.bold('✓ RESULTADO DEL PROCESO\n\n') +
            `Ticket: #${resultado.ticket.solicitud_id}\n` +
            `Servicio: ${resultado.ticket.servicio}\n` +
            `Costo: $${resultado.ticket.costo}\n\n` +
            formatearResultado(resultado.data),
            { borderColor: 'green' }
        );

        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}

/**
 * Obtiene los parámetros necesarios según el código del proceso
 */
async function obtenerParametrosProceso(codigo, sensores) {
    if (sensores.length === 0) {
        mostrarError('No hay sensores disponibles para procesar');
        return null;
    }

    const sensorChoices = sensores.map((s,index) => ({
        name: `${index + 1} - ${s.nombre} - ${s.ubicacion?.ciudad || 'N/A'}`,
        value: s._id.toString()
    }));

    let respuestas = {};

    // 1. Hacemos las preguntas según el caso
    switch (codigo) {
        case 'INFORME_MAXIMAS_MINIMAS':
        case 'INFORME_PROMEDIOS':
        case 'ANALISIS_DESVIACION':
            respuestas = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'sensorId',
                    message: 'Selecciona un sensor:',
                    loop: false,
                    choices: sensorChoices,
                    pageSize: 12
                },
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
            break;

        case 'CONSULTAR_DATOS':
        case 'CHECK_SALUD':
            respuestas = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'sensorId',
                    message: 'Selecciona un sensor:',
                    loop: false,
                    choices: sensorChoices,
                    pageSize: 12
                }
            ]);
            break;

        case 'BUSCAR_ALERTAS':
            respuestas = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'sensorId',
                    message: 'Selecciona un sensor:',
                    loop: false,
                    choices: sensorChoices,
                    pageSize: 12
                },
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
                },
                {
                    type: 'list',
                    name: 'variable',
                    message: 'Variable:',
                    choices: [
                        { name: 'Temperatura', value: 'temperatura' },
                        { name: 'Humedad', value: 'humedad' }
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
                    type: 'input',
                    name: 'umbral',
                    message: 'Valor umbral:',
                    validate: (input) => input && input.trim() !== '' ? true : 'No puede estar vacio'
                }
            ]);
            if (isNaN(respuestas.umbral)) {
                console.log(chalk.red('\nSolicitud cancelada.¡Debe ser un valor numerico!\n'));
                return null; 
            }
            
            break;

        default:
            respuestas = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'sensorId',
                    message: 'Selecciona un sensor:',
                    loop: false,
                    choices: sensorChoices,
                    pageSize: 12
                }
            ]);
    }

   if (respuestas.sensorId) {
        const sensorSeleccionado = sensores.find(s => s._id.toString() === respuestas.sensorId);
        if (sensorSeleccionado) {
            respuestas.sensorNombre = sensorSeleccionado.nombre; // Inyectamos el nombre
        }
    }

    return respuestas;
}


/**
 * Formatea el resultado del proceso para mostrar (con Metadatos)
 */
function formatearResultado(data) {
    if (!data) return 'Sin datos';
    
    let output = '';

    // 1. MOSTRAR METADATOS (Contexto de la solicitud)
    if (data._metadatos) {
        const m = data._metadatos;
        
        // Formatear fechas si existen
        const fInicio = m.fechaInicio ? new Date(m.fechaInicio).toLocaleDateString() : '-';
        const fFin = m.fechaFin ? new Date(m.fechaFin).toLocaleDateString() : '-';

        output += chalk.cyan.bold('📋 PARÁMETROS UTILIZADOS:\n');
        output += `   📡 Sensor: ${chalk.white(m.sensorNombre || m.sensorId)}\n`;
        if (m.fechaInicio) output += `   Rango:  ${fInicio} al ${fFin}\n`;
        if (m.umbral) output += `   🚨 Umbral: ${m.umbral}\n`;
        if (m.origen) output += `   Fuente: ${m.origen}\n`; // Si usas caché
        
        output += chalk.dim('─────────────────────────────────────\n');
    }

    // 2. PREPARAR DATOS (Limpiar metadatos para no mostrarlos dos veces)
    let datosPuros = data;
    // Si tiene metadatos o es un array envuelto, extraemos lo real
    if (data._metadatos || data._esArrayOriginalmente) {
        if (data._esArrayOriginalmente) {
            datosPuros = data.datos; // Es una lista (ej: Alertas)
        } else {
            // Es un objeto (ej: Promedios), hacemos copia y borramos claves internas
            datosPuros = { ...data };
            delete datosPuros._metadatos;
            delete datosPuros._esArrayOriginalmente;
        }
    }

    // 3. MOSTRAR RESULTADO
    if (Array.isArray(datosPuros)) {
        if (datosPuros.length === 0) return output + chalk.yellow('No se encontraron resultados.');
        // Si es una lista, mostramos resumen y tal vez una tabla pequeña
        return output + `Se encontraron ${chalk.bold(datosPuros.length)} registros.`;
    }
    
    // Si es objeto (clave-valor)
    const metricas = Object.entries(datosPuros)
        .map(([key, value]) => {
            if (key === '_id') return null; // Ignorar ID de mongo null
            
            // Formatear claves
            let label = key.replace(/([A-Z])/g, ' $1').trim(); // camelCase a Texto
            label = label.charAt(0).toUpperCase() + label.slice(1);

            // Formatear valores
            let valDisplay = value;
            if (typeof value === 'number') {
                valDisplay = value.toFixed(2);
                if (key.toLowerCase().includes('temp')) valDisplay = colorearTemperatura(valDisplay);
            }

            return `   ${label}: ${valDisplay}`;
        })
        .filter(Boolean) // Quitar nulos
        .join('\n');

    return output + chalk.bold('📊 RESULTADOS:\n') + metricas;
}

/**
 * Ver historial de procesos del usuario
 */
async function verHistorial() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.info} MI HISTORIAL DE PROCESOS\n`));

    const spinner = ora('Cargando historial...').start();

    try {
        const usuario = session.getUser();
        const historial = await TransaccionService.obtenerHistorial(usuario.id);
        
        if (!historial || historial.length === 0) {
            spinner.fail('No tienes procesos en tu historial');
        } else {
            spinner.succeed(`${historial.length} procesos en tu historial`);
            console.log('\n' + crearTablaHistorial(historial));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar historial');
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


async function verDetalleSolicitud() {
    limpiarPantalla();
    console.log(TITULO(`\n🔍 DETALLE DE SOLICITUD\n`));

    // CAMBIO 1: Usamos type 'input' para tener control total y evitar el NaN
    const { inputId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'inputId',
            message: 'Ingresa el ID de la solicitud (o escribe 0 para volver):',
            validate: (input) => {
                
                if (input === '0') return true;
                
                if (!/^\d+$/.test(input)) return 'Ingresar un numero valido';
                
                return true;
            }
        }
    ]);

    // CAMBIO 2: Lógica de salida
    if (inputId === '0') return;

    // Convertimos a número ahora que estamos seguros que es válido
    const solicitudId = parseInt(inputId);

    const spinner = ora(`Buscando solicitud #${solicitudId}...`).start();

    try {
        // 2. Buscar datos
        const solicitud = await TransaccionService.obtenerDetalleSolicitud(solicitudId);

        if (!solicitud) {
            spinner.fail('Solicitud no encontrada');
            await pausar();
            return;
        }

        spinner.succeed('Solicitud encontrada');
        console.log('\n');

        // 3. Mostrar cabecera
        const estadoColor = solicitud.isCompleted ? chalk.green('COMPLETADO') : chalk.yellow('PENDIENTE/FALLIDO');
        
        console.log(chalk.cyan('─────────────────────────────────────'));
        console.log(` 🎫 ID Solicitud:  ${chalk.bold(solicitud.solicitud_id)}`);
        console.log(` 📅 Fecha:         ${new Date(solicitud.fechaSolicitud).toLocaleString()}`);
        console.log(` 📊 Estado:        ${estadoColor}`);
        if(solicitud.factura_id) console.log(` 🧾 Factura:       #${solicitud.factura_id}`);
        console.log(chalk.cyan('─────────────────────────────────────\n'));

        // 4. Mostrar contenido (Resultado + Parametros)
        if (solicitud.resultado) {
            console.log(formatearResultado(solicitud.resultado));
        } else {
            console.log(chalk.dim('No hay resultados almacenados para esta solicitud.'));
        }

        await pausar();

    } catch (error) {
        spinner.fail('Error al obtener detalle');
        mostrarError(error.message);
        await pausar();
    }
}