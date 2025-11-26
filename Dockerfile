# Build stage
FROM node:20-alpine AS build

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

COPY index.html index.tsx index.css App.tsx constants.ts types.ts ./

RUN npm install
RUN npm run build

# --- Final stage (serve frontend with nginx) ---
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
