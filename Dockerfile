FROM node:20-alpine AS build

# 1. Construimos el frontend
WORKDIR /app

# Copiamos archivos base
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.* ./

# Copiamos código (ajusta si falta alguna carpeta)
COPY backend ./backend
COPY components ./components
COPY contexts ./contexts
COPY controllers ./controllers
COPY pages ./pages
COPY services ./services
COPY utils ./utils
COPY index.html index.tsx index.css ./ 

RUN npm install
RUN npm run build

# 2. Imagen final para producción
FROM node:20-alpine

WORKDIR /app

# Copiamos todo lo construido
COPY --from=build /app ./

# Usaremos las variables de entorno que pone Dokploy,
# no hardcodees nada aquí.
ENV NODE_ENV=production

EXPOSE 3001

# Arranca el backend que sirve API + frontend compilado
CMD ["node", "backend/server.js"]
