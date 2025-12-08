db = db.getSiblingDB('clima_db');

print("🧹 Limpiando colecciones...");
db.sensores.deleteMany({});
db.mediciones.deleteMany({});
db.proceso.deleteMany({});
db.conversaciones.deleteMany({});

// ------------------------------------------------------------
// 1. CATÁLOGO DE PROCESOS 
// ------------------------------------------------------------
print("⏳ Insertando procesos...");
db.proceso.insertMany([
    { nombre: 'Informe Máx/Mín', descripcion: 'Maximos y minimos', costo: 50.00, codigo: 'INFORME_MAXIMAS_MINIMAS',complejidad:'MEDIA' },
    { nombre: 'Informe Promedios', descripcion: 'Promedio de valores', costo: 40.00, codigo: 'INFORME_PROMEDIOS',complejidad:'MEDIA' },
    { nombre: 'Consulta Raw Data', descripcion: 'Datos crudos', costo: 10.00, codigo: 'CONSULTAR_DATOS',complejidad:'BAJA' },
    { nombre: 'Detección de Alertas', descripcion: 'Valores fuera de un rango', costo: 25.00, codigo: 'BUSCAR_ALERTAS',complejidad:'MEDIA' },
    { nombre: 'Análisis de Desviación', descripcion: 'Calculo de desviaciones estandar', costo: 35.00, codigo: 'ANALISIS_DESVIACION', complejidad:'MEDIA' },
    { nombre: 'Estado de Salud', descripcion: 'Verifica estado del sensor', costo: 15.00, codigo: 'CHECK_SALUD', complejidad:'BAJA' },
    { nombre: 'Reportes Periodicos',descripcion: 'Reportes por Ciudad/Mes/Año', costo: 150.00,  codigo: 'REPORTE_PERIODICO',complejidad: 'ALTA' }
]);
print("✅ Procesos insertados.");

// ------------------------------------------------------------
// 2. SENSORES 
// ------------------------------------------------------------
print("⏳ Insertando sensores...");
var resultadoSensores = db.sensores.insertMany([
    // Buenos Aires (5 sensores)
    { nombre: 'Estación Buenos Aires Norte #1', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Buenos Aires', lat: -34.5537, lon: -58.4316 } },
    { nombre: 'Nodo Buenos Aires Sur #2', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Buenos Aires', lat: -34.6537, lon: -58.3316 } },
    { nombre: 'Baliza Buenos Aires Este #3', configuracion: { tipo_sensor: 'temperatura/humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Buenos Aires', lat: -34.6037, lon: -58.2816 } },
    { nombre: 'Estación Buenos Aires Oeste #4', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'inactivo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Buenos Aires', lat: -34.6037, lon: -58.4816 } },
    { nombre: 'Nodo Buenos Aires Central #5', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'falla', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Buenos Aires', lat: -34.6037, lon: -58.3816 } },
    
    // Córdoba (5 sensores)
    { nombre: 'Sierra Córdoba Norte #1', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Córdoba', lat: -31.3701, lon: -64.2388 } },
    { nombre: 'Campo Córdoba Sur #2', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Córdoba', lat: -31.4701, lon: -64.1388 } },
    { nombre: 'Antena Córdoba Este #3', configuracion: { tipo_sensor: 'temperatura/humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Córdoba', lat: -31.4201, lon: -64.0888 } },
    { nombre: 'Sierra Córdoba Oeste #4', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'inactivo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Córdoba', lat: -31.4201, lon: -64.2888 } },
    { nombre: 'Campo Córdoba Central #5', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'falla', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Córdoba', lat: -31.4201, lon: -64.1888 } },
    
    // Mendoza (5 sensores)
    { nombre: 'Viñedo Mendoza Norte #1', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Mendoza', lat: -32.8395, lon: -68.8958 } },
    { nombre: 'Bodega Mendoza Sur #2', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Mendoza', lat: -32.9395, lon: -68.7958 } },
    { nombre: 'Cordillera Mendoza Este #3', configuracion: { tipo_sensor: 'temperatura/humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Mendoza', lat: -32.8895, lon: -68.7458 } },
    { nombre: 'Viñedo Mendoza Oeste #4', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'inactivo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Mendoza', lat: -32.8895, lon: -68.9458 } },
    { nombre: 'Bodega Mendoza Central #5', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'falla', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Argentina', ciudad: 'Mendoza', lat: -32.8895, lon: -68.8458 } },
    
    // Santiago (5 sensores)
    { nombre: 'Centro Santiago Norte #1', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Chile', ciudad: 'Santiago', lat: -33.3989, lon: -70.7193 } },
    { nombre: 'Valle Santiago Sur #2', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Chile', ciudad: 'Santiago', lat: -33.4989, lon: -70.6193 } },
    { nombre: 'Edificio Santiago Este #3', configuracion: { tipo_sensor: 'temperatura/humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Chile', ciudad: 'Santiago', lat: -33.4489, lon: -70.5693 } },
    { nombre: 'Centro Santiago Oeste #4', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'inactivo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Chile', ciudad: 'Santiago', lat: -33.4489, lon: -70.7693 } },
    { nombre: 'Valle Santiago Central #5', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'falla', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Chile', ciudad: 'Santiago', lat: -33.4489, lon: -70.6693 } },
    
    // Montevideo (5 sensores)
    { nombre: 'Puerto Montevideo Norte #1', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Uruguay', ciudad: 'Montevideo', lat: -34.8511, lon: -56.2145 } },
    { nombre: 'Rambla Montevideo Sur #2', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Uruguay', ciudad: 'Montevideo', lat: -34.9511, lon: -56.1145 } },
    { nombre: 'Plaza Montevideo Este #3', configuracion: { tipo_sensor: 'temperatura/humedad', estado_sensor: 'activo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Uruguay', ciudad: 'Montevideo', lat: -34.9011, lon: -56.0645 } },
    { nombre: 'Puerto Montevideo Oeste #4', configuracion: { tipo_sensor: 'temperatura', estado_sensor: 'inactivo', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Uruguay', ciudad: 'Montevideo', lat: -34.9011, lon: -56.2645 } },
    { nombre: 'Rambla Montevideo Central #5', configuracion: { tipo_sensor: 'humedad', estado_sensor: 'falla', fechaInicioMedicion: new Date("2024-01-01") }, ubicacion: { pais: 'Uruguay', ciudad: 'Montevideo', lat: -34.9011, lon: -56.1645 } }
]);
var sensorIds = Object.values(resultadoSensores.insertedIds);
print("✅ 25 Sensores insertados.");

// ------------------------------------------------------------
// 3. MEDICIONES 
// ------------------------------------------------------------
print("⏳ Generando mediciones");

var mediciones = [];
var fechaInicio = new Date("2020-01-01T00:00:00Z").getTime();
var fechaFin = new Date("2025-12-31T23:59:59Z").getTime();

sensorIds.forEach(sensorId => {
    for (let i = 0; i < 150; i++) {
        
        var tiempoAleatorio = Math.random() * (fechaFin - fechaInicio);
        var fechaMedicion = new Date(fechaInicio + tiempoAleatorio);

        // Temp: entre 5°C y 40°C
        var tempRandom = (Math.random() * (40 - 5) + 5).toFixed(2);
        // Humedad: entre 30% y 90%
        var humRandom = (Math.random() * (90 - 30) + 30).toFixed(2);

        // Alerta Ocasional
        if (Math.random() < 0.01) {
            tempRandom = 47.50; 
        }

        mediciones.push({
            sensor_id: sensorId,
            timestamp: fechaMedicion,
            temperatura: parseFloat(tempRandom),
            humedad: parseFloat(humRandom)
        });
    }
});

db.mediciones.insertMany(mediciones);
print(`✅ ${mediciones.length} Mediciones insertadas.`);