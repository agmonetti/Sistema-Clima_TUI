import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Sensor from '../../models/mongo/Sensor.js';
import { session } from '../session.js';
import { limpiarPantalla, mostrarExito, mostrarError, mostrarInfo, mostrarSeparador } from '../utils/helpers.js';
import { crearTablaSensores } from '../utils/tablas.js';
import { ICONOS, TITULO } from '../utils/colores.js';

export async function menuSensores() {
    while (true) {
        limpiarPantalla();
        console.log(TITULO(`\n 🕹️  GESTION DE SENSORES\n`));

        const opciones = obtenerOpcionesSensores();

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Selecciona una opción:',
                choices: [
                new inquirer.Separator(),
                ...opciones
                ]
            }
        ]);

        if (opcion === 'volver') return;

        switch (opcion) {
            case 'listar':
                await listarSensores();
                break;
            case 'crear':
                await crearSensor();
                break;
            case 'buscar':
                await buscarSensor();
                break;
            case 'eliminar':
                await eliminarSensor();
                break;
        }
    }
}


function obtenerOpcionesSensores() {

    const opciones = [
        { name: `- Listar todos los sensores`, value: 'listar' },
        { name: `- Buscar sensor`, value: 'buscar' },
        { name: `- Crear nuevo sensor`, value: 'crear' },
        { name: `- Eliminar sensor`, value: 'eliminar' },
        new inquirer.Separator(),
        { name: `← Volver al menu principal`, value: 'volver' },
        new inquirer.Separator()
    ];


    return opciones;
}

async function listarSensores() {
    limpiarPantalla();
    const spinner = ora('Cargando sensores...').start();

    try {
        const sensores = await Sensor.find({}).lean();
        spinner.succeed(`Se encontraron ${sensores.length} sensores`);

        if (sensores.length === 0) {
            mostrarInfo('No hay sensores registrados');
        } else {
            console.log('\n' + crearTablaSensores(sensores));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error al cargar sensores');
        mostrarError(error.message);
        await pausar();
    }
}


async function crearSensor() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.exito} CREAR NUEVO SENSOR\n`));

    const datos = await inquirer.prompt([
        {
            type: 'input',
            name: 'nombre',
            message: 'Nombre del sensor o 0 para cancelar:',
            validate: (input) => input ? true : 'El nombre es requerido'
        
        },
        {
            type: 'list',
            name: 'tipo_sensor',
            message: 'Tipo de sensor:',
            choices: [
                { name: '- Temperatura', value: 'temperatura' },
                { name: '- Humedad', value: 'humedad' },
                { name: '- Temperatura/Humedad', value: 'temperatura/humedad' }
            ]
        },
        {
            type: 'input',
            name: 'pais',
            message: 'País:',
            validate: (input) => input ? true : 'El país es requerido'
        },
        {
            type: 'input',
            name: 'ciudad',
            message: 'Ciudad:',
            validate: (input) => input ? true : 'La ciudad es requerida'
        },
        {
            type: 'number',
            name: 'lat',
            message: 'Latitud:',
            validate: (input) => {
                if (isNaN(input)) return 'Debe ser un número';
                if (input < -90 || input > 90) return 'La latitud debe estar entre -90 y 90';
                return true;
            }
        },
        {
            type: 'number',
            name: 'lon',
            message: 'Longitud:',
            validate: (input) => {
                if (isNaN(input)) return 'Debe ser un número';
                if (input < -180 || input > 180) return 'La longitud debe estar entre -180 y 180';
                return true;
            }
        },
        {
            type: 'list',
            name: 'estado_sensor',
            message: 'Estado inicial:',
            choices: [
                { name: '🟢 Activo', value: 'activo' },
                { name: '🟡 Inactivo', value: 'inactivo' }
            ]
        }
    ]);

    const { confirmar } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmar',
            message: '¿Confirmas la creación del sensor?',
            default: true
        }
    ]);

    if (!confirmar) {
        mostrarInfo('Operación cancelada');
        await pausar();
        return;
    }

    const spinner = ora('Creando sensor...').start();

    try {
        const nuevoSensor = await Sensor.create({
            nombre: datos.nombre,
            configuracion: {
                tipo_sensor: datos.tipo_sensor,
                estado_sensor: datos.estado_sensor,
                fechaInicioMedicion: new Date()
            },
            ubicacion: {
                pais: datos.pais,
                ciudad: datos.ciudad,
                lat: datos.lat,
                lon: datos.lon
            }
        });

        spinner.succeed('Sensor creado exitosamente');
        mostrarExito(`ID del sensor: ${nuevoSensor._id}`);
        await pausar();
    } catch (error) {
        spinner.fail('Error al crear sensor');
        mostrarError(error.message);
        await pausar();
    }
}

async function buscarSensor() {
    limpiarPantalla();
    console.log(TITULO(`\n${ICONOS.info} BUSCAR SENSOR\n`));

    const { criterio, valor } = await inquirer.prompt([
        {
            type: 'list',
            name: 'criterio',
            message: 'Buscar por:',
            choices: [
                { name: 'Nombre', value: 'nombre' },
                { name: 'Ciudad', value: 'ciudad' },
                { name: 'ID', value: 'id' }
            ]
        },
        {
            type: 'input',
            name: 'valor',
            message: 'Valor a buscar:',
            validate: (input) => input ? true : 'El valor es requerido'
        }
    ]);

    const spinner = ora('Buscando...').start();

    try {
        let sensores;
        
        if (criterio === 'id') {
            const sensor = await Sensor.findById(valor).lean();
            sensores = sensor ? [sensor] : [];
        } else if (criterio === 'nombre') {
            sensores = await Sensor.find({ nombre: { $regex: valor, $options: 'i' } }).lean();
        } else {
            sensores = await Sensor.find({ 'ubicacion.ciudad': { $regex: valor, $options: 'i' } }).lean();
        }

        spinner.succeed(`Se encontraron ${sensores.length} resultado(s)`);

        if (sensores.length === 0) {
            mostrarInfo('No se encontraron sensores');
        } else {
            console.log('\n' + crearTablaSensores(sensores));
        }

        await pausar();
    } catch (error) {
        spinner.fail('Error en la búsqueda');
        mostrarError(error.message);
        await pausar();
    }
}


async function eliminarSensor() {
    limpiarPantalla();
    console.log(TITULO(`\nELIMINAR SENSOR\n`));

    const { sensorId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'sensorId',
            message: 'ID del sensor a eliminar o 0 para cancelar:',
            validate: (input) => input ? true : 'El ID es requerido'
        }
    ]);

    if (sensorId === '0') return;

    const spinner = ora('Verificando sensor...').start();

    try {
        const sensor = await Sensor.findById(sensorId);
        
        if (!sensor) {
            spinner.fail('Sensor no encontrado');
            await pausar();
            return;
        }

        spinner.stop();
        console.log(chalk.yellow(`\n⚠️ Vas a eliminar: ${sensor.nombre} (${sensor.ubicacion.ciudad})`));

        const { confirmar } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmar',
                message: chalk.red('Escribe "ELIMINAR" para confirmar:'),
                validate: (input) => {
                    if (input === 'ELIMINAR') return true;
                    return 'Debes escribir ELIMINAR para confirmar';
                }
            }
        ]);

        const spinnerDelete = ora('Eliminando sensor...').start();
        await Sensor.findByIdAndDelete(sensorId);
        spinnerDelete.succeed('Sensor eliminado correctamente');
        await pausar();
    } catch (error) {
        mostrarError(error.message);
        await pausar();
    }
}


async function pausar() {
    await inquirer.prompt([{
        type: 'input',
        name: 'pausa',
        message: chalk.dim('Presiona Enter para continuar...')
    }]);
}
