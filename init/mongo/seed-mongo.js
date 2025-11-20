// ============================================================
// SEED EXHAUSTIVO MONGODB - SIMULACIÓN IOT REALISTA
// ============================================================

db = db.getSiblingDB('clima_db');

print("🧹 Limpiando colecciones...");
db.sensores.deleteMany({});
db.mediciones.deleteMany({});
db.proceso.deleteMany({});
db.conversaciones.deleteMany({});

// ------------------------------------------------------------
// 1. CATÁLOGO DE 10 PROCESOS (Servicios Variados)
// ------------------------------------------------------------
const catalogoProcesos = [
    // Reportes
    { nombre: 'Informe Máx/Mín', descripcion: 'Estadísticas extremas', costo: 50.00, codigo: 'INFORME_MAXIMAS_MINIMAS' },
    { nombre: 'Informe Promedios', descripcion: 'Tendencia media', costo: 40.00, codigo: 'INFORME_PROMEDIOS' },
    { nombre: 'Análisis de Desviación', descripcion: 'Cálculo de varianza', costo: 60.00, codigo: 'ANALISIS_DESVIACION' },
    
    // Monitoreo
    { nombre: 'Detección de Alertas', descripcion: 'Búsqueda de valores fuera de rango', costo: 25.00, codigo: 'BUSCAR_ALERTAS' },
    { nombre: 'Consulta Raw Data', descripcion: 'Descarga de datos crudos', costo: 10.00, codigo: 'CONSULTAR_DATOS' },
    { nombre: 'Estado de Salud', descripcion: 'Verifica batería y conectividad', costo: 15.00, codigo: 'CHECK_SALUD' },

    // Acciones Remotas (Simuladas)
    { nombre: 'Reinicio Remoto', descripcion: 'Reinicia el microcontrolador', costo: 5.00, codigo: 'ACCION_REINICIO' },
    { nombre: 'Calibración de Sensores', descripcion: 'Ajuste de offset remoto', costo: 100.00, codigo: 'ACCION_CALIBRAR' },
    { nombre: 'Actualizar Firmware', descripcion: 'Update OTA', costo: 0.00, codigo: 'ACCION_UPDATE' },

    // Administrativos
    { nombre: 'Suscripción Mensual', descripcion: 'Acceso ilimitado por 30 días', costo: 500.00, codigo: 'SUSCRIPCION' }
];

db.proceso.insertMany(catalogoProcesos);
print("✅ 10 Procesos insertados.");

// ------------------------------------------------------------
// 2. GENERACIÓN DE 1000 SENSORES (Clusters Geográficos)
// ------------------------------------------------------------

// Definimos "Zonas Maestras" con coordenadas reales
const ZONAS = [
    { ciudad: "Buenos Aires", pais: "Argentina", lat: -34.6037, lon: -58.3816 },
    { ciudad: "Córdoba", pais: "Argentina", lat: -31.4201, lon: -64.1888 },
    { ciudad: "Mendoza", pais: "Argentina", lat: -32.8895, lon: -68.8458 },
    { ciudad: "Santiago", pais: "Chile", lat: -33.4489, lon: -70.6693 },
    { ciudad: "Montevideo", pais: "Uruguay", lat: -34.9011, lon: -56.1645 }
];

const TIPOS = ['Temperatura', 'Humedad', 'Temperatura/Humedad'];
const ESTADOS = ['activo', 'activo', 'activo', 'inactivo', 'falla']; // Más prob. de activo

let sensoresGenerados = [];
const TOTAL_SENSORES = 1000;
const SENSORES_POR_ZONA = TOTAL_SENSORES / ZONAS.length; // 200 por ciudad

ZONAS.forEach(zona => {
    for (let i = 0; i < SENSORES_POR_ZONA; i++) {
        // Generar variación geográfica pequeña (simular distribución en la ciudad)
        const latVar = (Math.random() - 0.5) * 0.1; // +/- 0.05 grados
        const lonVar = (Math.random() - 0.5) * 0.1;

        sensoresGenerados.push({
            nombre: `Sensor ${zona.ciudad} #${i + 1}`,
            configuracion: {
                tipo_sensor: TIPOS[Math.floor(Math.random() * TIPOS.length)],
                estado_sensor: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
                fechaInicioMedicion: new Date("2024-01-01")
            },
            ubicacion: {
                pais: zona.pais,
                ciudad: zona.ciudad,
                lat: zona.lat + latVar,
                lon: zona.lon + lonVar
            }
        });
    }
});

const resultadoSensores = db.sensores.insertMany(sensoresGenerados);
// Convertimos el objeto de IDs insertados a un array limpio
const sensorIds = Object.values(resultadoSensores.insertedIds);
print(`✅ ${sensorIds.length} Sensores insertados en 5 ciudades.`);


// ------------------------------------------------------------
// 3. GENERACIÓN DE 2000+ MEDICIONES (Historial Reciente)
// ------------------------------------------------------------

const medicionesGeneradas = [];
const AHORA = new Date();

// Generamos historial para CADA sensor (para que todos tengan datos)
sensorIds.forEach((id, index) => {
    // Simulamos que cada sensor mandó 2 datos recientes
    // Dato 1: Hace 1 hora
    medicionesGeneradas.push({
        sensor_id: id,
        timestamp: new Date(AHORA.getTime() - 3600000), 
        temperatura: parseFloat((Math.random() * 30 + 10).toFixed(2)), // 10 a 40 grados
        humedad: parseFloat((Math.random() * 60 + 30).toFixed(2))      // 30 a 90%
    });

    // Dato 2: Hace 5 minutos
    medicionesGeneradas.push({
        sensor_id: id,
        timestamp: new Date(AHORA.getTime() - 300000), 
        temperatura: parseFloat((Math.random() * 30 + 10).toFixed(2)),
        humedad: parseFloat((Math.random() * 60 + 30).toFixed(2))
    });
});

// Insertamos algunos casos extremos para probar ALERTAS
// Sensor de prueba (el primero de la lista) con ALTA TEMPERATURA
medicionesGeneradas.push({
    sensor_id: sensorIds[0],
    timestamp: new Date(),
    temperatura: 45.5, // ¡ALERTA!
    humedad: 20.0
});

db.mediciones.insertMany(medicionesGeneradas);
print(`✅ ${medicionesGeneradas.length} Mediciones insertadas.`);