-- ============================================================
-- SEED EXHAUSTIVO - VERSIÓN FINAL CORREGIDA
-- Contraseña para TODOS los usuarios: admin123
-- Hash validado: $2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u
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

-- Usuario 101: ADMINISTRADOR GLOBAL
-- Rol: 3 (admin) | Pass: admin123
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (101, 'Admin General', 'admin@clima.io', 3, TRUE);

INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") 
VALUES (101, '$2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u');

INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (101, 100000.00);


-- Usuario 102: TÉCNICO DE CAMPO
-- Rol: 2 (tecnico) | Pass: admin123
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (102, 'Roberto Técnico', 'roberto@servicios.com', 2, TRUE);

INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") 
VALUES (102, '$2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u');

INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (102, 0.00);


-- Usuario 103: CLIENTE VIP
-- Rol: 1 (usuario) | Pass: admin123
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (103, 'AgroSojera S.A.', 'compras@agro.com', 1, TRUE);

INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") 
VALUES (103, '$2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u');

INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (103, 5000.00);


-- Usuario 104: CLIENTE MOROSO
-- Rol: 1 (usuario) | Pass: admin123
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (104, 'Juan Perez', 'juan@gmail.com', 1, TRUE);

INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") 
VALUES (104, '$2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u');

INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (104, 10.00);


-- Usuario 105: CLIENTE NUEVO
-- Rol: 1 (usuario) | Pass: admin123
INSERT INTO "Usuario" ("usuario_id", "nombre", "mail", "rol_id", "isActive") 
VALUES (105, 'Lucia Nueva', 'lucia@hotmail.com', 1, TRUE);

INSERT INTO "Usuario_Credencial" ("usuario_id", "contraseña") 
VALUES (105, '$2b$10$5T9uYNkUyq/zKSLbG5wBXOiA3wVeidX6MT3Qjhbf8Hd2XoVzwQB0u');

INSERT INTO "Cuentas_Corrientes" ("usuario_id", "saldoActual") VALUES (105, 0.00);


-- Ajustamos la secuencia para evitar errores al crear nuevos usuarios
SELECT setval(pg_get_serial_sequence('"Usuario"', 'usuario_id'), 106);