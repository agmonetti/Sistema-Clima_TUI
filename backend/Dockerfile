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

CMD ["tail", "-f", "/dev/null"]
#Le dice al docker que mantenga el contenedor en ejecución sin hacer nada.
#CMD ["pnpm", "start"]