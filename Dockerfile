# --- Stage 1: Build frontend ---
    FROM node:20-alpine AS frontend

    WORKDIR /app
    
    # Base config
    COPY package*.json ./
    COPY tsconfig.json ./
    COPY vite.config.* ./
    COPY metadata.json ./
    COPY types.ts ./
    
    # Source directories
    COPY components ./components
    COPY contexts ./contexts
    COPY controllers ./controllers
    COPY services ./services
    COPY utils ./utils
    
    # Root UI files
    COPY index.html index.tsx index.css ./
    COPY App.tsx ./
    COPY constants.ts ./
    
    # Build
    RUN npm install
    RUN npm run build
    