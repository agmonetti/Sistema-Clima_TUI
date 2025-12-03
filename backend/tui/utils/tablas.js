import Table from 'cli-table3';
import chalk from 'chalk';
import { colorearEstado, colorearTemperatura, colorearRol, colorearSaldo, TITULO } from './colores.js';
import { formatearFecha } from './helpers.js';

export function crearTablaSensores(sensores) {
    const table = new Table({
        head: [TITULO('ID'), TITULO('Nombre'), TITULO('Ciudad'), TITULO('País'), TITULO('Tipo'), TITULO('Estado')],
        colWidths: [26, 20, 15, 15, 18, 12]
    });

    sensores.forEach(sensor => {
        table.push([
            sensor._id?.toString() || 'N/A',
            sensor.nombre || 'N/A',
            sensor.ubicacion?.ciudad || 'N/A',
            sensor.ubicacion?.pais || 'N/A',
            sensor.configuracion?.tipo_sensor || 'N/A',
            colorearEstado(sensor.configuracion?.estado_sensor || 'N/A')
        ]);
    });

    return table.toString();
}


export function crearTablaMediciones(mediciones) {
    const table = new Table({
        head: [TITULO('ID'), TITULO('Sensor'), TITULO('Temperatura'), TITULO('Humedad'), TITULO('Fecha')],
        colWidths: [26, 20, 15, 12, 22]
    });

    mediciones.forEach(medicion => {
        const sensorNombre = medicion.sensor_id?.nombre || medicion.sensor_id?.toString()?.slice(-6) || 'N/A';
        table.push([
            medicion._id?.toString() || 'N/A',
            sensorNombre,
            colorearTemperatura(medicion.temperatura),
            medicion.humedad !== undefined ? `${medicion.humedad}%` : 'N/A',
            medicion.timestamp ? new Date(medicion.timestamp).toLocaleString() : 'N/A'
        ]);
    });

    return table.toString();
}


export function crearTablaUsuarios(usuarios) {
    const table = new Table({
        head: [TITULO('ID'), TITULO('Nombre'), TITULO('Email'), TITULO('Rol'), TITULO('Activo')],
        colWidths: [8, 20, 30, 12, 10]
    });

    usuarios.forEach(usuario => {
        table.push([
            usuario.usuario_id || 'N/A',
            usuario.nombre || 'N/A',
            usuario.mail || 'N/A',
            colorearRol(usuario.rol),
            usuario.isActive ? 'SI' : 'NO'
        ]);
    });

    return table.toString();
}


export function crearTablaProcesos(procesos) {
    const table = new Table({
        head: [TITULO('ID'), TITULO('Nombre'), TITULO('Código'), TITULO('Costo'), TITULO('Descripción')],
        colWidths: [26, 25, 25, 10, 35]
    });

    procesos.forEach(proceso => {
        table.push([
            proceso._id?.toString() || 'N/A',
            proceso.nombre || 'N/A',
            proceso.codigo || 'N/A',
            colorearSaldo(proceso.costo),
            (proceso.descripcion || 'N/A').substring(0, 32) + '...'
        ]);
    });

    return table.toString();
}

export function crearTablaHistorial(historial) {
    const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Fecha'), chalk.cyan('Estado'), chalk.cyan('Factura')],
        colWidths: [10, 25, 15, 15]
    });

    historial.forEach(h => {
        // Mapeo de datos de Postgres a la tabla
        // h.fechaSolicitud viene como objeto Date
        const fecha = formatearFecha(h.fechaSolicitud);
        const estado = h.isCompleted ? chalk.green('Completado') : chalk.yellow('Pendiente');
        const factura = h.factura_id ? `#${h.factura_id}` : 'N/A';

        table.push([
            h.solicitud_id,
            fecha,
            estado,
            factura
        ]);
    });

    return table.toString();
}

export function crearTablaConversaciones(conversaciones) {
    const table = new Table({
        head: [TITULO('ID'), TITULO('Tipo'), TITULO('Nombre/Participantes'), TITULO('Miembros')],
        colWidths: [26, 12, 40, 10]
    });

    conversaciones.forEach(conv => {
        table.push([
            conv._id?.toString() || 'N/A',
            conv.esGrupal ? 'Grupo' : 'Privado',
            conv.nombre || conv.miembros?.map(m => m.toString()).join(', ') || 'N/A',
            conv.miembros?.length || 0
        ]);
    });

    return table.toString();
}
