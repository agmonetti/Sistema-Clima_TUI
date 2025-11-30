db = db.getSiblingDB('clima_db');

print("🧹 Limpiando colecciones...");
db.sensores.deleteMany({});
db.mediciones.deleteMany({});
db.proceso.deleteMany({});
db.conversaciones.deleteMany({});

// ------------------------------------------------------------
// 1. CATÁLOGO DE PROCESOS (hardcoded)
// ------------------------------------------------------------
print("⏳ Insertando procesos...");
db.proceso.insertMany([
    { nombre: 'Informe Máx/Mín', descripcion: 'Estadísticas extremas', costo: 50.00, codigo: 'INFORME_MAXIMAS_MINIMAS',complejidad:'MEDIA' },
    { nombre: 'Informe Promedios', descripcion: 'Tendencia media', costo: 40.00, codigo: 'INFORME_PROMEDIOS',complejidad:'MEDIA' },
    { nombre: 'Consulta Raw Data', descripcion: 'Descarga de datos crudos', costo: 10.00, codigo: 'CONSULTAR_DATOS',complejidad:'BAJA' },
    { nombre: 'Detección de Alertas', descripcion: 'Búsqueda de valores fuera de rango', costo: 25.00, codigo: 'BUSCAR_ALERTAS',complejidad:'MEDIA' },
    { nombre: 'Análisis de Desviación', descripcion: 'Cálculo de desviaciones estándar', costo: 35.00, codigo: 'ANALISIS_DESVIACION', complejidad:'MEDIA' },
    { nombre: 'Estado de Salud', descripcion: 'Verifica batería y conectividad', costo: 15.00, codigo: 'CHECK_SALUD', complejidad:'BAJA' },
    { nombre: 'Reportes Periodicos',descripcion: 'Promedios agrupados por Ciudad/Mes', costo: 150.00,  codigo: 'REPORTE_PERIODICO',complejidad: 'ALTA' }
]);
print("✅ Procesos insertados.");

// ------------------------------------------------------------
// 2. SENSORES (25 sensores hardcoded, 5 por zona)
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
// 3. MEDICIONES (4 por sensor + 1 alerta, hardcoded)
// ------------------------------------------------------------
print("⏳ Insertando mediciones...");
db.mediciones.insertMany([
    // Buenos Aires sensor 1 (4 mediciones)
    { sensor_id: sensorIds[0], timestamp: new Date("2023-03-15T10:30:00Z"), temperatura: 22.50, humedad: 65.30 },
    { sensor_id: sensorIds[0], timestamp: new Date("2023-06-20T14:45:00Z"), temperatura: 15.80, humedad: 72.10 },
    { sensor_id: sensorIds[0], timestamp: new Date("2023-09-10T08:15:00Z"), temperatura: 18.20, humedad: 58.40 },
    { sensor_id: sensorIds[0], timestamp: new Date("2024-01-05T16:00:00Z"), temperatura: 28.90, humedad: 45.60 },
    
    // Buenos Aires sensor 2 (4 mediciones)
    { sensor_id: sensorIds[1], timestamp: new Date("2023-04-12T11:20:00Z"), temperatura: 20.10, humedad: 68.50 },
    { sensor_id: sensorIds[1], timestamp: new Date("2023-07-25T15:30:00Z"), temperatura: 12.40, humedad: 75.20 },
    { sensor_id: sensorIds[1], timestamp: new Date("2023-10-08T09:45:00Z"), temperatura: 19.60, humedad: 62.80 },
    { sensor_id: sensorIds[1], timestamp: new Date("2024-02-14T17:10:00Z"), temperatura: 26.30, humedad: 48.90 },
    
    // Buenos Aires sensor 3 (4 mediciones)
    { sensor_id: sensorIds[2], timestamp: new Date("2023-02-28T12:00:00Z"), temperatura: 25.70, humedad: 55.40 },
    { sensor_id: sensorIds[2], timestamp: new Date("2023-05-18T16:20:00Z"), temperatura: 17.30, humedad: 70.60 },
    { sensor_id: sensorIds[2], timestamp: new Date("2023-08-22T10:30:00Z"), temperatura: 14.90, humedad: 78.30 },
    { sensor_id: sensorIds[2], timestamp: new Date("2024-03-01T14:15:00Z"), temperatura: 24.10, humedad: 52.70 },
    
    // Buenos Aires sensor 4 (4 mediciones)
    { sensor_id: sensorIds[3], timestamp: new Date("2023-01-20T13:45:00Z"), temperatura: 29.80, humedad: 42.10 },
    { sensor_id: sensorIds[3], timestamp: new Date("2023-04-30T17:00:00Z"), temperatura: 18.50, humedad: 67.40 },
    { sensor_id: sensorIds[3], timestamp: new Date("2023-07-15T11:30:00Z"), temperatura: 11.20, humedad: 80.50 },
    { sensor_id: sensorIds[3], timestamp: new Date("2024-01-28T15:45:00Z"), temperatura: 27.60, humedad: 46.30 },
    
    // Buenos Aires sensor 5 (4 mediciones)
    { sensor_id: sensorIds[4], timestamp: new Date("2023-03-08T14:30:00Z"), temperatura: 23.40, humedad: 59.80 },
    { sensor_id: sensorIds[4], timestamp: new Date("2023-06-12T18:15:00Z"), temperatura: 13.70, humedad: 74.90 },
    { sensor_id: sensorIds[4], timestamp: new Date("2023-09-25T12:45:00Z"), temperatura: 20.80, humedad: 61.20 },
    { sensor_id: sensorIds[4], timestamp: new Date("2024-02-20T16:30:00Z"), temperatura: 25.50, humedad: 50.40 },
    
    // Córdoba sensor 6 (4 mediciones)
    { sensor_id: sensorIds[5], timestamp: new Date("2023-02-14T10:00:00Z"), temperatura: 26.20, humedad: 48.60 },
    { sensor_id: sensorIds[5], timestamp: new Date("2023-05-22T14:30:00Z"), temperatura: 19.40, humedad: 63.70 },
    { sensor_id: sensorIds[5], timestamp: new Date("2023-08-18T09:15:00Z"), temperatura: 16.80, humedad: 71.40 },
    { sensor_id: sensorIds[5], timestamp: new Date("2024-01-12T15:00:00Z"), temperatura: 30.10, humedad: 38.90 },
    
    // Córdoba sensor 7 (4 mediciones)
    { sensor_id: sensorIds[6], timestamp: new Date("2023-03-22T11:45:00Z"), temperatura: 24.50, humedad: 54.20 },
    { sensor_id: sensorIds[6], timestamp: new Date("2023-06-28T15:00:00Z"), temperatura: 14.20, humedad: 76.80 },
    { sensor_id: sensorIds[6], timestamp: new Date("2023-09-14T10:30:00Z"), temperatura: 21.70, humedad: 58.90 },
    { sensor_id: sensorIds[6], timestamp: new Date("2024-02-08T16:45:00Z"), temperatura: 28.30, humedad: 44.10 },
    
    // Córdoba sensor 8 (4 mediciones)
    { sensor_id: sensorIds[7], timestamp: new Date("2023-01-30T12:15:00Z"), temperatura: 27.90, humedad: 46.30 },
    { sensor_id: sensorIds[7], timestamp: new Date("2023-04-18T16:30:00Z"), temperatura: 20.60, humedad: 62.50 },
    { sensor_id: sensorIds[7], timestamp: new Date("2023-07-24T11:00:00Z"), temperatura: 13.10, humedad: 79.20 },
    { sensor_id: sensorIds[7], timestamp: new Date("2024-03-05T14:45:00Z"), temperatura: 25.80, humedad: 51.60 },
    
    // Córdoba sensor 9 (4 mediciones)
    { sensor_id: sensorIds[8], timestamp: new Date("2023-02-25T13:30:00Z"), temperatura: 25.30, humedad: 52.40 },
    { sensor_id: sensorIds[8], timestamp: new Date("2023-05-30T17:15:00Z"), temperatura: 17.80, humedad: 68.70 },
    { sensor_id: sensorIds[8], timestamp: new Date("2023-08-28T12:00:00Z"), temperatura: 15.40, humedad: 73.60 },
    { sensor_id: sensorIds[8], timestamp: new Date("2024-01-22T15:30:00Z"), temperatura: 29.20, humedad: 40.80 },
    
    // Córdoba sensor 10 (4 mediciones)
    { sensor_id: sensorIds[9], timestamp: new Date("2023-03-18T14:00:00Z"), temperatura: 23.70, humedad: 57.90 },
    { sensor_id: sensorIds[9], timestamp: new Date("2023-06-08T18:30:00Z"), temperatura: 12.90, humedad: 77.40 },
    { sensor_id: sensorIds[9], timestamp: new Date("2023-09-20T11:15:00Z"), temperatura: 22.10, humedad: 60.50 },
    { sensor_id: sensorIds[9], timestamp: new Date("2024-02-28T16:00:00Z"), temperatura: 26.60, humedad: 47.20 },
    
    // Mendoza sensor 11 (4 mediciones)
    { sensor_id: sensorIds[10], timestamp: new Date("2023-01-15T10:45:00Z"), temperatura: 31.20, humedad: 35.80 },
    { sensor_id: sensorIds[10], timestamp: new Date("2023-04-22T14:00:00Z"), temperatura: 22.80, humedad: 56.40 },
    { sensor_id: sensorIds[10], timestamp: new Date("2023-07-18T09:30:00Z"), temperatura: 10.50, humedad: 82.10 },
    { sensor_id: sensorIds[10], timestamp: new Date("2024-01-08T15:15:00Z"), temperatura: 32.40, humedad: 32.60 },
    
    // Mendoza sensor 12 (4 mediciones)
    { sensor_id: sensorIds[11], timestamp: new Date("2023-02-20T11:30:00Z"), temperatura: 28.60, humedad: 42.90 },
    { sensor_id: sensorIds[11], timestamp: new Date("2023-05-28T15:45:00Z"), temperatura: 18.90, humedad: 65.30 },
    { sensor_id: sensorIds[11], timestamp: new Date("2023-08-12T10:00:00Z"), temperatura: 14.30, humedad: 76.70 },
    { sensor_id: sensorIds[11], timestamp: new Date("2024-02-15T16:30:00Z"), temperatura: 29.70, humedad: 39.40 },
    
    // Mendoza sensor 13 (4 mediciones)
    { sensor_id: sensorIds[12], timestamp: new Date("2023-03-25T12:45:00Z"), temperatura: 26.40, humedad: 49.50 },
    { sensor_id: sensorIds[12], timestamp: new Date("2023-06-15T16:00:00Z"), temperatura: 15.60, humedad: 72.80 },
    { sensor_id: sensorIds[12], timestamp: new Date("2023-09-08T11:30:00Z"), temperatura: 20.20, humedad: 63.10 },
    { sensor_id: sensorIds[12], timestamp: new Date("2024-03-10T14:15:00Z"), temperatura: 27.80, humedad: 45.70 },
    
    // Mendoza sensor 14 (4 mediciones)
    { sensor_id: sensorIds[13], timestamp: new Date("2023-01-28T13:00:00Z"), temperatura: 30.50, humedad: 37.20 },
    { sensor_id: sensorIds[13], timestamp: new Date("2023-04-08T17:30:00Z"), temperatura: 21.30, humedad: 59.60 },
    { sensor_id: sensorIds[13], timestamp: new Date("2023-07-28T12:15:00Z"), temperatura: 11.80, humedad: 80.40 },
    { sensor_id: sensorIds[13], timestamp: new Date("2024-02-02T15:45:00Z"), temperatura: 31.10, humedad: 34.90 },
    
    // Mendoza sensor 15 (4 mediciones)
    { sensor_id: sensorIds[14], timestamp: new Date("2023-02-08T14:15:00Z"), temperatura: 29.30, humedad: 41.60 },
    { sensor_id: sensorIds[14], timestamp: new Date("2023-05-15T18:00:00Z"), temperatura: 19.70, humedad: 64.20 },
    { sensor_id: sensorIds[14], timestamp: new Date("2023-08-25T13:30:00Z"), temperatura: 13.60, humedad: 78.50 },
    { sensor_id: sensorIds[14], timestamp: new Date("2024-01-18T16:15:00Z"), temperatura: 30.80, humedad: 36.30 },
    
    // Santiago sensor 16 (4 mediciones)
    { sensor_id: sensorIds[15], timestamp: new Date("2023-03-10T10:30:00Z"), temperatura: 24.80, humedad: 53.70 },
    { sensor_id: sensorIds[15], timestamp: new Date("2023-06-22T14:45:00Z"), temperatura: 11.40, humedad: 81.20 },
    { sensor_id: sensorIds[15], timestamp: new Date("2023-09-18T09:00:00Z"), temperatura: 18.60, humedad: 66.40 },
    { sensor_id: sensorIds[15], timestamp: new Date("2024-02-25T15:30:00Z"), temperatura: 26.90, humedad: 47.80 },
    
    // Santiago sensor 17 (4 mediciones)
    { sensor_id: sensorIds[16], timestamp: new Date("2023-01-22T11:15:00Z"), temperatura: 28.20, humedad: 44.50 },
    { sensor_id: sensorIds[16], timestamp: new Date("2023-04-28T15:30:00Z"), temperatura: 19.10, humedad: 67.90 },
    { sensor_id: sensorIds[16], timestamp: new Date("2023-07-22T10:45:00Z"), temperatura: 10.80, humedad: 83.60 },
    { sensor_id: sensorIds[16], timestamp: new Date("2024-03-08T14:00:00Z"), temperatura: 25.40, humedad: 51.30 },
    
    // Santiago sensor 18 (4 mediciones)
    { sensor_id: sensorIds[17], timestamp: new Date("2023-02-18T12:30:00Z"), temperatura: 26.70, humedad: 48.20 },
    { sensor_id: sensorIds[17], timestamp: new Date("2023-05-25T16:45:00Z"), temperatura: 16.40, humedad: 73.50 },
    { sensor_id: sensorIds[17], timestamp: new Date("2023-08-15T11:00:00Z"), temperatura: 14.70, humedad: 77.80 },
    { sensor_id: sensorIds[17], timestamp: new Date("2024-01-30T15:15:00Z"), temperatura: 28.50, humedad: 43.60 },
    
    // Santiago sensor 19 (4 mediciones)
    { sensor_id: sensorIds[18], timestamp: new Date("2023-03-28T13:45:00Z"), temperatura: 23.90, humedad: 56.80 },
    { sensor_id: sensorIds[18], timestamp: new Date("2023-06-05T17:00:00Z"), temperatura: 13.20, humedad: 79.40 },
    { sensor_id: sensorIds[18], timestamp: new Date("2023-09-28T12:30:00Z"), temperatura: 21.50, humedad: 62.10 },
    { sensor_id: sensorIds[18], timestamp: new Date("2024-02-12T16:45:00Z"), temperatura: 27.20, humedad: 46.50 },
    
    // Santiago sensor 20 (4 mediciones)
    { sensor_id: sensorIds[19], timestamp: new Date("2023-01-08T14:00:00Z"), temperatura: 29.60, humedad: 40.30 },
    { sensor_id: sensorIds[19], timestamp: new Date("2023-04-15T18:15:00Z"), temperatura: 20.30, humedad: 61.70 },
    { sensor_id: sensorIds[19], timestamp: new Date("2023-07-10T13:30:00Z"), temperatura: 12.50, humedad: 78.90 },
    { sensor_id: sensorIds[19], timestamp: new Date("2024-03-02T15:00:00Z"), temperatura: 26.10, humedad: 49.80 },
    
    // Montevideo sensor 21 (4 mediciones)
    { sensor_id: sensorIds[20], timestamp: new Date("2023-02-12T10:15:00Z"), temperatura: 27.40, humedad: 58.90 },
    { sensor_id: sensorIds[20], timestamp: new Date("2023-05-20T14:30:00Z"), temperatura: 17.60, humedad: 71.30 },
    { sensor_id: sensorIds[20], timestamp: new Date("2023-08-08T09:45:00Z"), temperatura: 12.80, humedad: 82.70 },
    { sensor_id: sensorIds[20], timestamp: new Date("2024-01-25T15:00:00Z"), temperatura: 29.10, humedad: 54.20 },
    
    // Montevideo sensor 22 (4 mediciones)
    { sensor_id: sensorIds[21], timestamp: new Date("2023-03-15T11:30:00Z"), temperatura: 25.20, humedad: 62.40 },
    { sensor_id: sensorIds[21], timestamp: new Date("2023-06-25T15:45:00Z"), temperatura: 14.50, humedad: 76.10 },
    { sensor_id: sensorIds[21], timestamp: new Date("2023-09-12T10:00:00Z"), temperatura: 19.30, humedad: 68.50 },
    { sensor_id: sensorIds[21], timestamp: new Date("2024-02-18T16:15:00Z"), temperatura: 27.80, humedad: 55.80 },
    
    // Montevideo sensor 23 (4 mediciones)
    { sensor_id: sensorIds[22], timestamp: new Date("2023-01-25T12:45:00Z"), temperatura: 28.90, humedad: 56.30 },
    { sensor_id: sensorIds[22], timestamp: new Date("2023-04-05T16:00:00Z"), temperatura: 21.70, humedad: 64.70 },
    { sensor_id: sensorIds[22], timestamp: new Date("2023-07-30T11:15:00Z"), temperatura: 11.60, humedad: 81.40 },
    { sensor_id: sensorIds[22], timestamp: new Date("2024-03-12T14:30:00Z"), temperatura: 26.40, humedad: 58.10 },
    
    // Montevideo sensor 24 (4 mediciones)
    { sensor_id: sensorIds[23], timestamp: new Date("2023-02-28T13:00:00Z"), temperatura: 26.80, humedad: 60.50 },
    { sensor_id: sensorIds[23], timestamp: new Date("2023-05-12T17:30:00Z"), temperatura: 18.40, humedad: 69.80 },
    { sensor_id: sensorIds[23], timestamp: new Date("2023-08-20T12:45:00Z"), temperatura: 13.90, humedad: 79.60 },
    { sensor_id: sensorIds[23], timestamp: new Date("2024-01-15T15:45:00Z"), temperatura: 28.20, humedad: 53.40 },
    
    // Montevideo sensor 25 (4 mediciones)
    { sensor_id: sensorIds[24], timestamp: new Date("2023-03-05T14:15:00Z"), temperatura: 24.60, humedad: 63.20 },
    { sensor_id: sensorIds[24], timestamp: new Date("2023-06-18T18:45:00Z"), temperatura: 15.80, humedad: 74.50 },
    { sensor_id: sensorIds[24], timestamp: new Date("2023-09-05T13:00:00Z"), temperatura: 20.50, humedad: 66.80 },
    { sensor_id: sensorIds[24], timestamp: new Date("2024-02-22T16:30:00Z"), temperatura: 27.10, humedad: 57.60 },
    
    // Medición de ALERTA (temperatura alta, humedad baja) en sensor 1
    { sensor_id: sensorIds[0], timestamp: new Date("2024-11-24T12:00:00Z"), temperatura: 48.50, humedad: 15.00 }
]);
print("✅ 101 Mediciones insertadas (4 por sensor + 1 alerta).");
