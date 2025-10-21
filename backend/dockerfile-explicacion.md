Guarda esto como ./backend/Dockerfile:

Dockerfile
# 1. IMAGEN BASE: Usa una imagen ligera de Node.js (Alpine es ideal para contenedores)
FROM node:20-alpine

# 2. DIRECTORIO DE TRABAJO: Establece /app como el directorio principal
WORKDIR /app

# 3. INSTALACIÓN DE DEPENDENCIAS
# Copia solo los archivos necesarios para instalar dependencias.
# Esto optimiza el caché: si solo cambias tu código, Docker no reinstala dependencias.
COPY package.json pnpm-lock.yaml ./ 

# Usa pnpm para instalar las dependencias
# Se instala pnpm globalmente en el contenedor y luego se ejecuta la instalación
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# 4. CÓDIGO FUENTE
# Copia todo el código fuente del proyecto a /app
# Lo hacemos al final para maximizar el caché de la capa de dependencias
COPY . .

# 5. EJECUCIÓN
# Comando que se ejecuta al iniciar el contenedor
# 'dev' o 'start' deben estar definidos en tu package.json
CMD ["pnpm", "start"] 
2. Justificación Técnica de las Instrucciones
Sobre el uso de npm dentro del Dockerfile 🧐
Pregunta: ¿Por qué usar npm install -g pnpm si estoy usando pnpm en el host?

Respuesta: Tienes que instalar pnpm dentro del contenedor. El contenedor se crea a partir de una imagen base (node:20-alpine) que solo tiene node y npm por defecto. Para que el comando pnpm install funcione dentro del contenedor, debemos usar el npm que viene preinstalado para instalar pnpm de forma global en esa instancia aislada. Luego, el resto de las operaciones usan el eficiente pnpm.

![alt text](image.png)