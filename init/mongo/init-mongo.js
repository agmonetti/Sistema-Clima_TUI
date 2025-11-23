db = db.getSiblingDB('clima_db');


db.createCollection("mediciones");
db.createCollection("sensores");
db.createCollection("conversaciones");
db.createCollection("proceso");
db.createCollection("mensajes");

db.mediciones.createIndex(
    { sensor_id: 1, timestamp: -1 }, 
    { name: "idx_sensor_timestamp" }
);

db.sensores.createIndex(
    { "ubicacion.lon": 1, "ubicacion.lat": 1 },
    { name: "idx_ubicacion" }
);

db.conversaciones.createIndex(
    { participantes: 1 }, 
    { name: "idx_participantes" }
);

//indices para los grupos de chat. perimiten saber en que grupo estoy , para ordenar los mensajes de un chat y buscar los mensajes de un chat
db.conversaciones.createIndex({ "miembros": 1 }); 
db.conversaciones.createIndex({ "ultimaActualizacion": -1 });
db.mensajes.createIndex({ "conversacion_id": 1, "timestamp": 1 });