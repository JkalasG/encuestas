# ==========================================
# Etapa 1: Compilar el Frontend (React + Vite)
# ==========================================
FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

ARG VITE_MODO_ESPECIAL=true
ENV VITE_MODO_ESPECIAL=${VITE_MODO_ESPECIAL}

RUN npm run build

# ==========================================
# Etapa 2: Compilar el Backend (NestJS + SQLite)
# ==========================================
FROM node:22-bookworm-slim AS backend-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ==========================================
# Etapa 3: Imagen Final de Producción
# ==========================================
FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app/backend

# Copiar dependencias de producción y código compilado del backend
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist

# Copiar el frontend compilado dentro de ./public para servirlo desde NestJS
COPY --from=frontend-builder /app/frontend/dist ./public

# Directorio persistente para la base de datos SQLite
RUN mkdir -p /app/backend/data

EXPOSE 3000

CMD ["node", "dist/main.js"]

