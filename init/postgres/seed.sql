-- ============================================================
-- SEED EXHAUSTIVO POSTGRESQL - ESCENARIOS DE NEGOCIO REALES
-- ============================================================

-- 1. LIMPIEZA TOTAL
TRUNCATE TABLE 
    "Rol", "Metodos_Pago", "Usuario", "Usuario_Credencial", 
    "Solicitud_Proceso", "Facturas", "Historial_Ejecucion_Procesos", 
    "Pagos", "Cuentas_Corrientes", "Movimientos_CC"
RESTART IDENTITY CASCADE;

-- 2. CONFIGURACIÓN MAESTRA
INSERT INTO "Rol" ("descripcion") VALUES 
('usuario'), ('tecnico'), ('admin');

INSERT INTO "Metodos_Pago" ("nombre", "isActive") VALUES 
('Tarjeta Corporativa', TRUE), ('Transferencia Bancaria', TRUE), ('Bitcoin', FALSE);

-- 3. USUARIOS CON PERFILES DE NEGOCIO

-- Usuario 101: ADMINISTRADOR GLOBAL (Puede todo)
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (101, 'Admin General', 'admin@clima.io', 3, TRUE);
INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") VALUES (101, 'admin123');
INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (101, 100000.00); -- Fondo ilimitado

-- Usuario 102: TÉCNICO DE CAMPO (Mantenimiento)
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (102, 'Roberto Técnico', 'roberto@servicios.com', 2, TRUE);
INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") VALUES (102, 'tec123');
INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (102, 0.00); -- Los técnicos no pagan

-- Usuario 103: CLIENTE VIP (Empresa Agrícola - Mucho saldo)
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (103, 'AgroSojera S.A.', 'compras@agro.com', 1, TRUE);
INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") VALUES (103, 'cliente123');
INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (103, 5000.00); -- Saldo para muchas pruebas

-- Usuario 104: CLIENTE MOROSO (Saldo bajo/negativo)
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (104, 'Juan Perez', 'juan@gmail.com', 1, TRUE);
INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") VALUES (104, 'juan123');
INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (104, 10.00); -- Solo le alcanza para consultas baratas

-- Usuario 105: CLIENTE NUEVO (Sin historial)
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (105, 'Lucia Nueva', 'lucia@hotmail.com', 1, TRUE);
INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") VALUES (105, 'lucia123');
INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (105, 0.00); -- Debe fallar al intentar comprar

-- Ajustamos la secuencia para que los próximos usuarios empiecen del 106
SELECT setval(pg_get_serial_sequence('"Usuario"', 'usuario_id'), 106);