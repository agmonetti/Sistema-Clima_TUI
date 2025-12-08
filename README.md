# Sistema de Monitoreo Climático - TUI

Sistema poliglota de monitoreo de sensores climáticos con interfaz de terminal interactiva.
Una TUI (Text User Interface) es una interfaz de usuario basada en texto que se ejecuta en la terminal. A diferencia de una API REST que expone endpoints HTTP y devuelve JSON, la TUI ofrece:

- Menús navegables con flechas del teclado (↑↓)
- Inputs interactivos con validación en tiempo real
- Contraseñas ocultas (se muestran como ***)
- Tablas ASCII con bordes y colores
- Colores para destacar información importante
- Spinners que indican operaciones en progreso

##  Descripción

Aplicación que gestiona sensores de temperatura/humedad utilizando tres bases de datos especializadas:
- **PostgreSQL**: Usuarios, transacciones y facturación
- **MongoDB**: Mediciones de sensores y procesos
- **Redis**: Caché de estado en tiempo real

## Características

- Sistema de autenticación con roles (usuario, técnico, admin)
- Ingestión y consulta de mediciones climáticas
- Sistema de cobro por procesos de análisis
- Detección de alertas por umbrales
- Sistema de mensajería entre usuarios
- Reportes estadísticos (promedios, máximas, mínimas, desviación)
- Caché inteligente de consultas frecuentes

## Stack

- **Runtime**: Node.js 20
- **Gestor de paquetes**: pnpm
- **Bases de datos**: PostgreSQL 14, MongoDB 7, Redis
- **Contenedores**: Docker Compose

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd tp-poliglota-tui

# Configurar variables de entorno
cp .env.example .env

# Levantar la infraestructura, conectar las bases de datos e iniciar la interfaz en un solo paso
docker compose run --rm backend

```

## Uso

**Usuarios disponibles por defecto:**
- Admin: `admin@sistema.com`  `admin123`
- Usuario: `usuario@test.com` `admin123`
- Técnico: `tecnico@sistema.com` `admin123`


## Sobre proyecto

Proyecto académico: Universidad Argentina de la Empresa (UADE)
Materia: Ingenieria de Datos II (No Relacionales)


**Autor**: Agustín Monetti