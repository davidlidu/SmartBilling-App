# --- Stage 1: Build frontend ---
    FROM node:20-alpine AS frontend

    WORKDIR /app
    
    COPY package*.json ./
    COPY tsconfig.json ./
    COPY vite.config.* ./
    
    COPY components ./components
    COPY contexts ./contexts
    COPY controllers ./controllers
    COPY pages ./pages
    COPY services ./services
    COPY utils ./utils
    COPY index.html index.tsx index.css ./
    COPY App.tsx ./

    
    # NO public folder — removed
    # COPY public ./public
    
    RUN npm install
    RUN npm run build
    
    
    # --- Stage 2: Backend + final image ---
    FROM node:20-alpine
    
    WORKDIR /app
    
    # Copiar backend
    COPY backend ./backend
    
    # Copiar frontend ya construido
    COPY --from=frontend /app/dist ./dist
    
    # Instalar dependencias del backend
    WORKDIR /app/backend
    COPY backend/package*.json ./
    RUN npm install --production
    
    ENV NODE_ENV=production
    ENV PORT=3001
    
    EXPOSE 3001
    
    CMD ["node", "server.js"]
    