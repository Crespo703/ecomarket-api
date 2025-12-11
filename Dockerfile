# =========================
# STAGE 1: BUILD
# =========================
FROM node:20-bullseye AS builder

WORKDIR /app

# Copiamos package.json y lock
COPY package*.json ./

# Instalamos TODAS las dependencias
RUN npm ci

# Copiamos el resto del proyecto
COPY . .

# Compilamos NestJS
RUN npm run build


# =========================
# STAGE 2: RUNTIME
# =========================
FROM node:20-bullseye

WORKDIR /app

# Copiamos solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Puerto por defecto de Nest
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
