import Table from 'cli-table3';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as ProcesoRepository from '../../repositories/mongo/proceso.repository.js';
import * as TransaccionService from '../../services/transaccion.service.js';
import * as MedicionRepository from '../../repositories/mongo/medicion.repository.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarCaja, formatearFecha } from '../utils/helpers.js';
import { crearTablaProcesos, crearTablaHistorial } from '../utils/tablas.js';
import { ICONOS, TITULO, colorearSaldo, colorearTemperatura } from '../utils/colores.js';

/**
 * Menú principal de procesos
 */
export async function menuProcesos() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n 📜 PROCESOS Y SERVICIOS\n`));

        const usuario = session.getUser();
        console.log(chalk.dim(`Saldo actual: ${colorearSaldo(usuario.saldoActual)}\n`));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                     new inquirer.Separator(),
                    { name: `← Volver al menu principal`, value: 'volver' },
                    new inquirer.Separator(),
                    { name: `- Ver catálogo de procesos`, value: 'catalogo' },
                    { name: `- Solicitar proceso`, value: 'solicitar' },
                    { name: `- Ver mi historial`, value: 'historial' },
                    { name: `- Ver detalle de solicitud`, value: 'detalle' },
                   
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
                    {name:'← Volver al menu anterior' , value:'volver'},
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
const spinnerEjec = ora('Enviando solicitud...').start();

        const resultado = await TransaccionService.solicitarProceso({
            usuarioId: usuario.id,
            procesoId: procesoId,
            parametros: parametros
        });

        // 1. Caso pendiente
        if (resultado.status === 'pending') {
            spinnerEjec.info('Solicitud creada correctamente'); 
            
            // Actualizar saldo en sesión (porque ya se cobró)
            const nuevoSaldo = await TransaccionService.getSaldo(usuario.id);
            session.actualizarSaldo(nuevoSaldo);

            console.log('\n');
            mostrarCaja(
                chalk.yellow.bold('EN ESPERA DE APROBACIÓN\n\n') +
                `Ticket: #${resultado.ticket.solicitud_id}\n` +
                `Servicio: ${resultado.ticket.servicio}\n` +
                `Costo: $${resultado.ticket.costo}\n\n` +
                chalk.white('Tu solicitud fue enviada. Un tecnico la revisara pronto.\n') +
                chalk.dim('Puedes ver el estado en "Ver mi historial".'),
                { borderColor: 'yellow', padding: 1 }
            );
        } 
        // 2. Caso inmediato por cache
        else {
            spinnerEjec.succeed('Proceso ejecutado exitosamente');
            
            const nuevoSaldo = await TransaccionService.getSaldo(usuario.id);
            session.actualizarSaldo(nuevoSaldo);

            console.log('\n');
            mostrarCaja(
                chalk.green.bold('✓ RESULTADO DEL PROCESO\n\n') +
                `Ticket: #${resultado.ticket.solicitud_id}\n` +
                `Servicio: ${resultado.ticket.servicio}\n` +
                `Costo: $${resultado.ticket.costo}\n\n` +
                formatearResultado(resultado.data),
                { borderColor: 'green' }
            );
        }

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
   if (codigo === 'REPORTE_PERIODICO') {
        
        // 1. Ciudad
        const ciudades = await MedicionRepository.listarCiudades();
        if (ciudades.length === 0) {
            mostrarError('No hay ciudades registradas.');
            return null;
        }

        const resCiudad = await inquirer.prompt([
            {
                type: 'list',
                name: 'ciudad',
                message: 'Seleccionar la Ciudad:',
                loop: false,
                pageSize: 10,
                choices: [
                    new inquirer.Separator(),
                    { name: 'Volver al menu anterior', value: 'volver' },
                     new inquirer.Separator(),
                     ...ciudades
                    ]
            }
        ]);
        if (resCiudad.ciudad === 'volver') return null;

        // 2. Tipo de Reporte (Anual vs Mensual)
        const { tipoReporte } = await inquirer.prompt([
            {
                type: 'list',
                name: 'tipoReporte',
                message: '¿Que tipo de proceso periodico queres?',
                choices: [
                    { name: 'Mensual', value: 'mensual' },
                    { name: 'Anual', value: 'anual' }
                ]
            }
        ]);

        let mesEspecifico = null; // null significa "Todos los meses"

        if (tipoReporte === 'mensual') {
            const { alcance } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'alcance',
                    message: '¿Que meses queres analizar?',
                    choices: [
                        { name: 'Todos los meses del año', value: 'todos' },
                        { name: 'Mes especifico', value: 'especifico' }
                    ]
                }
            ]);

            if (alcance === 'especifico') {
                const { mesIndex } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'mesIndex', // Guardamos el número (1-12)
                        message: 'Selecciona el mes:',
                        loop: false,
                        pageSize: 20,
                        choices: [
                            new inquirer.Separator(),
                            {name: 'Volver al menu anterior', value: 'volver'},
                            new inquirer.Separator(),

                            { name: 'Enero', value: 1 }, 
                            { name: 'Febrero', value: 2 },
                            { name: 'Marzo', value: 3 },
                            { name: 'Abril', value: 4 },
                            { name: 'Mayo', value: 5 }, 
                            { name: 'Junio', value: 6 },
                            { name: 'Julio', value: 7 },
                            { name: 'Agosto', value: 8 },
                            { name: 'Septiembre', value: 9 },
                            { name: 'Octubre', value: 10 },
                            { name: 'Noviembre', value: 11 },
                            { name: 'Diciembre', value: 12 }
                        ]
                    }
                ]);
                mesEspecifico = mesIndex;
            }
        }

        // 4. Año
        const { anio } = await inquirer.prompt([
            {
                type: 'input',
                name: 'anio',
                message: 'Ingresa el Año (YYYY) o escribir 0 para volver:',
                default: new Date().getFullYear(),
                validate: (input) => {
                    if (input == '0') return true; 
                    return /^(20\d{2})$/.test(input) ? true : 'Año fuera del rango (2000-2099)';
                }
            }
        ]);

        if (anio === '0') return null;
    
        let nombreDisplay = `Reporte ${tipoReporte.toUpperCase()} - ${resCiudad.ciudad} (${anio})`;
        if (mesEspecifico) {
            const nombresMeses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            nombreDisplay += ` [${nombresMeses[mesEspecifico]}]`;
        }

        return {
            esReportePeriodico: true,
            ciudad: resCiudad.ciudad,
            anio: Number(anio),
            tipoReporte,
            mes: mesEspecifico, // (null o 1-12)
            sensorNombre: nombreDisplay
        };
    }
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
                },
                {
                    type: 'list',
                    name: 'variable',
                    message: 'Variable a analizar:',
                    choices: [
                        { name: 'Temperatura', value: 'temperatura' },
                        { name: 'Humedad', value: 'humedad' },
                        { name: 'Temperatura/Humedad', value: 'ambas'}
                            ],
                        loop: false
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

        output += chalk.cyan.bold('PARÁMETROS UTILIZADOS:\n');
        output += chalk.cyan('─────────────────────────────────────\n');
        output += `   \nSensor: ${chalk.white(m.sensorNombre || m.sensorId)}\n`;
        if (m.variable) output += `Variable: ${chalk.yellow(m.variable.toUpperCase())}\n`;
        if (m.fechaInicio) output += `Rango:  ${fInicio} al ${fFin}\n`;
        if (m.umbral) output += `Umbral: ${m.umbral}\n`;
        if (m.origen) output += `Fuente: ${m.origen}\n`; // Si usas caché
        
        output += chalk.dim('─────────────────────────────────────\n');
        output += chalk.cyan.bold('\nRESULTADOS:\n');
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

    return output  + metricas;
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
    console.log(TITULO(`\n ${ICONOS.cuenta} DETALLE DEL PROCESO\n`));
    console.log('Los TECNICOS tienen acceso a todas las solicitudes\n');
    
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
        const usuarioActual = session.getUser();
        // 2. Buscar datos
        const solicitud = await TransaccionService.obtenerDetalleSolicitud(solicitudId, usuarioActual);

        if (!solicitud) {
            spinner.fail('Solicitud no encontrada');
            await pausar();
            return;
        }

        spinner.succeed('Solicitud encontrada');
        console.log('\n');

        // 3. Mostrar cabecera
        const estadoColor = solicitud.isCompleted ? chalk.green('COMPLETADO') : chalk.yellow('PENDIENTE');
        console.log(`${chalk.cyan.bold('DETALLES DE LA SOLICITUD:')}`);
        console.log(chalk.cyan('─────────────────────────────────────\n'));
        console.log(` ID Solicitud:  ${chalk.bold(solicitud.solicitud_id)}`);
        console.log(` Cliente:       ${chalk.bold(solicitud.usuario_nombre)} - Mail: (${solicitud.usuario_mail})`);
        console.log(` Servicio:      ${chalk.bold(solicitud.nombre_proceso || 'N/A')}`); 
        console.log(` Fecha:         ${formatearFecha(solicitud.fechaSolicitud)}`);
        console.log(` Estado:        ${estadoColor}`);
        if(solicitud.factura_id) console.log(` Ticket:        #${solicitud.factura_id}`);
        console.log(chalk.dim('\n─────────────────────────────────────\n'));

        
        if (solicitud.resultado) {
            
            // 1. parametros
            if (solicitud.resultado._metadatos) {
                console.log(formatearResultado({ _metadatos: solicitud.resultado._metadatos }));
                // limpieza parametros
                delete solicitud.resultado._metadatos;
            }

            // 2. datos reales para mostrar
            let datosParaMostrar = solicitud.resultado;
            
            if (solicitud.resultado.datos && solicitud.resultado._esArrayOriginalmente) {
                datosParaMostrar = solicitud.resultado.datos;
            }

            // 3. si es u array de datos mostramos una tabla
            if (Array.isArray(datosParaMostrar) && datosParaMostrar.length > 0) {
                const columnas = Object.keys(datosParaMostrar[0]);
                
                const table = new Table({
                    head: columnas.map(c => chalk.cyan(c.toUpperCase())),
                    wordWrap: true
                });

                datosParaMostrar.forEach(fila => {
                    // Mapeamos los valores a un array simple para la tabla
                    table.push(Object.values(fila).map(val => val === null ? '-' : val));
                });

                console.log(table.toString());
                console.log(`\n Se encontraron ${chalk.bold(datosParaMostrar.length)} registros.`);

            } else {
                console.log(formatearResultado(datosParaMostrar));
            }

        } else {
            console.log(chalk.dim('No hay resultados para esta solicitud.'));
        }

        await pausar();

    } catch (error) {
        spinner.fail('Error al obtener detalle');
        mostrarError(error.message);
        await pausar();
    }
}